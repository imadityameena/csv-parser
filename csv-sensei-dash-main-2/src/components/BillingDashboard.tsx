import React, { useState, useEffect } from 'react';
import { ArrowLeft, Receipt, DollarSign, Users, Calendar, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, ScatterChart, Scatter, ZAxis } from 'recharts';
import { AIQueryBar } from '@/components/AIQueryBar';
import { buildMonthlySeries, movingAverageForecast, detectAnomalies } from '@/utils/analytics';
import { KPIAlerts } from '@/components/KPIAlerts';

interface BillingDashboardProps {
  data: any[];
  onBack: () => void;
  doctorRosterData?: any[];
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({ data, onBack, doctorRosterData }) => {
  const [insights, setInsights] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);

  // Flexible field accessor to tolerate different CSV header names
  const getFieldValue = (row: any, possibleNames: string[], fallback: any = undefined) => {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        return row[name];
      }
    }
    return fallback;
  };

  const parseAmount = (value: any): number => {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const str = String(value).replace(/[,\s]/g, '').replace(/[^0-9.-]/g, '');
    const n = parseFloat(str);
    return Number.isFinite(n) ? n : 0;
  };

  useEffect(() => {
    if (data && data.length > 0) {
      generateInsights();
    }
  }, [data]);

  const generateInsights = () => {
    const totalBills = data.length;
    const totalAmount = data.reduce((sum, row) => sum + parseAmount(getFieldValue(row, ['Total_Amount', 'Amount', 'TotalAmount', 'Amount_Billed', 'Bill_Amount', 'Gross_Amount'])), 0);
    const averageAmount = totalAmount / totalBills;
    
    // Payment status analysis
    const paymentStatus = data.reduce((acc, row) => {
      const status = getFieldValue(row, ['Payment_Status', 'PaymentStatus', 'Status', 'Payment_Status_Desc'], 'Unknown') || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Department analysis
    // Derive department from provided field or from procedure code mapping
    const procToDept: Record<string, string> = { OP100: 'General', OP200: 'Orthopedics', OP300: 'Cardiology' };
    const departmentRevenue = data.reduce((acc, row) => {
      const procedure = getFieldValue(row, ['Procedure_Code', 'Service_Code', 'Procedure', 'Proc_Code']);
      const inferred = procedure && procToDept[String(procedure)] ? procToDept[String(procedure)] : undefined;
      const dept = (getFieldValue(row, ['Department', 'Dept']) || inferred || 'Unknown') as string;
      const amount = parseAmount(getFieldValue(row, ['Total_Amount', 'Amount', 'TotalAmount', 'Amount_Billed', 'Bill_Amount', 'Gross_Amount']));
      if (!acc[dept]) acc[dept] = { count: 0, revenue: 0 };
      acc[dept].count += 1;
      acc[dept].revenue += amount;
      return acc;
    }, {});

    // Payer type analysis
    const payerDistribution = data.reduce((acc, row) => {
      const payer = getFieldValue(row, ['Payer_Type', 'Payer', 'PayerType'], 'Unknown') || 'Unknown';
      acc[payer] = (acc[payer] || 0) + 1;
      return acc;
    }, {});

    // Service analysis
    const serviceRevenue = data.reduce((acc, row) => {
      const service = getFieldValue(row, ['Procedure_Code', 'Service_Code', 'Procedure', 'Proc_Code'], 'Unknown') || 'Unknown';
      const amount = parseAmount(getFieldValue(row, ['Total_Amount', 'Amount', 'TotalAmount', 'Amount_Billed', 'Bill_Amount', 'Gross_Amount']));
      if (!acc[service]) acc[service] = { count: 0, revenue: 0 };
      acc[service].count += 1;
      acc[service].revenue += amount;
      return acc;
    }, {});

    // Outstanding analysis
    const outstandingAmount = data
      .filter(row => {
        const status = getFieldValue(row, ['Payment_Status', 'PaymentStatus', 'Status', 'Payment_Status_Desc'], '').toString();
        return status === 'Pending' || status === 'Outstanding' || status === 'Unpaid';
      })
      .reduce((sum, row) => sum + parseAmount(getFieldValue(row, ['Total_Amount', 'Amount', 'TotalAmount', 'Amount_Billed', 'Bill_Amount', 'Gross_Amount'])), 0);

    // Date analysis
    const dateRange = data
      .map(row => getFieldValue(row, ['Bill_Date', 'Visit_Date', 'Date', 'Transaction_Date']))
      .map(v => new Date(String(v)))
      .filter(date => !isNaN(date.getTime()));
    const minDate = dateRange.length > 0 ? new Date(Math.min(...dateRange.map(d => d.getTime()))) : null;
    const maxDate = dateRange.length > 0 ? new Date(Math.max(...dateRange.map(d => d.getTime()))) : null;

    // Specialty performance (via doctor roster mapping)
    const doctorIdToSpecialty: Record<string, string> = (doctorRosterData || []).reduce((acc, row) => {
      const id = getFieldValue(row, ['Doctor_ID', 'doctor_id', 'DoctorId', 'ID', 'id']);
      const spec = getFieldValue(row, ['Specialty', 'specialty', 'Specialization', 'specialization', 'Speciality', 'speciality']);
      if (id && spec) acc[String(id)] = String(spec);
      return acc;
    }, {} as Record<string, string>);

    // License expiry tracking from doctor roster
    const doctorLicenseMap: Record<string, { name: string; expiry: Date | null }> = {};
    (doctorRosterData || []).forEach(row => {
      const id = row.Doctor_ID || row.doctor_id || row.ID || row.id;
      const name = row.Doctor_Name || row.doctor_name || row.Name || row.name || String(id || 'Unknown');
      const expRaw = row.License_Expiry || row.license_expiry || row.LicenseExpiry || row.licenseExpiry || row.Expiry_Date || row.expiry_date;
      const exp = expRaw ? new Date(String(expRaw)) : null;
      if (!id) return;
      if (!doctorLicenseMap[id]) doctorLicenseMap[id] = { name, expiry: exp };
      // If multiple entries, keep the nearest upcoming expiry
      if (doctorLicenseMap[id].expiry && exp) {
        if (exp < doctorLicenseMap[id].expiry!) doctorLicenseMap[id].expiry = exp;
      } else if (exp && !doctorLicenseMap[id].expiry) {
        doctorLicenseMap[id].expiry = exp;
      }
    });
    const today = new Date();
    const licenseExpiries = Object.entries(doctorLicenseMap).map(([id, v]) => {
      const days = v.expiry ? Math.ceil((v.expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
      let status: 'red' | 'yellow' | 'green' | 'gray' = 'gray';
      if (days === null) status = 'gray';
      else if (days < 30) status = 'red';
      else if (days < 60) status = 'yellow';
      else if (days < 90) status = 'green';
      return { id, name: v.name, expiry: v.expiry, days, status };
    }).sort((a, b) => {
      const ad = a.expiry ? a.expiry.getTime() : Infinity;
      const bd = b.expiry ? b.expiry.getTime() : Infinity;
      return ad - bd;
    });

    const specialtyAgg = data.reduce((acc, row) => {
      const doctorId = getFieldValue(row, ['Doctor_ID', 'doctor_id', 'DoctorId', 'ID', 'id']);
      const deptFallback = getFieldValue(row, ['Department', 'Dept']);
      const specialty = doctorId
        ? (doctorIdToSpecialty[String(doctorId)] || String(deptFallback || 'Unknown'))
        : String(deptFallback || 'Unknown');
      const amount = parseAmount(getFieldValue(row, ['Total_Amount', 'Amount', 'TotalAmount', 'Amount_Billed', 'Bill_Amount', 'Gross_Amount']));
      if (!acc[specialty]) acc[specialty] = { revenue: 0, visits: 0 };
      acc[specialty].revenue += amount;
      acc[specialty].visits += 1;
      return acc;
    }, {} as Record<string, { revenue: number; visits: number }>);

    // Doctor workload vs revenue
    const doctorAgg = data.reduce((acc, row) => {
      const doctorId = getFieldValue(row, ['Doctor_ID', 'doctor_id', 'DoctorId', 'ID', 'id']);
      const doctorName = getFieldValue(row, ['Doctor_Name', 'doctor_name', 'DoctorName', 'Name', 'name'], String(doctorId || 'Unknown'));
      const patientId = getFieldValue(row, ['Patient_ID', 'patient_id', 'PatientId']);
      const amount = parseAmount(getFieldValue(row, ['Total_Amount', 'Amount', 'TotalAmount', 'Amount_Billed', 'Bill_Amount', 'Gross_Amount']));
      const key = String(doctorId || doctorName || 'Unknown');
      if (!acc[key]) acc[key] = { doctorId: key, doctorName, patients: new Set<string>(), revenue: 0 };
      if (patientId) acc[key].patients.add(String(patientId));
      acc[key].revenue += amount;
      return acc;
    }, {} as Record<string, { doctorId: string; doctorName: string; patients: Set<string>; revenue: number }>);

    const doctorAggValues = Object.values(doctorAgg) as Array<{ doctorId: string; doctorName: string; patients: Set<string>; revenue: number }>;
    const workloadScatter = doctorAggValues.map(d => ({
      x: d.patients.size,
      y: d.revenue,
      z: Math.max(4, Math.min(12, d.revenue / 1000)),
      doctorId: d.doctorId,
      doctorName: d.doctorName
    }));

    // Payer-Procedure matrix
    const matrixAgg = data.reduce((acc, row) => {
      const payer = getFieldValue(row, ['Payer_Type', 'Payer', 'PayerType'], 'Unknown') || 'Unknown';
      const proc = getFieldValue(row, ['Procedure_Code', 'Service_Code', 'Procedure', 'Proc_Code'], 'Unknown') || 'Unknown';
      const amount = parseAmount(getFieldValue(row, ['Total_Amount', 'Amount', 'TotalAmount', 'Amount_Billed', 'Bill_Amount', 'Gross_Amount']));
      if (!acc[proc]) acc[proc] = {} as Record<string, number>;
      acc[proc][payer] = (acc[proc][payer] || 0) + amount;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    // Age-Service stacked
    const buckets = [
      { name: '0-18', min: 0, max: 18 },
      { name: '19-40', min: 19, max: 40 },
      { name: '41-65', min: 41, max: 65 },
      { name: '65+', min: 66, max: Infinity }
    ];
    const ageServiceAgg: Record<string, Record<string, number>> = {};
    data.forEach(row => {
      const age = Number(getFieldValue(row, ['Age', 'Patient_Age']));
      const proc = getFieldValue(row, ['Procedure_Code', 'Service_Code', 'Procedure', 'Proc_Code'], 'Unknown') || 'Unknown';
      if (!Number.isFinite(age)) return;
      const bucket = buckets.find(b => age >= b.min && age <= b.max)?.name || 'Unknown';
      if (!ageServiceAgg[bucket]) ageServiceAgg[bucket] = {};
      ageServiceAgg[bucket][proc] = (ageServiceAgg[bucket][proc] || 0) + 1;
    });

    // Consent KPI and anomalies
    const totalWithConsentFlag = data.filter(r => r.Consent_Flag !== undefined).length;
    const consentYes = data.filter(r => r.Consent_Flag === 'Y').length;
    const consentRate = totalWithConsentFlag > 0 ? (consentYes / totalWithConsentFlag) : 0;

    const doctorConsent: Record<string, { yes: number; total: number; name: string }> = {};
    data.forEach(r => {
      const did = getFieldValue(r, ['Doctor_ID', 'doctor_id', 'DoctorId', 'ID', 'id'], 'Unknown');
      const name = getFieldValue(r, ['Doctor_Name', 'doctor_name', 'DoctorName', 'Name', 'name'], String(did));
      if (!doctorConsent[did]) doctorConsent[did] = { yes: 0, total: 0, name };
      const cflag = getFieldValue(r, ['Consent_Flag', 'Consent', 'Has_Consent']);
      if (cflag !== undefined) {
        doctorConsent[did].total += 1;
        if (cflag === 'Y' || cflag === 'Yes' || cflag === 'true' || cflag === true) doctorConsent[did].yes += 1;
      }
    });
    const consentAnomalies = Object.entries(doctorConsent)
      .map(([id, v]) => ({ id, name: v.name, rate: v.total > 0 ? v.yes / v.total : 1 }))
      .filter(d => d.rate < 0.9)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 5);

    setInsights({
      totalBills,
      totalAmount,
      averageAmount,
      paymentStatus,
      departmentRevenue,
      payerDistribution,
      serviceRevenue,
      outstandingAmount,
      dateRange: { min: minDate, max: maxDate },
      paidBills: paymentStatus.Paid || 0,
      pendingBills: paymentStatus.Pending || paymentStatus.Outstanding || 0,
      specialtyAgg,
      workloadScatter,
      matrixAgg,
      ageServiceAgg,
      consentRate,
      consentAnomalies,
      licenseExpiries
    });
  };

  const prepareChartData = () => {
    if (!insights) return { barData: [], pieData: [], pieLabel: 'Payment Status' };

    // Bar chart: Department revenue
    const barData = Object.entries(insights.departmentRevenue || {})
      .map(([name, data]: [string, any]) => ({ 
        name, 
        revenue: data.revenue,
        count: data.count 
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Pie chart: Prefer payment status; if mostly Unknown or missing, fall back to payer distribution
    const statusEntries = Object.entries(insights.paymentStatus || {});
    const nonUnknown = statusEntries.filter(([k]) => k && k !== 'Unknown');
    const usePayer = nonUnknown.length === 0;
    const pieSource = usePayer ? (insights.payerDistribution || {}) : (insights.paymentStatus || {});
    const pieLabel = usePayer ? 'Payer Type' : 'Payment Status';
    const pieData = Object.entries(pieSource)
      .map(([name, count], index) => ({
        name,
        value: count as number,
        fill: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'][index % 4]
      }));

    return { barData, pieData, pieLabel };
  };

  const { barData, pieData, pieLabel } = prepareChartData();

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "#3b82f6",
    },
    count: {
      label: "Count",
      color: "#10b981",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                OP Billing Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {data.length} billing records • ${insights?.totalAmount?.toLocaleString() || 0} total revenue
              </p>
            </div>
            <Button onClick={onBack} variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </Button>
          </div>
        </div>

        {/* License Expiry Tracking */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>License Expiry Tracking</CardTitle>
            <CardDescription>Doctors with upcoming license expiries</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const rows = (insights?.licenseExpiries || []) as Array<{ id: string; name: string; expiry: Date | null; days: number | null; status: string }>;
              if (!rows.length) return <div className="text-sm text-gray-600">No license data available</div>;
              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="p-2 text-left">Doctor</th>
                        <th className="p-2 text-left">License Expiry</th>
                        <th className="p-2 text-left">Days Left</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 10).map((r) => (
                        <tr key={r.id} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="p-2">{r.name}</td>
                          <td className="p-2">{r.expiry ? new Date(r.expiry).toLocaleDateString() : 'N/A'}</td>
                          <td className="p-2">{r.days !== null ? r.days : 'N/A'}</td>
                          <td className="p-2">
                            <span className={
                              r.status === 'red' ? 'text-red-600 font-medium' :
                              r.status === 'yellow' ? 'text-yellow-600 font-medium' :
                              r.status === 'green' ? 'text-green-600 font-medium' :
                              'text-gray-500'
                            }>
                              {r.status === 'red' ? '<30 days' : r.status === 'yellow' ? '<60 days' : r.status === 'green' ? '<90 days' : 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* AI Q&A */}
        <AIQueryBar data={data} context={'billing'} />

        {/* KPI Alerts */}
        <KPIAlerts data={data} industry={"opbilling"} />

        {/* Specialty Performance KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-300">Total Revenue per Top Specialty</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const entries = Object.entries(insights?.specialtyAgg || {}).sort((a, b) => (b[1] as any).revenue - (a[1] as any).revenue);
                const top = entries[0];
                return (
                  <div className="text-2xl font-bold text-blue-600">{top ? `${top[0]}: $${(top[1] as any).revenue.toLocaleString()}` : 'N/A'}</div>
                );
              })()}
              <p className="text-xs text-gray-500">Highest grossing specialty</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-300">Average Revenue/Visit (Top Specialty)</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const entries = Object.entries(insights?.specialtyAgg || {}).map(([k, v]: any) => [k, v.revenue / Math.max(1, v.visits)]).sort((a: any, b: any) => b[1] - a[1]);
                const top = entries[0];
                return (
                  <div className="text-2xl font-bold text-green-600">{top ? `${top[0]}: $${Number(top[1]).toFixed(2)}` : 'N/A'}</div>
                );
              })()}
              <p className="text-xs text-gray-500">Best average per visit</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-300">Patient Volume (Top Specialty)</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const entries = Object.entries(insights?.specialtyAgg || {}).sort((a, b) => (b[1] as any).visits - (a[1] as any).visits);
                const top = entries[0];
                return (
                  <div className="text-2xl font-bold text-purple-600">{top ? `${top[0]}: ${(top[1] as any).visits}` : 'N/A'}</div>
                );
              })()}
              <p className="text-xs text-gray-500">Most visits</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Leaderboard Insight (static template using computed values) */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>AI Insight</CardTitle>
            <CardDescription>Leaderboard summary by specialty</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const entries = Object.entries(insights?.specialtyAgg || {}).sort((a, b) => (b[1] as any).revenue - (a[1] as any).revenue);
              if (entries.length === 0) return <div className="text-sm text-gray-600">No specialty data</div>;
              const total = entries.reduce((s, [, v]: any) => s + v.revenue, 0);
              const top = entries[0];
              const avgEntries = Object.entries(insights?.specialtyAgg || {}).map(([k, v]: any) => [k, v.revenue / Math.max(1, v.visits)]).sort((a: any, b: any) => b[1] - a[1]);
              const topAvg = avgEntries[0];
              return (
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  This month, <span className="font-semibold">{top[0]}</span> was the top-performing department, generating {total > 0 ? `${Math.round(((top[1] as any).revenue / total) * 100)}%` : '0%'} of total revenue, while <span className="font-semibold">{topAvg ? topAvg[0] : top[0]}</span> saw the highest average revenue per patient.
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-300">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">${insights?.totalAmount?.toLocaleString() || 0}</div>
              <p className="text-xs text-gray-500">From {insights?.totalBills || 0} bills</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-300">Average Bill</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">${insights?.averageAmount?.toFixed(2) || 0}</div>
              <p className="text-xs text-gray-500">Per transaction</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-300">Paid Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{insights?.paidBills || 0}</div>
              <p className="text-xs text-gray-500">Completed payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-300">Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">${insights?.outstandingAmount?.toLocaleString() || 0}</div>
              <p className="text-xs text-gray-500">Pending payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Technical Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
            Technical Summary
          </h2>
          <Card>
            <CardContent className="pt-6">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                <li>• Records: {data.length}</li>
                <li>• Columns: {Object.keys(data[0] || {}).length}</li>
                <li>• Departments: {Object.keys(insights?.departmentRevenue || {}).length}</li>
                <li>• Payer Types: {Object.keys(insights?.payerDistribution || {}).length}</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-purple-500" />
            AI-Generated Insights
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-300 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Revenue Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <li>• Total revenue: ${insights?.totalAmount?.toLocaleString() || 0}</li>
                  <li>• Average bill value: ${insights?.averageAmount?.toFixed(2) || 0}</li>
                  <li>• Outstanding amount: ${insights?.outstandingAmount?.toLocaleString() || 0}</li>
                  <li>• Payment completion rate: {((insights?.paidBills || 0) / (insights?.totalBills || 1) * 100).toFixed(1)}%</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Department Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li>• {Object.keys(insights?.departmentRevenue || {}).length} departments active</li>
                  <li>• Top department: {Object.entries(insights?.departmentRevenue || {}).sort((a, b) => (b[1] as any).revenue - (a[1] as any).revenue)[0]?.[0] || 'N/A'}</li>
                  <li>• {Object.keys(insights?.payerDistribution || {}).length} different payer types</li>
                  <li>• {Object.keys(insights?.serviceRevenue || {}).length} service codes used</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Forecast: Monthly Revenue (SMA) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Revenue Forecast
              </CardTitle>
              <CardDescription>
                Simple moving-average forecast for upcoming months
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Build monthly series using flexible fields
                const raw = data.map(row => ({
                  date: getFieldValue(row, ['Bill_Date', 'Visit_Date', 'Date', 'Transaction_Date']),
                  value: parseAmount(getFieldValue(row, ['Total_Amount', 'Amount', 'TotalAmount', 'Amount_Billed', 'Bill_Amount', 'Gross_Amount']))
                })).filter(p => p.date);
                const byMonth: Record<string, number> = {};
                raw.forEach(p => {
                  const d = new Date(String(p.date));
                  if (isNaN(d.getTime())) return;
                  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                  byMonth[key] = (byMonth[key] || 0) + p.value;
                });
                const series = Object.keys(byMonth).sort().map(k => ({ date: k, value: byMonth[k] }));
                const forecast = movingAverageForecast(series, 3, 3);
                const barData = [...series, ...forecast.map(f => ({ ...f, forecast: true }))].map(p => ({
                  name: p.date,
                  revenue: p.value,
                  isForecast: (p as any).forecast || false
                }));
                return (
                  <ChartContainer config={{ revenue: { label: 'Revenue', color: '#3b82f6' } }} className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 8, right: 24, bottom: 8, left: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                );
              })()}
            </CardContent>
          </Card>

          {/* Department Revenue */
          }
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                Department Revenue
              </CardTitle>
              <CardDescription>
                Revenue by department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 8, right: 24, bottom: 8, left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Put Payment Status and Doctor Workload side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-purple-600" />
                {pieLabel}
              </CardTitle>
              <CardDescription>
                {pieLabel === 'Payment Status' ? 'Distribution of payment statuses' : 'Distribution by payer type'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Doctor Workload vs Revenue Scatter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                Doctor Workload vs Revenue
              </CardTitle>
              <CardDescription>Patients seen vs total revenue per doctor (click a point)</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 24, bottom: 16, left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Patients"
                      allowDecimals={false}
                      domain={[
                        (dataMin: number) => Math.max(0, Math.floor(dataMin - 1)),
                        (dataMax: number) => Math.ceil(dataMax + 1)
                      ]}
                      label={{ value: 'Patients', position: 'insideBottom', offset: -2 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Revenue"
                      domain={[(dataMin: number) => Math.max(0, Math.floor(dataMin * 0.9)), (dataMax: number) => Math.ceil(dataMax * 1.05)]}
                      tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                      label={{ value: 'Revenue', angle: -90, position: 'insideLeft' }}
                    />
                    <ZAxis type="number" dataKey="z" range={[80, 240]} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: any, name: any, props: any) => {
                        if (name === 'y') return [`$${Number(value).toLocaleString()}`, 'Revenue'];
                        if (name === 'x') return [String(value), 'Patients'];
                        return [String(value), name];
                      }}
                    />
                    <Scatter
                      data={insights?.workloadScatter || []}
                      fill="#6366f1"
                      shape="circle"
                      onClick={(params: any) => setSelectedDoctor(params?.payload)}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartContainer>
              {selectedDoctor && (
                <div className="mt-4 text-sm text-gray-800 dark:text-gray-200">
                  <div className="font-semibold">{selectedDoctor?.doctorName}</div>
                  <div>Patients: {Math.round(Number(selectedDoctor?.x || 0))}, Revenue: ${Number(selectedDoctor?.y || 0).toLocaleString()}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payer-Procedure Profitability Matrix */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Payer-Procedure Profitability</CardTitle>
            <CardDescription>Total amount by Procedure_Code and Payer_Type</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const matrix = insights?.matrixAgg || {};
              const procs = Object.keys(matrix);
              const payers = Array.from(new Set(procs.flatMap(p => Object.keys(matrix[p]))));
              if (procs.length === 0) return <div className="text-sm text-gray-600">No data</div>;
              const max = Math.max(1, ...procs.flatMap(p => payers.map(py => matrix[p][py] || 0)));
              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="p-2 text-left">Procedure</th>
                        {payers.map(py => (<th key={py} className="p-2 text-left">{py}</th>))}
                      </tr>
                    </thead>
                    <tbody>
                      {procs.map(proc => (
                        <tr key={proc}>
                          <td className="p-2 font-medium">{proc}</td>
                          {payers.map(py => {
                            const val = matrix[proc][py] || 0;
                            const intensity = Math.round((val / max) * 255);
                            const bg = `rgba(34,197,94,${Math.max(0.1, val / max)})`;
                            return (
                              <td key={py} className="p-2" style={{ backgroundColor: bg }}>
                                ${val.toLocaleString()}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Age-Service section in two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Age-Service Correlation (stacked) */}
          <Card>
            <CardHeader>
              <CardTitle>Age vs Procedure Distribution</CardTitle>
              <CardDescription>Stacked counts by age bracket and procedure</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const agg: Record<string, Record<string, number>> = insights?.ageServiceAgg || {};
                const ageBuckets = Object.keys(agg);
                if (ageBuckets.length === 0) return <div className="text-sm text-gray-600">No data</div>;
                const procs = Array.from(new Set(ageBuckets.flatMap(b => Object.keys(agg[b]))));
                const stacked = ageBuckets.map(b => ({ name: b, ...procs.reduce((o, p) => ({ ...o, [p]: agg[b][p] || 0 }), {}) }));
                return (
                  <ChartContainer config={{}} className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stacked} margin={{ top: 8, right: 24, bottom: 8, left: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        {procs.map((p, i) => (
                          <Bar key={p} dataKey={p} stackId="a" fill={["#60a5fa","#34d399","#f59e0b","#f87171","#a78bfa","#10b981"][i % 6]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                );
              })()}
            </CardContent>
          </Card>

          {/* Top Procedures by Revenue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-orange-600" />
                Top Procedures by Revenue
              </CardTitle>
              <CardDescription>Highest grossing procedure codes</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const sr: Record<string, { count: number; revenue: number }> = insights?.serviceRevenue || {};
                const rows = Object.entries(sr)
                  .map(([code, v]) => ({ code, revenue: v.revenue }))
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 5);
                if (rows.length === 0) return <div className="text-sm text-gray-600">No data</div>;
                return (
                  <ChartContainer config={{ revenue: { label: 'Revenue', color: '#f59e0b' } }} className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rows} layout="vertical" margin={{ left: 32, right: 24, top: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="code" width={80} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Consent KPI and Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-300">Consent Signed Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{((insights?.consentRate || 0) * 100).toFixed(1)}%</div>
              <p className="text-xs text-gray-500">Percentage of visits with Consent_Flag = 'Y'</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-300">Consent Anomalies</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {(insights?.consentAnomalies || []).map((d: any) => (
                  <li key={d.id}>• {d.name}: {(d.rate * 100).toFixed(1)}%</li>
                ))}
                {(!insights?.consentAnomalies || insights?.consentAnomalies.length === 0) && (
                  <li>No anomalies detected</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Billing Details Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="w-5 h-5 mr-2 text-gray-600" />
              Billing Details
            </CardTitle>
            <CardDescription>
              Recent billing transactions and payment status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bill ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Doctor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {data.slice(0, 10).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {getFieldValue(row, ['Bill_ID', 'BillId', 'BillID', 'Visit_ID', 'ID', 'id'], '—')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{getFieldValue(row, ['Patient_Name', 'patient_name', 'Name'], 'Unknown')}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-300">{getFieldValue(row, ['Patient_ID', 'patient_id', 'PatientId'], '')}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{getFieldValue(row, ['Doctor_Name', 'doctor_name', 'DoctorName', 'Name', 'Doctor_ID', 'doctor_id'], 'Unknown')}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-300">{getFieldValue(row, ['Department', 'Dept'], '')}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {getFieldValue(row, ['Procedure_Code', 'Service_Code', 'Procedure', 'Proc_Code'], '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        ${parseAmount(getFieldValue(row, ['Total_Amount', 'Amount', 'TotalAmount', 'Amount_Billed', 'Bill_Amount', 'Gross_Amount'])).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const raw = getFieldValue(row, ['Payment_Status', 'PaymentStatus', 'Status', 'Payment_Status_Desc']);
                          let statusValue = raw;
                          const isMissing = (v: any) => v === undefined || v === null || String(v).trim() === '' || String(v).toLowerCase() === 'undefined';
                          if (isMissing(statusValue)) {
                            statusValue = getFieldValue(row, ['Payer_Type', 'Payer', 'PayerType'], 'Unknown');
                          }
                          const status = String(statusValue);
                          const variant = (status === 'Paid') ? 'default' : (status === 'Pending' || status === 'Outstanding' || status === 'Unpaid') ? 'secondary' : 'secondary';
                          return (
                            <Badge variant={variant as any}>
                              {status}
                            </Badge>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 10 && (
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-center text-sm text-gray-500 dark:text-gray-300">
                  Showing 10 of {data.length} records
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
