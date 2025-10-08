export interface DataAnalysisResult {
  summary: string;
  insights: string[];
  dataFields: string[];
  recordCount: number;
  dataTypes: Record<string, string>;
  sampleData: any[];
  statistics: Record<string, any>;
}

export interface DashboardContext {
  industry?: string;
  dataType?: string;
  currentDashboard?: string;
  kpis?: Record<string, any>;
  charts?: any[];
  alerts?: any[];
}

export class DataAnalysisService {
  static analyzeData(
    data: any[], 
    additionalData: any[] = [], 
    context?: DashboardContext
  ): DataAnalysisResult {
    if (!data || data.length === 0) {
      return {
        summary: 'No data available for analysis',
        insights: ['No data to analyze'],
        dataFields: [],
        recordCount: 0,
        dataTypes: {},
        sampleData: [],
        statistics: {}
      };
    }

    const allData = [...data, ...additionalData];
    const fields = Object.keys(data[0] || {});
    const dataTypes = this.inferDataTypes(data);
    const statistics = this.calculateStatistics(data, fields);
    const insights = this.generateInsights(data, context, statistics);

    return {
      summary: this.generateDataSummary(data, context),
      insights,
      dataFields: fields,
      recordCount: data.length,
      dataTypes,
      sampleData: data.slice(0, 3), // First 3 records as sample
      statistics
    };
  }

  static generateDataSummary(data: any[], context?: DashboardContext): string {
    const recordCount = data.length;
    const fields = Object.keys(data[0] || {});
    
    let summary = `Dataset contains ${recordCount} records with ${fields.length} fields. `;
    
    if (context?.currentDashboard) {
      switch (context.currentDashboard) {
        case 'billing':
          summary += `This is billing data with fields like ${fields.slice(0, 5).join(', ')}. `;
          break;
        case 'compliance':
          summary += `This is compliance data with fields like ${fields.slice(0, 5).join(', ')}. `;
          break;
        case 'doctor-roster':
          summary += `This is doctor roster data with fields like ${fields.slice(0, 5).join(', ')}. `;
          break;
        default:
          summary += `This is business data with fields like ${fields.slice(0, 5).join(', ')}. `;
      }
    }

    // Add data quality information
    const completeness = this.calculateDataCompleteness(data);
    summary += `Data completeness is ${completeness}%. `;

    return summary;
  }

  static generateInsights(data: any[], context?: DashboardContext, statistics?: Record<string, any>): string[] {
    const insights: string[] = [];
    const fields = Object.keys(data[0] || {});

    // Basic data insights
    insights.push(`Dataset contains ${data.length} records`);
    insights.push(`Data has ${fields.length} columns: ${fields.join(', ')}`);

    // Industry-specific insights
    if (context?.currentDashboard === 'billing') {
      const amountFields = fields.filter(f => 
        f.toLowerCase().includes('amount') || 
        f.toLowerCase().includes('revenue') || 
        f.toLowerCase().includes('total')
      );
      if (amountFields.length > 0) {
        insights.push(`Financial data includes: ${amountFields.join(', ')}`);
      }
    }

    if (context?.currentDashboard === 'compliance') {
      const complianceFields = fields.filter(f => 
        f.toLowerCase().includes('violation') || 
        f.toLowerCase().includes('compliance') || 
        f.toLowerCase().includes('audit')
      );
      if (complianceFields.length > 0) {
        insights.push(`Compliance tracking includes: ${complianceFields.join(', ')}`);
      }
    }

    if (context?.currentDashboard === 'doctor-roster') {
      const staffFields = fields.filter(f => 
        f.toLowerCase().includes('doctor') || 
        f.toLowerCase().includes('staff') || 
        f.toLowerCase().includes('name')
      );
      if (staffFields.length > 0) {
        insights.push(`Staff information includes: ${staffFields.join(', ')}`);
      }
    }

    // Data quality insights
    const completeness = this.calculateDataCompleteness(data);
    if (completeness < 80) {
      insights.push(`Data completeness is ${completeness}% - some fields may have missing values`);
    } else {
      insights.push(`Data quality is excellent with ${completeness}% completeness`);
    }

    return insights;
  }

  static calculateStatistics(data: any[], fields: string[]): Record<string, any> {
    const stats: Record<string, any> = {};

    fields.forEach(field => {
      const values = data.map(row => row[field]).filter(val => val !== null && val !== undefined && val !== '');
      
      if (values.length === 0) {
        stats[field] = { type: 'empty', count: 0 };
        return;
      }

      // Try to determine if it's numeric
      const numericValues = values.filter(val => !isNaN(Number(val)) && val !== '');
      
      if (numericValues.length > values.length * 0.8) {
        // Mostly numeric
        const nums = numericValues.map(Number);
        stats[field] = {
          type: 'numeric',
          count: values.length,
          min: Math.min(...nums),
          max: Math.max(...nums),
          avg: nums.reduce((a, b) => a + b, 0) / nums.length,
          sum: nums.reduce((a, b) => a + b, 0)
        };
      } else {
        // Categorical
        const uniqueValues = [...new Set(values)];
        const valueCounts = uniqueValues.reduce((acc, val) => {
          acc[val] = values.filter(v => v === val).length;
          return acc;
        }, {} as Record<string, number>);

        stats[field] = {
          type: 'categorical',
          count: values.length,
          uniqueCount: uniqueValues.length,
          topValues: Object.entries(valueCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
        };
      }
    });

    return stats;
  }

  static inferDataTypes(data: any[]): Record<string, string> {
    if (!data || data.length === 0) return {};

    const types: Record<string, string> = {};
    const fields = Object.keys(data[0] || {});

    fields.forEach(field => {
      const values = data.slice(0, 10).map(row => row[field]).filter(val => val !== null && val !== undefined && val !== '');
      
      if (values.length === 0) {
        types[field] = 'unknown';
        return;
      }

      // Check if numeric
      const numericCount = values.filter(val => !isNaN(Number(val)) && val !== '').length;
      if (numericCount > values.length * 0.8) {
        types[field] = 'numeric';
      } else {
        // Check if date
        const dateCount = values.filter(val => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        }).length;
        
        if (dateCount > values.length * 0.8) {
          types[field] = 'date';
        } else {
          types[field] = 'text';
        }
      }
    });

    return types;
  }

  static calculateDataCompleteness(data: any[]): number {
    if (!data || data.length === 0) return 0;

    const fields = Object.keys(data[0] || {});
    let totalCells = data.length * fields.length;
    let emptyCells = 0;

    data.forEach(row => {
      fields.forEach(field => {
        if (row[field] === null || row[field] === undefined || row[field] === '') {
          emptyCells++;
        }
      });
    });

    return Math.round(((totalCells - emptyCells) / totalCells) * 100);
  }

  static queryData(data: any[], query: string, context?: DashboardContext): any {
    const queryLower = query.toLowerCase();
    const fields = Object.keys(data[0] || {});

    // Count queries
    if (queryLower.includes('count') || queryLower.includes('number') || queryLower.includes('total')) {
      if (queryLower.includes('patient')) {
        const patientField = fields.find(f => 
          f.toLowerCase().includes('patient') && f.toLowerCase().includes('id')
        );
        if (patientField) {
          const uniquePatients = new Set(data.map(row => row[patientField]));
          return { type: 'count', value: uniquePatients.size, field: 'patients' };
        }
      }
      
      if (queryLower.includes('doctor')) {
        const doctorField = fields.find(f => 
          f.toLowerCase().includes('doctor') && f.toLowerCase().includes('id')
        );
        if (doctorField) {
          const uniqueDoctors = new Set(data.map(row => row[doctorField]));
          return { type: 'count', value: uniqueDoctors.size, field: 'doctors' };
        }
      }

      if (queryLower.includes('record') || queryLower.includes('row')) {
        return { type: 'count', value: data.length, field: 'records' };
      }
    }

    // Sum queries
    if (queryLower.includes('total') && (queryLower.includes('revenue') || queryLower.includes('amount'))) {
      const amountField = fields.find(f => 
        f.toLowerCase().includes('amount') || 
        f.toLowerCase().includes('revenue') || 
        f.toLowerCase().includes('total')
      );
      if (amountField) {
        const total = data.reduce((sum, row) => {
          const val = parseFloat(row[amountField]) || 0;
          return sum + val;
        }, 0);
        return { type: 'sum', value: total, field: amountField };
      }
    }

    // Average queries
    if (queryLower.includes('average') || queryLower.includes('avg')) {
      const amountField = fields.find(f => 
        f.toLowerCase().includes('amount') || 
        f.toLowerCase().includes('revenue') || 
        f.toLowerCase().includes('total')
      );
      if (amountField) {
        const total = data.reduce((sum, row) => {
          const val = parseFloat(row[amountField]) || 0;
          return sum + val;
        }, 0);
        const avg = total / data.length;
        return { type: 'average', value: avg, field: amountField };
      }
    }

    // Top queries
    if (queryLower.includes('top') || queryLower.includes('highest') || queryLower.includes('most')) {
      const amountField = fields.find(f => 
        f.toLowerCase().includes('amount') || 
        f.toLowerCase().includes('revenue') || 
        f.toLowerCase().includes('total')
      );
      if (amountField) {
        const sorted = data.sort((a, b) => (parseFloat(b[amountField]) || 0) - (parseFloat(a[amountField]) || 0));
        return { type: 'top', value: sorted.slice(0, 5), field: amountField };
      }
    }

    return null;
  }
}
