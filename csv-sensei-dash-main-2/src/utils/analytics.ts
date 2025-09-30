export type TimePoint = { date: string; value: number };

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
}

export function average(values: number[]): number {
  if (!values || values.length === 0) return 0;
  return sum(values) / values.length;
}

export function groupBy<T>(rows: T[], keyFn: (r: T) => string): Record<string, T[]> {
  return rows.reduce((acc, r) => {
    const k = keyFn(r);
    if (!acc[k]) acc[k] = [];
    acc[k].push(r);
    return acc;
  }, {} as Record<string, T[]>);
}

export function parseDate(input: any): Date | null {
  if (!input) return null;
  const d = new Date(String(input));
  return isNaN(d.getTime()) ? null : d;
}

export function formatMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Build monthly series from rows by dateField and valueField
export function buildMonthlySeries(rows: any[], dateField: string, valueField: string): TimePoint[] {
  const monthToValues: Record<string, number[]> = {};
  rows.forEach(r => {
    const d = parseDate(r?.[dateField]);
    const v = Number(r?.[valueField]);
    if (!d || !Number.isFinite(v)) return;
    const m = formatMonth(d);
    if (!monthToValues[m]) monthToValues[m] = [];
    monthToValues[m].push(v);
  });
  return Object.keys(monthToValues)
    .sort()
    .map(m => ({ date: m, value: sum(monthToValues[m]) }));
}

// Simple moving average forecast (next n periods)
export function movingAverageForecast(series: TimePoint[], windowSize = 3, horizon = 3): TimePoint[] {
  if (!series || series.length === 0) return [];
  const values = series.map(p => p.value);
  const lastDate = series[series.length - 1].date;
  const [year, month] = lastDate.split('-').map(n => parseInt(n, 10));

  const avg = (start: number, end: number) => average(values.slice(start, end));
  const forecasts: TimePoint[] = [];
  let y = year;
  let m = month;
  for (let i = 0; i < horizon; i++) {
    const start = Math.max(0, values.length - windowSize);
    const f = avg(start, values.length);
    // push forecast
    const nextMonth = m + 1;
    if (nextMonth > 12) {
      y += 1;
      m = 1;
    } else {
      m = nextMonth;
    }
    forecasts.push({ date: `${y}-${String(m).padStart(2, '0')}`, value: f });
    values.push(f);
  }
  return forecasts;
}

// Z-score anomaly detection
export function detectAnomalies(values: number[], zThreshold = 2): { index: number; value: number; z: number }[] {
  if (!values || values.length < 2) return [];
  const mean = average(values);
  const variance = average(values.map(v => (v - mean) ** 2));
  const std = Math.sqrt(variance);
  if (std === 0) return [];
  const anomalies: { index: number; value: number; z: number }[] = [];
  values.forEach((v, i) => {
    const z = (v - mean) / std;
    if (Math.abs(z) >= zThreshold) anomalies.push({ index: i, value: v, z });
  });
  return anomalies;
}

export function topNBySum(rows: any[], keyField: string, valueField: string, n = 5): Array<{ key: string; total: number; count: number }>{
  const map = new Map<string, { total: number; count: number }>();
  rows.forEach(r => {
    const k = String(r?.[keyField] ?? 'Unknown');
    const v = Number(r?.[valueField]);
    const entry = map.get(k) || { total: 0, count: 0 };
    if (Number.isFinite(v)) entry.total += v;
    entry.count += 1;
    map.set(k, entry);
  });
  return Array.from(map.entries())
    .map(([key, v]) => ({ key, total: v.total, count: v.count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, n);
}




