type AnalyzeCsvSchemaParams = {
  csvHeaders: string[];
  selectedIndustry?: string;
  validationErrors?: unknown[];
};

export async function analyzeCsvSchema(params: AnalyzeCsvSchemaParams) {
  const res = await fetch('/api/ai/analyze-csv-schema', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('analyze-csv-schema failed');
  return res.json();
}

export async function generateBusinessInsights(params: { data: unknown[]; industry: string; chartType: 'bar' | 'pie' | 'line' }) {
  const res = await fetch('/api/ai/generate-business-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('generate-business-insights failed');
  return res.json();
}




