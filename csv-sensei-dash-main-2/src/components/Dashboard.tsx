import React from 'react';
import { ArrowLeft, TrendingUp, PieChart, BarChart3, AlertTriangle, DollarSign, Clock, Users, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, LineChart, Line, AreaChart, Area, ComposedChart } from 'recharts';
import { AICaption } from './AICaption';
import { KPIAlerts } from './KPIAlerts';
import { ComplianceDashboard } from './ComplianceDashboard';
import { DoctorRosterDashboard } from './DoctorRosterDashboard';
import { BillingDashboard } from './BillingDashboard';

interface DashboardProps {
  data: any[];
  industry: string;
  aiMappings?: any;
  onBack: () => void;
  aiCaptionEnabled?: boolean;
  // Compliance mode props
  complianceMode?: boolean;
  opBillingData?: any[];
  doctorRosterData?: any[];
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  data, 
  industry, 
  aiMappings, 
  onBack,
  aiCaptionEnabled = true,
  complianceMode = false,
  opBillingData,
  doctorRosterData
}) => {
  // Apply AI mappings to transform data if available
  const transformedData = React.useMemo(() => {
    if (!aiMappings || !data || data.length === 0) return data;

    return data.map(row => {
      const transformedRow = { ...row };
      
      // Apply field mappings
      Object.entries(aiMappings).forEach(([csvField, schemaField]) => {
        if (row[csvField] !== undefined) {
          transformedRow[schemaField as string] = row[csvField];
        }
      });
      
      return transformedRow;
    });
  }, [data, aiMappings]);

  // If in compliance mode, render compliance dashboard
  if (complianceMode && opBillingData && doctorRosterData) {
    return (
      <ComplianceDashboard 
        opBillingData={opBillingData}
        doctorRosterData={doctorRosterData}
        onBack={onBack}
      />
    );
  }

  // If doctor roster mode, render doctor roster dashboard
  if (industry === 'doctor_roster') {
    return (
      <DoctorRosterDashboard 
        data={data}
        onBack={onBack}
      />
    );
  }

  // If billing mode, render billing dashboard
  if (industry === 'opbilling') {
    return (
      <BillingDashboard 
        data={data}
        onBack={onBack}
        doctorRosterData={doctorRosterData}
      />
    );
  }

  // Predictive Revenue Risk Analysis
  const generatePredictiveRevenueRisk = (doctorRosterData: any[], billingData: any[]) => {
    if (!doctorRosterData || !billingData) return [];

    const today = new Date();
    const riskAlerts = [];

    doctorRosterData.forEach(doctor => {
      const licenseExpiry = new Date(doctor.License_Expiry);
      const daysUntilExpiry = Math.ceil((licenseExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 90 && daysUntilExpiry > 0) {
        // Calculate doctor's revenue from billing data
        const doctorBills = billingData.filter(bill => 
          bill.Doctor_ID === doctor.Doctor_ID || bill.Doctor_Name === doctor.Doctor_Name
        );
        
        if (doctorBills.length > 0) {
          const totalRevenue = doctorBills.reduce((sum, bill) => sum + (parseFloat(bill.Total_Amount) || 0), 0);
          const avgDailyRevenue = totalRevenue / 30; // Assuming 30-day average
          const potentialDailyLoss = avgDailyRevenue;
          const riskLevel = daysUntilExpiry <= 30 ? 'CRITICAL' : daysUntilExpiry <= 60 ? 'HIGH' : 'MEDIUM';
          
          riskAlerts.push({
            doctorId: doctor.Doctor_ID,
            doctorName: doctor.Doctor_Name,
            daysUntilExpiry,
            avgDailyRevenue,
            potentialDailyLoss,
            riskLevel,
            totalRevenue,
            visitCount: doctorBills.length
          });
        }
      }
    });

    return riskAlerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  };

  // Shift Performance Analysis
  const generateShiftPerformanceAnalysis = (doctorRosterData: any[], billingData: any[]) => {
    if (!doctorRosterData || !billingData) return {};

    const shiftAnalysis = doctorRosterData.map(doctor => {
      const doctorBills = billingData.filter(bill => 
        bill.Doctor_ID === doctor.Doctor_ID || bill.Doctor_Name === doctor.Doctor_Name
      );
      
      if (doctorBills.length === 0) return null;

      const totalRevenue = doctorBills.reduce((sum, bill) => sum + (parseFloat(bill.Total_Amount) || 0), 0);
      
      // Calculate shift hours
      const shiftStart = new Date(`2000-01-01T${doctor.Shift_Start}`);
      const shiftEnd = new Date(`2000-01-01T${doctor.Shift_End}`);
      let shiftHours = (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);
      
      // Handle overnight shifts
      if (shiftHours < 0) shiftHours += 24;
      
      const revenuePerHour = shiftHours > 0 ? totalRevenue / shiftHours : 0;
      
      return {
        doctorId: doctor.Doctor_ID,
        doctorName: doctor.Doctor_Name,
        shiftStart: doctor.Shift_Start,
        shiftEnd: doctor.Shift_End,
        shiftHours,
        totalRevenue,
        revenuePerHour,
        visitCount: doctorBills.length,
        avgRevenuePerVisit: totalRevenue / doctorBills.length
      };
    }).filter(Boolean);

    return {
      doctors: shiftAnalysis,
      topPerformers: shiftAnalysis.sort((a, b) => b.revenuePerHour - a.revenuePerHour).slice(0, 5),
      avgRevenuePerHour: shiftAnalysis.reduce((sum, d) => sum + d.revenuePerHour, 0) / shiftAnalysis.length
    };
  };

  // Payer Trend Analysis
  const generatePayerTrendAnalysis = (billingData: any[]) => {
    if (!billingData) return {};

    const monthlyData: Record<string, { CASH: number; INSURANCE: number; GOVT: number; Unknown: number; total: number }> = {};
    
    billingData.forEach(bill => {
      const visitDate = new Date(bill.Visit_Date || bill.Bill_Date);
      const monthKey = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}`;
      const amount = parseFloat(bill.Total_Amount) || 0;
      const payerType = bill.Payer_Type || 'Unknown';
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { CASH: 0, INSURANCE: 0, GOVT: 0, Unknown: 0, total: 0 };
      }
      
      monthlyData[monthKey][payerType as keyof typeof monthlyData[typeof monthKey]] += amount;
      monthlyData[monthKey].total += amount;
    });

    const trendData = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        CASH: data.CASH,
        INSURANCE: data.INSURANCE,
        GOVT: data.GOVT,
        Unknown: data.Unknown,
        total: data.total,
        cashPercentage: (data.CASH / data.total) * 100,
        insurancePercentage: (data.INSURANCE / data.total) * 100,
        govtPercentage: (data.GOVT / data.total) * 100
      }));

    return { trendData, monthlyData };
  };

  // Patient Journey Analysis
  const generatePatientJourneyAnalysis = (billingData: any[]) => {
    if (!billingData) return {};

    const patientVisits: Record<string, Array<{
      visitDate: Date;
      procedureCode: string;
      amount: number;
      doctorId: string;
      doctorName: string;
    }>> = {};
    
    billingData.forEach(bill => {
      const patientId = bill.Patient_ID;
      if (!patientId) return;
      
      if (!patientVisits[patientId]) {
        patientVisits[patientId] = [];
      }
      
      patientVisits[patientId].push({
        visitDate: new Date(bill.Visit_Date || bill.Bill_Date),
        procedureCode: bill.Procedure_Code,
        amount: parseFloat(bill.Total_Amount) || 0,
        doctorId: bill.Doctor_ID,
        doctorName: bill.Doctor_Name
      });
    });

    // Sort visits by date for each patient
    Object.keys(patientVisits).forEach(patientId => {
      patientVisits[patientId].sort((a, b) => a.visitDate.getTime() - b.visitDate.getTime());
    });

    // Analyze patterns
    const journeyPatterns = {
      followUps: 0,
      readmissions: 0,
      serviceUpgrades: 0,
      totalPatients: Object.keys(patientVisits).length,
      avgVisitsPerPatient: 0
    };

    let totalVisits = 0;
    Object.values(patientVisits).forEach(visits => {
      totalVisits += visits.length;
      
      if (visits.length > 1) {
        // Check for follow-ups (same procedure within 30 days)
        for (let i = 1; i < visits.length; i++) {
          const daysBetween = (visits[i].visitDate.getTime() - visits[i-1].visitDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysBetween <= 30) {
            if (visits[i].procedureCode === visits[i-1].procedureCode) {
              journeyPatterns.followUps++;
            } else {
              journeyPatterns.readmissions++;
            }
          }
        }
        
        // Check for service upgrades (OP100 -> OP200/OP300)
        for (let i = 1; i < visits.length; i++) {
          if (visits[i-1].procedureCode === 'OP100' && 
              (visits[i].procedureCode === 'OP200' || visits[i].procedureCode === 'OP300')) {
            journeyPatterns.serviceUpgrades++;
          }
        }
      }
    });

    journeyPatterns.avgVisitsPerPatient = totalVisits / journeyPatterns.totalPatients;

    return { patientVisits, journeyPatterns };
  };

  // Generate insights based on industry
  const generateInsights = () => {
    // For pharmaceutical data, don't generate generic insights - let the validation engine handle it
    if (industry === 'pharma' || industry === 'pharma_retail') {
      return { business: [], technical: [], recommendations: [] };
    }
    
    const workingData = transformedData || data;
    if (!workingData || workingData.length === 0) return { business: [], technical: [], recommendations: [] };

    const totalRows = workingData.length;
    const fields = Object.keys(workingData[0] || {});
    
    // Calculate total amounts if available
    const amountField = fields.find(field => 
      field.toLowerCase().includes('amount') || 
      field.toLowerCase().includes('revenue') || 
      field.toLowerCase().includes('total') ||
      field.toLowerCase().includes('price')
    );
    
    const totalAmount = amountField ? workingData.reduce((sum, row) => {
      const amount = parseFloat(row[amountField]) || 0;
      return sum + amount;
    }, 0) : 0;
    const avgAmount = totalAmount / totalRows;

    // Category analysis
    const categoryField = fields.find(field => 
      field.toLowerCase().includes('category') || 
      field.toLowerCase().includes('type') || 
      field.toLowerCase().includes('product') ||
      field.toLowerCase().includes('region')
    );

    let categoryInsights = '';
    if (categoryField) {
      const categories: Record<string, number> = {};
      workingData.forEach(row => {
        const cat = row[categoryField] || 'Unknown';
        const amount = amountField ? (parseFloat(row[amountField]) || 0) : 1;
        categories[cat] = (categories[cat] || 0) + amount;
      });
      const topCategory = Object.entries(categories).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
      categoryInsights = topCategory ? `Top performing category: ${topCategory[0]}` : '';
    }

    const businessInsights = [
      `Total revenue: $${totalAmount.toLocaleString()} across ${totalRows} transactions`,
      `Average order value: $${avgAmount.toFixed(2)}`,
      `Total records processed: ${totalRows} entries`,
      categoryInsights || 'Dataset contains valuable business metrics',
      aiMappings ? 'Data successfully mapped using AI field matching' : 'Standard schema validation applied'
    ].filter(Boolean);

    const technicalInsights = [
      `Dataset contains ${totalRows} records with ${fields.length} data fields`,
      `${fields.filter(f => !isNaN(parseFloat(workingData[0][f]))).length} numeric fields available for quantitative analysis`,
      `${fields.filter(f => typeof workingData[0][f] === 'string').length} categorical fields identified for segmentation`,
      aiMappings ? `AI-powered field mapping applied to ${Object.keys(aiMappings).length} columns` : 'Direct field mapping used'
    ];

    const recommendations = [
      'Focus marketing efforts on top-performing segments for maximum ROI',
      'Analyze patterns to identify growth opportunities',
      'Implement data-driven strategies based on performance insights',
      aiMappings ? 'Consider standardizing field names for future uploads' : 'Current data structure is optimal for analysis'
    ];

    return { business: businessInsights, technical: technicalInsights, recommendations };
  };

  // Prepare chart data with AI mappings support
  const prepareChartData = () => {
    const workingData = transformedData || data;
    if (!workingData || workingData.length === 0) return { barData: [], pieData: [] };

    // Special handling for CMS Medicare data
    if (industry === 'cms_medicare') {
      return prepareCMSMedicareChartData(workingData);
    }

    // Special handling for pharmaceutical data
    if (industry === 'pharma' || industry === 'pharma_retail' || hasPharmaFields(workingData)) {
      return preparePharmaChartData(workingData);
    }

    const fields = Object.keys(workingData[0]);
    const categoryField = fields.find(field => 
      field.toLowerCase().includes('category') || 
      field.toLowerCase().includes('region') || 
      field.toLowerCase().includes('product') ||
      field.toLowerCase().includes('type')
    );
    const amountField = fields.find(field => 
      field.toLowerCase().includes('amount') || 
      field.toLowerCase().includes('revenue') ||
      field.toLowerCase().includes('price') ||
      field.toLowerCase().includes('total')
    );

    if (!categoryField || !amountField) {
      // No generic fallback data - return empty arrays to avoid showing fake data
      return {
        barData: [],
        pieData: []
      };
    }

    // Group data by category
    const grouped: { [key: string]: { total: number; count: number } } = {};
    workingData.forEach(row => {
      const category = row[categoryField] || 'Unknown';
      const amount = parseFloat(row[amountField]) || 0;
      if (!grouped[category]) {
        grouped[category] = { total: 0, count: 0 };
      }
      grouped[category].total += amount;
      grouped[category].count += 1;
    });

    const barData = Object.entries(grouped).map(([name, data]) => ({
      name,
      revenue: data.total,
      quantity: data.count
    }));

    const totalRevenue = Object.values(grouped).reduce((sum, data) => sum + data.total, 0);
    const pieData = Object.entries(grouped).map(([name, data], index) => ({
      name,
      value: totalRevenue > 0 ? ((data.total / totalRevenue) * 100) : 0,
      fill: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'][index % 5]
    }));

    return { barData, pieData };
  };

  // Helper function to detect pharmaceutical fields
  const hasPharmaFields = (data: any[]) => {
    if (!data || data.length === 0) return false;
    const fields = Object.keys(data[0]);
    return fields.some(field => {
      const fieldLower = field.toLowerCase();
      return fieldLower.includes('drug') || 
             fieldLower.includes('batch') || 
             fieldLower.includes('therapeutic') || 
             fieldLower.includes('expiry') ||
             fieldLower.includes('dosage') ||
             fieldLower.includes('prescription') ||
             fieldLower.includes('manufacturer') ||
             fieldLower.includes('mrp') ||
             fieldLower.includes('cost_price') ||
             fieldLower.includes('selling_price') ||
             fieldLower.includes('stock_quantity');
    });
  };

  // Pharmaceutical-specific chart data preparation
  const preparePharmaChartData = (workingData: any[]) => {
    try {
      const fields = Object.keys(workingData[0]);
      
      // Find pharmaceutical-specific fields
      const drugNameField = fields.find(field => 
        field.toLowerCase().includes('drug_name') || 
        field.toLowerCase().includes('drug') ||
        field.toLowerCase().includes('generic_name')
      );
      
      const therapeuticClassField = fields.find(field => 
        field.toLowerCase().includes('therapeutic_class') || 
        field.toLowerCase().includes('therapeutic')
      );
      
      const stockValueField = fields.find(field => 
        field.toLowerCase().includes('total_stock_value') || 
        field.toLowerCase().includes('stock_value') ||
        field.toLowerCase().includes('mrp') ||
        field.toLowerCase().includes('cost_price')
      );
      
      const stockQuantityField = fields.find(field => 
        field.toLowerCase().includes('stock_quantity') || 
        field.toLowerCase().includes('stock')
      );
      
      const manufacturerField = fields.find(field => 
        field.toLowerCase().includes('manufacturer')
      );

      // Bar Chart: Top Products by Stock Value or Therapeutic Classes
      let barData = [];
      if (drugNameField && stockValueField) {
        // Group by drug name and sum stock values
        const productData = new Map<string, { totalValue: number; count: number }>();
        
        workingData.forEach(row => {
          const drugName = row[drugNameField]?.toString().trim() || 'Unknown';
          const stockValue = parseFloat(row[stockValueField]) || 0;
          
          if (drugName && stockValue > 0) {
            const existing = productData.get(drugName) || { totalValue: 0, count: 0 };
            existing.totalValue += stockValue;
            existing.count += 1;
            productData.set(drugName, existing);
          }
        });

        // Get top 5 products by stock value
        const topProducts = Array.from(productData.entries())
          .sort((a, b) => b[1].totalValue - a[1].totalValue)
          .slice(0, 5);

        barData = topProducts.map(([name, data]) => ({
          name: name.length > 20 ? name.substring(0, 20) + '...' : name,
          revenue: data.totalValue,
          quantity: data.count
        }));
      } else if (therapeuticClassField && stockValueField) {
        // Group by therapeutic class and sum stock values
        const classData = new Map<string, { totalValue: number; count: number }>();
        
        workingData.forEach(row => {
          const therapeuticClass = row[therapeuticClassField]?.toString().trim() || 'Unknown';
          const stockValue = parseFloat(row[stockValueField]) || 0;
          
          if (therapeuticClass && stockValue > 0) {
            const existing = classData.get(therapeuticClass) || { totalValue: 0, count: 0 };
            existing.totalValue += stockValue;
            existing.count += 1;
            classData.set(therapeuticClass, existing);
          }
        });

        // Get top 5 therapeutic classes by stock value
        const topClasses = Array.from(classData.entries())
          .sort((a, b) => b[1].totalValue - a[1].totalValue)
          .slice(0, 5);

        barData = topClasses.map(([name, data]) => ({
          name: name.length > 20 ? name.substring(0, 20) + '...' : name,
          revenue: data.totalValue,
          quantity: data.count
        }));
      }

      // Pie Chart: Manufacturer Distribution or Dosage Form Distribution
      let pieData = [];
      if (manufacturerField) {
        // Group by manufacturer
        const manufacturerData = new Map<string, number>();
        
        workingData.forEach(row => {
          const manufacturer = row[manufacturerField]?.toString().trim() || 'Unknown';
          if (manufacturer) {
            manufacturerData.set(manufacturer, (manufacturerData.get(manufacturer) || 0) + 1);
          }
        });

        // Get top 4 manufacturers by count
        const topManufacturers = Array.from(manufacturerData.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4);

        const totalProducts = workingData.length;
        pieData = topManufacturers.map(([name, count], index) => ({
          name: name.length > 15 ? name.substring(0, 15) + '...' : name,
          value: totalProducts > 0 ? ((count / totalProducts) * 100) : 0,
          fill: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'][index % 4]
        }));
      } else {
        // Fallback to dosage form distribution
        const dosageFormField = fields.find(field => 
          field.toLowerCase().includes('dosage_form') || 
          field.toLowerCase().includes('dosage')
        );
        
        if (dosageFormField) {
          const dosageFormData = new Map<string, number>();
          
          workingData.forEach(row => {
            const dosageForm = row[dosageFormField]?.toString().trim() || 'Unknown';
            if (dosageForm) {
              dosageFormData.set(dosageForm, (dosageFormData.get(dosageForm) || 0) + 1);
            }
          });

          // Get top 4 dosage forms by count
          const topDosageForms = Array.from(dosageFormData.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);

          const totalProducts = workingData.length;
          pieData = topDosageForms.map(([name, count], index) => ({
            name: name.length > 15 ? name.substring(0, 15) + '...' : name,
            value: totalProducts > 0 ? ((count / totalProducts) * 100) : 0,
            fill: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'][index % 4]
          }));
        }
      }

      // If we still don't have data, create some basic pharmaceutical insights
      if (barData.length === 0) {
        const stockQuantityField = fields.find(field => 
          field.toLowerCase().includes('stock_quantity') || 
          field.toLowerCase().includes('stock')
        );
        
        if (stockQuantityField) {
          // Group by stock levels
          const stockLevels = { 'Low (≤10)': 0, 'Medium (11-50)': 0, 'High (>50)': 0 };
          
          workingData.forEach(row => {
            const stockQuantity = parseFloat(row[stockQuantityField]) || 0;
            if (stockQuantity <= 10) stockLevels['Low (≤10)']++;
            else if (stockQuantity <= 50) stockLevels['Medium (11-50)']++;
            else stockLevels['High (>50)']++;
          });

          barData = Object.entries(stockLevels).map(([name, count]) => ({
            name,
            revenue: count,
            quantity: count
          }));
        }
      }

      if (pieData.length === 0) {
        // Create basic distribution based on available data
        const totalProducts = workingData.length;
        if (totalProducts > 0) {
          pieData = [
            { name: 'Available Products', value: 100, fill: '#3b82f6' }
          ];
        }
      }

      return { barData, pieData };
    } catch (error) {
      console.error('Error preparing pharmaceutical chart data:', error);
      // Fallback to empty data if there's an error
      return {
        barData: [],
        pieData: []
      };
    }
  };

  // CMS Medicare specific chart data preparation
  const prepareCMSMedicareChartData = (workingData: any[]) => {
    try {
      // Bar Chart: Top States by Total Payments
      const stateData = new Map<string, { totalPayment: number; count: number }>();
      
      workingData.forEach(row => {
        const state = row['Rndrng_Prvdr_State_Abrvtn'] || row['Rndrng_Prvdr_St'] || 'Unknown';
        const payment = parseFloat(row['Avg_Tot_Pymt_Amt']) || 0;
        
        if (state && payment > 0) {
          const existing = stateData.get(state) || { totalPayment: 0, count: 0 };
          existing.totalPayment += payment;
          existing.count += 1;
          stateData.set(state, existing);
        }
      });

      // Get top 5 states by payment
      const topStates = Array.from(stateData.entries())
        .sort((a, b) => b[1].totalPayment - a[1].totalPayment)
        .slice(0, 5);

      const barData = topStates.map(([state, data]) => ({
        name: state,
        revenue: data.totalPayment,
        quantity: data.count
      }));

      // Pie Chart: DRG Distribution
      const drgData = new Map<string, number>();
      
      workingData.forEach(row => {
        const drg = row['DRG_Cd'] || 'Unknown DRG';
        if (drg && drg !== 'Unknown DRG') {
          drgData.set(drg, (drgData.get(drg) || 0) + 1);
        }
      });

      // Get top 4 DRGs by count
      const topDRGs = Array.from(drgData.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

      const totalDRGs = workingData.length;
      const pieData = topDRGs.map(([drg, count], index) => ({
        name: `DRG ${drg}`,
        value: totalDRGs > 0 ? ((count / totalDRGs) * 100) : 0,
        fill: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'][index % 4]
      }));

      // If we don't have enough DRG data, add some additional DRG categories or provider types
      if (pieData.length < 4) {
        // Add "Other DRGs" category instead of geographic distribution
        const otherDRGCount = totalDRGs - topDRGs.reduce((sum, [_, count]) => sum + count, 0);
        if (otherDRGCount > 0) {
          pieData.push({
            name: 'Other DRGs',
            value: ((otherDRGCount / totalDRGs) * 100),
            fill: '#8b5cf6'
          });
        }
        
                 // If still need more data, add provider type analysis
         if (pieData.length < 4) {
           const hospitalCount = workingData.filter(row => {
             const orgName = row['Rndrng_Prvdr_Org_Name'];
             return orgName && orgName.toString().toLowerCase().includes('hospital');
           }).length;
           
           if (hospitalCount > 0) {
             pieData.push({
               name: 'Hospital Providers',
               value: ((hospitalCount / workingData.length) * 100),
               fill: '#06b6d4'
             });
           }
         }
      }

      return { barData, pieData };
    } catch (error) {
      console.error('Error preparing CMS Medicare chart data:', error);
      // Fallback to generic data if there's an error
      return {
        barData: [
          { name: 'State A', revenue: 4800, quantity: 3 },
          { name: 'State B', revenue: 2700, quantity: 2 },
          { name: 'State C', revenue: 6000, quantity: 4 },
          { name: 'State D', revenue: 3200, quantity: 2 },
        ],
        pieData: [
          { name: 'DRG 001', value: 26.7, fill: '#3b82f6' },
          { name: 'DRG 002', value: 20.6, fill: '#ef4444' },
          { name: 'DRG 003', value: 42.4, fill: '#f59e0b' },
          { name: 'DRG 004', value: 10.2, fill: '#10b981' },
        ]
      };
    }
  };

  const insights = generateInsights();
  const { barData, pieData } = prepareChartData();

  const chartConfig = {
    revenue: {
      label: (() => {
        if (industry === 'cms_medicare') return "Total Payments";
        if (industry === 'pharma' || industry === 'pharma_retail' || hasPharmaFields(transformedData || data)) return "Stock Value";
        return "Revenue";
      })(),
      color: "#3b82f6",
    },
    quantity: {
      label: (() => {
        if (industry === 'cms_medicare') return "Provider Count";
        if (industry === 'pharma' || industry === 'pharma_retail' || hasPharmaFields(transformedData || data)) return "Product Count";
        return "Quantity";
      })(),
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
                Business Intelligence Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {data.length} records • {industry === 'others' ? 'Others' : industry.charAt(0).toUpperCase() + industry.slice(1)} Schema
                {aiMappings && <span className="text-purple-600 ml-2">• AI-Enhanced</span>}
              </p>
            </div>
            <Button onClick={onBack} variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back to Upload</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* AI Success Banner */}
        {aiMappings && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300">
                  AI Schema Mapping Applied
                </h3>
                <p className="text-purple-600 dark:text-purple-400">
                  Your data has been intelligently mapped to generate meaningful insights despite schema differences.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KPI Alerts */}
        <KPIAlerts data={transformedData || data} industry={industry} />

        {/* AI-Generated Insights */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-6 h-6 text-purple-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {industry === 'pharma' || industry === 'pharma_retail' || hasPharmaFields(transformedData || data) 
                ? 'Pharmaceutical Data-Driven Insights' 
                : 'Data-Driven Insights'
              }
            </h2>
          </div>

          {/* Show pharmaceutical insights for pharma data */}
          {(industry === 'pharma' || industry === 'pharma_retail' || hasPharmaFields(transformedData || data)) ? (
            <>
              {/* Business Insights */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 mb-6 border border-blue-200 dark:border-blue-800">
                <h3 className="flex items-center text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Business Insights
                </h3>
                <ul className="space-y-2">
                  {(() => {
                    const workingData = transformedData || data;
                    const fields = Object.keys(workingData[0] || {});
                    const pharmaInsights = [];
                    
                    // Find pharmaceutical-specific fields
                    const drugNameField = fields.find(field => 
                      field.toLowerCase().includes('drug_name') || 
                      field.toLowerCase().includes('drug') ||
                      field.toLowerCase().includes('generic_name')
                    );
                    
                    const therapeuticClassField = fields.find(field => 
                      field.toLowerCase().includes('therapeutic_class') || 
                      field.toLowerCase().includes('therapeutic')
                    );
                    
                    const stockValueField = fields.find(field => 
                      field.toLowerCase().includes('total_stock_value') || 
                      field.toLowerCase().includes('stock_value') ||
                      field.toLowerCase().includes('mrp') ||
                      field.toLowerCase().includes('cost_price')
                    );
                    
                    const stockQuantityField = fields.find(field => 
                      field.toLowerCase().includes('stock_quantity') || 
                      field.toLowerCase().includes('stock')
                    );
                    
                    const manufacturerField = fields.find(field => 
                      field.toLowerCase().includes('manufacturer')
                    );
                    
                    const expiryField = fields.find(field => 
                      field.toLowerCase().includes('expiry_date') || 
                      field.toLowerCase().includes('expiry')
                    );
                    
                    // Generate pharmaceutical insights
                    if (drugNameField) {
                      const uniqueDrugs = new Set(workingData.map(row => row[drugNameField]).filter(Boolean));
                      pharmaInsights.push(`Total unique drugs: ${uniqueDrugs.size} products`);
                    }
                    
                    if (therapeuticClassField) {
                      const uniqueClasses = new Set(workingData.map(row => row[therapeuticClassField]).filter(Boolean));
                      pharmaInsights.push(`Therapeutic classes: ${uniqueClasses.size} categories`);
                    }
                    
                    if (manufacturerField) {
                      const uniqueManufacturers = new Set(workingData.map(row => row[manufacturerField]).filter(Boolean));
                      pharmaInsights.push(`Manufacturers: ${uniqueManufacturers.size} suppliers`);
                    }
                    
                    if (stockQuantityField) {
                      const totalStock = workingData.reduce((sum, row) => {
                        const stock = parseFloat(row[stockQuantityField]) || 0;
                        return sum + stock;
                      }, 0);
                      pharmaInsights.push(`Total stock quantity: ${totalStock.toLocaleString()} units`);
                    }
                    
                    if (stockValueField) {
                      const totalValue = workingData.reduce((sum, row) => {
                        const value = parseFloat(row[stockValueField]) || 0;
                        return sum + value;
                      }, 0);
                      pharmaInsights.push(`Total stock value: ₹${totalValue.toLocaleString()}`);
                    }
                    
                    if (expiryField) {
                      const currentDate = new Date();
                      const nearExpiry = workingData.filter(row => {
                        const expiryDate = new Date(row[expiryField]);
                        if (isNaN(expiryDate.getTime())) return false;
                        const thirtyDaysFromNow = new Date();
                        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                        return expiryDate <= thirtyDaysFromNow;
                      }).length;
                      
                      if (nearExpiry > 0) {
                        pharmaInsights.push(`Expiry alert: ${nearExpiry} products expire within 30 days`);
                      }
                    }
                    
                    // Add dataset completeness
                    const completeness = Math.round((workingData.filter(row => 
                      Object.values(row).some(v => v !== null && v !== '')
                    ).length / workingData.length) * 100);
                    pharmaInsights.push(`Dataset completeness: ${completeness}%`);
                    
                    return pharmaInsights.map((insight, index) => (
                      <li key={index} className="text-blue-700 dark:text-blue-300 flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {insight}
                      </li>
                    ));
                  })()}
                </ul>
              </div>

              {/* Technical Summary */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 mb-6 border border-green-200 dark:border-green-800">
                <h3 className="flex items-center text-lg font-semibold text-green-800 dark:text-green-300 mb-3">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Technical Summary
                </h3>
                <ul className="space-y-2">
                  {(() => {
                    const workingData = transformedData || data;
                    const fields = Object.keys(workingData[0] || {});
                    const technicalInsights = [
                      `Dataset contains ${workingData.length} pharmaceutical records with ${fields.length} columns`,
                      `${fields.filter(f => !isNaN(parseFloat(workingData[0][f]))).length} numeric fields for quantitative analysis`,
                      `${fields.filter(f => typeof workingData[0][f] === 'string' && isNaN(parseFloat(workingData[0][f]))).length} categorical fields for segmentation`,
                      `Industry schema: ${industry.charAt(0).toUpperCase() + industry.slice(1)}`,
                      aiMappings ? `AI field mapping applied to ${Object.keys(aiMappings).length} columns` : 'Direct field mapping used'
                    ];
                    
                    return technicalInsights.map((insight, index) => (
                      <li key={index} className="text-green-700 dark:text-green-300 flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {insight}
                      </li>
                    ));
                  })()}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6 mb-8 border border-purple-200 dark:border-purple-800">
                <h3 className="flex items-center text-lg font-semibold text-purple-800 dark:text-purple-300 mb-3">
                  <PieChart className="w-5 h-5 mr-2" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {(() => {
                    const workingData = transformedData || data;
                    const fields = Object.keys(workingData[0] || {});
                    const recommendations = [];
                    
                    // Find pharmaceutical-specific fields for recommendations
                    const hasExpiryField = fields.some(field => 
                      field.toLowerCase().includes('expiry_date') || field.toLowerCase().includes('expiry')
                    );
                    if (hasExpiryField) {
                      recommendations.push('Implement expiry date monitoring to prevent inventory losses');
                    }
                    
                    const hasStockField = fields.some(field => 
                      field.toLowerCase().includes('stock_quantity') || field.toLowerCase().includes('stock')
                    );
                    if (hasStockField) {
                      recommendations.push('Set up automated stock level alerts for better inventory management');
                    }
                    
                    const hasTherapeuticField = fields.some(field => 
                      field.toLowerCase().includes('therapeutic_class') || field.toLowerCase().includes('therapeutic')
                    );
                    if (hasTherapeuticField) {
                      recommendations.push('Analyze therapeutic class performance to optimize product portfolio');
                    }
                    
                    const hasManufacturerField = fields.some(field => 
                      field.toLowerCase().includes('manufacturer')
                    );
                    if (hasManufacturerField) {
                      recommendations.push('Diversify supplier base to reduce dependency on single manufacturers');
                    }
                    
                    const hasPrescriptionField = fields.some(field => 
                      field.toLowerCase().includes('prescription_required') || field.toLowerCase().includes('prescription')
                    );
                    if (hasPrescriptionField) {
                      recommendations.push('Ensure compliance with prescription drug regulations and monitoring');
                    }
                    
                    // Default pharmaceutical recommendations
                    if (recommendations.length === 0) {
                      recommendations.push('Implement regular inventory audits for pharmaceutical products');
                      recommendations.push('Establish quality control protocols for pharmaceutical storage');
                    }
                    
                    return recommendations.map((rec, index) => (
                      <li key={index} className="text-purple-700 dark:text-purple-300 flex items-start">
                        <span className="text-purple-500 mr-2">•</span>
                        {rec}
                      </li>
                    ));
                  })()}
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Business Insights */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 mb-6 border border-blue-200 dark:border-blue-800">
                <h3 className="flex items-center text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Business Insights
                </h3>
                <ul className="space-y-2">
                  {(() => {
                    const workingData = transformedData || data;
                    const fields = Object.keys(workingData[0] || {});
                    const businessInsights = [];
                    
                    // Find numeric fields for analysis
                    const numericFields = fields.filter(field => {
                      const value = workingData[0]?.[field];
                      return !isNaN(Number(value)) && value !== null && value !== '';
                    });
                    
                    // Find category fields
                    const categoryFields = fields.filter(field => 
                      field.toLowerCase().includes('category') || 
                      field.toLowerCase().includes('region') ||
                      field.toLowerCase().includes('type') ||
                      field.toLowerCase().includes('product')
                    );
                    
                    if (numericFields.length > 0) {
                      const mainMetric = numericFields[0];
                      const total = workingData.reduce((sum, row) => sum + (parseFloat(row[mainMetric]) || 0), 0);
                      const avg = total / workingData.length;
                      businessInsights.push(`Total ${mainMetric.replace(/_/g, ' ')}: ${total.toLocaleString()} across ${workingData.length} records`);
                      businessInsights.push(`Average ${mainMetric.replace(/_/g, ' ')}: ${avg.toFixed(2)}`);
                    }
                    
                    if (categoryFields.length > 0) {
                      const categoryField = categoryFields[0];
                      const categories = {};
                      workingData.forEach(row => {
                        const cat = row[categoryField] || 'Unknown';
                        categories[cat] = (categories[cat] || 0) + 1;
                      });
                      const topCategory = Object.entries(categories).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
                      if (topCategory) {
                        businessInsights.push(`Most common ${categoryField.replace(/_/g, ' ')}: ${topCategory[0]} (${topCategory[1]} records)`);
                      }
                    }
                    
                    businessInsights.push(`Dataset completeness: ${Math.round((workingData.filter(row => Object.values(row).some(v => v !== null && v !== '')).length / workingData.length) * 100)}%`);
                    
                    return businessInsights.map((insight, index) => (
                      <li key={index} className="text-blue-700 dark:text-blue-300 flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {insight}
                      </li>
                    ));
                  })()}
                </ul>
              </div>

              {/* Technical Summary */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 mb-6 border border-green-200 dark:border-green-800">
                <h3 className="flex items-center text-lg font-semibold text-green-800 dark:text-green-300 mb-3">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Technical Summary
                </h3>
                <ul className="space-y-2">
                  {(() => {
                    const workingData = transformedData || data;
                    const fields = Object.keys(workingData[0] || {});
                    const technicalInsights = [
                      `Dataset contains ${workingData.length} records with ${fields.length} columns`,
                      `${fields.filter(f => !isNaN(parseFloat(workingData[0][f]))).length} numeric fields for quantitative analysis`,
                      `${fields.filter(f => typeof workingData[0][f] === 'string' && isNaN(parseFloat(workingData[0][f]))).length} categorical fields for segmentation`,
                      `Industry schema: ${industry.charAt(0).toUpperCase() + industry.slice(1)}`,
                      aiMappings ? `AI field mapping applied to ${Object.keys(aiMappings).length} columns` : 'Direct field mapping used'
                    ];
                    
                    return technicalInsights.map((insight, index) => (
                      <li key={index} className="text-green-700 dark:text-blue-300 flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {insight}
                      </li>
                    ));
                  })()}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6 mb-8 border border-purple-200 dark:border-purple-800">
                <h3 className="flex items-center text-lg font-semibold text-purple-800 dark:text-purple-300 mb-3">
                  <PieChart className="w-5 h-5 mr-2" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {(() => {
                    const workingData = transformedData || data;
                    const fields = Object.keys(workingData[0] || {});
                    const recommendations = [];
                    
                    // Find date fields for trend analysis
                    const hasDateField = fields.some(field => 
                      field.toLowerCase().includes('date') || field.toLowerCase().includes('time')
                    );
                    if (hasDateField) {
                      recommendations.push('Implement time-series analysis to identify trends and seasonal patterns');
                    }
                    
                    // Find location fields for geographic analysis
                    const hasLocationField = fields.some(field => 
                      field.toLowerCase().includes('region') || 
                      field.toLowerCase().includes('location') ||
                      field.toLowerCase().includes('city') ||
                      field.toLowerCase().includes('country')
                    );
                    if (hasLocationField) {
                      recommendations.push('Consider geographic analysis to optimize regional strategies');
                    }
                    
                    // Data quality recommendations
                    const nullCount = workingData.reduce((sum, row) => {
                      return sum + Object.values(row).filter(v => v === null || v === '').length;
                    }, 0);
                    if (nullCount > 0) {
                      recommendations.push('Address missing data values to improve analysis accuracy');
                    }
                    
                    // Category analysis recommendations
                    const categoryFields = fields.filter(field => 
                      field.toLowerCase().includes('category') || 
                      field.toLowerCase().includes('type')
                    );
                    if (categoryFields.length > 0) {
                      recommendations.push('Focus on top-performing categories for strategic growth');
                    }
                    
                    // Default recommendations if no specific patterns found
                    if (recommendations.length === 0) {
                      recommendations.push('Establish regular monitoring to track key performance metrics');
                      recommendations.push('Consider data standardization for improved consistency');
                    }
                    
                    return recommendations.map((rec, index) => (
                      <li key={index} className="text-purple-700 dark:text-purple-300 flex items-start">
                        <span className="text-purple-500 mr-2">•</span>
                        {rec}
                      </li>
                    ));
                  })()}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dynamic Performance Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              {(() => {
                if (industry === 'cms_medicare') {
                  return 'State Payment Performance';
                }
                if (industry === 'pharma' || industry === 'pharma_retail' || hasPharmaFields(transformedData || data)) {
                  return 'Pharmaceutical Performance Analysis';
                }
                const workingData = transformedData || data;
                const fields = Object.keys(workingData[0] || {});
                const categoryField = fields.find(field => 
                  field.toLowerCase().includes('category') || 
                  field.toLowerCase().includes('product') ||
                  field.toLowerCase().includes('type')
                );
                return categoryField ? 
                  `${categoryField.charAt(0).toUpperCase() + categoryField.slice(1).replace(/_/g, ' ')} Performance` : 
                  'Performance Analysis';
              })()}
            </h3>
            <AICaption 
              data={barData} 
              industry={industry} 
              chartType="bar" 
              enabled={aiCaptionEnabled}
            />
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Dynamic Distribution Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-blue-600" />
              {(() => {
                if (industry === 'cms_medicare') {
                  return 'DRG Distribution Analysis';
                }
                if (industry === 'pharma' || industry === 'pharma_retail' || hasPharmaFields(transformedData || data)) {
                  return 'Pharmaceutical Distribution Analysis';
                }
                const workingData = transformedData || data;
                const fields = Object.keys(workingData[0] || {});
                const amountField = fields.find(field => 
                  field.toLowerCase().includes('amount') || 
                  field.toLowerCase().includes('revenue') ||
                  field.toLowerCase().includes('price') ||
                  field.toLowerCase().includes('total')
                );
                const categoryField = fields.find(field => 
                  field.toLowerCase().includes('region') || 
                  field.toLowerCase().includes('category') ||
                  field.toLowerCase().includes('type')
                );
                const amountLabel = amountField ? 
                  amountField.charAt(0).toUpperCase() + amountField.slice(1).replace(/_/g, ' ') : 
                  'Revenue';
                const categoryLabel = categoryField ? 
                  categoryField.charAt(0).toUpperCase() + categoryField.slice(1).replace(/_/g, ' ') : 
                  'Distribution';
                return `${amountLabel} by ${categoryLabel}`;
              })()}
            </h3>
            <AICaption 
              data={pieData} 
              industry={industry} 
              chartType="pie" 
              enabled={aiCaptionEnabled}
            />
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Predictive Revenue Risk Module */}
        {complianceMode && opBillingData && doctorRosterData && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-red-500" />
              Predictive Revenue Risk Analysis
            </h2>
            
            {(() => {
              const riskAlerts = generatePredictiveRevenueRisk(doctorRosterData, opBillingData);
              if (riskAlerts.length === 0) {
                return (
                  <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mr-3">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-green-800 dark:text-green-300">No Revenue Risk Detected</h3>
                          <p className="text-sm text-green-700 dark:text-green-400">All doctor licenses are valid for more than 90 days</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <div className="space-y-4">
                  {riskAlerts.map((alert, index) => (
                    <Card key={index} className={`border-2 ${
                      alert.riskLevel === 'CRITICAL' ? 'border-red-200 bg-red-50 dark:bg-red-900/20' :
                      alert.riskLevel === 'HIGH' ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/20' :
                      'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
                    }`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <Badge className={`mr-3 ${
                                alert.riskLevel === 'CRITICAL' ? 'bg-red-500' :
                                alert.riskLevel === 'HIGH' ? 'bg-orange-500' :
                                'bg-yellow-500'
                              }`}>
                                {alert.riskLevel} RISK
                              </Badge>
                              <h3 className="font-semibold text-lg">{alert.doctorName} (ID: {alert.doctorId})</h3>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                              License expires in <strong>{alert.daysUntilExpiry} days</strong>. 
                              Based on historical data, this doctor generates an average of <strong>${alert.avgDailyRevenue.toLocaleString()}</strong> per day.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Potential Daily Loss:</span>
                                <div className="text-lg font-bold text-red-600">${alert.potentialDailyLoss.toLocaleString()}</div>
                              </div>
                              <div>
                                <span className="font-medium">Total Revenue:</span>
                                <div className="text-lg font-bold text-green-600">${alert.totalRevenue.toLocaleString()}</div>
                              </div>
                              <div>
                                <span className="font-medium">Visit Count:</span>
                                <div className="text-lg font-bold text-blue-600">{alert.visitCount}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Shift Performance & Workload Balancing */}
        {complianceMode && opBillingData && doctorRosterData && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Clock className="w-6 h-6 mr-2 text-blue-500" />
              Shift Performance & Workload Balancing
            </h2>
            
            {(() => {
              const shiftAnalysis = generateShiftPerformanceAnalysis(doctorRosterData, opBillingData);
              if (!shiftAnalysis.doctors || shiftAnalysis.doctors.length === 0) {
                return <div className="text-gray-500">No shift performance data available</div>;
              }

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Performers by Revenue Per Hour */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                        Top Performers (Revenue/Hour)
                      </CardTitle>
                      <CardDescription>Doctors ranked by revenue per hour efficiency</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {shiftAnalysis.topPerformers.map((doctor, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <div className="font-medium">{doctor.doctorName}</div>
                              <div className="text-sm text-gray-500">
                                {doctor.shiftStart} - {doctor.shiftEnd} ({doctor.shiftHours.toFixed(1)}h)
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">${doctor.revenuePerHour.toFixed(0)}/hr</div>
                              <div className="text-sm text-gray-500">${doctor.totalRevenue.toLocaleString()} total</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shift Efficiency Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                        Revenue Per Hour Analysis
                      </CardTitle>
                      <CardDescription>Doctor efficiency comparison</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{ revenuePerHour: { label: 'Revenue/Hour', color: '#3b82f6' } }} className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={shiftAnalysis.doctors.slice(0, 8)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="doctorName" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="revenuePerHour" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </div>
        )}

        {/* Payer Performance & Trend Analysis */}
        {complianceMode && opBillingData && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-purple-500" />
              Payer Performance & Trend Analysis
            </h2>
            
            {(() => {
              const payerTrends = generatePayerTrendAnalysis(opBillingData);
              if (!payerTrends.trendData || payerTrends.trendData.length === 0) {
                return <div className="text-gray-500">No payer trend data available</div>;
              }

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Payer Mix Over Time */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AreaChart className="w-5 h-5 mr-2 text-purple-600" />
                        Payer Mix Over Time
                      </CardTitle>
                      <CardDescription>Revenue distribution by payer type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={payerTrends.trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area type="monotone" dataKey="CASH" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                            <Area type="monotone" dataKey="INSURANCE" stackId="1" stroke="#10b981" fill="#10b981" />
                            <Area type="monotone" dataKey="GOVT" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Payer Percentage Trends */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <LineChart className="w-5 h-5 mr-2 text-green-600" />
                        Payer Percentage Trends
                      </CardTitle>
                      <CardDescription>Percentage of revenue by payer type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={payerTrends.trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="cashPercentage" stroke="#3b82f6" strokeWidth={2} />
                            <Line type="monotone" dataKey="insurancePercentage" stroke="#10b981" strokeWidth={2} />
                            <Line type="monotone" dataKey="govtPercentage" stroke="#f59e0b" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </div>
        )}

        {/* Patient Journey Analytics */}
        {complianceMode && opBillingData && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Users className="w-6 h-6 mr-2 text-indigo-500" />
              Patient Journey Analytics
            </h2>
            
            {(() => {
              const journeyAnalysis = generatePatientJourneyAnalysis(opBillingData);
              if (!journeyAnalysis.journeyPatterns) {
                return <div className="text-gray-500">No patient journey data available</div>;
              }

              const { journeyPatterns } = journeyAnalysis;

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Journey Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-indigo-600" />
                        Patient Journey Metrics
                      </CardTitle>
                      <CardDescription>Key patient care pathway indicators</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{journeyPatterns.totalPatients}</div>
                          <div className="text-sm text-blue-700 dark:text-blue-400">Total Patients</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{journeyPatterns.avgVisitsPerPatient.toFixed(1)}</div>
                          <div className="text-sm text-green-700 dark:text-green-400">Avg Visits/Patient</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{journeyPatterns.followUps}</div>
                          <div className="text-sm text-purple-700 dark:text-purple-400">Follow-ups</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{journeyPatterns.serviceUpgrades}</div>
                          <div className="text-sm text-orange-700 dark:text-orange-400">Service Upgrades</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Care Pathway Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                        Care Pathway Analysis
                      </CardTitle>
                      <CardDescription>Patient journey patterns and outcomes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="font-medium">Follow-up Rate</span>
                          <span className="text-lg font-bold text-blue-600">
                            {((journeyPatterns.followUps / journeyPatterns.totalPatients) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="font-medium">Service Upgrade Rate</span>
                          <span className="text-lg font-bold text-green-600">
                            {((journeyPatterns.serviceUpgrades / journeyPatterns.totalPatients) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="font-medium">Readmission Rate</span>
                          <span className="text-lg font-bold text-orange-600">
                            {((journeyPatterns.readmissions / journeyPatterns.totalPatients) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </div>
        )}

        {/* Upload New Data Button */}
        <div className="mt-8 text-center">
          <Button 
            onClick={onBack}
            className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 text-lg"
          >
            Upload New Data
          </Button>
        </div>
      </div>
    </div>
  );
};
