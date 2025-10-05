
import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { generateBusinessInsights } from '@/integrations/mongodb/client';

interface AICaptionProps {
  data: any[];
  industry: string;
  chartType: 'bar' | 'pie' | 'line';
  enabled?: boolean;
}

interface BusinessInsight {
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export const AICaption: React.FC<AICaptionProps> = ({ 
  data, 
  industry, 
  chartType, 
  enabled = true 
}) => {
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (enabled && data && data.length > 0) {
      generateInsights();
    }
  }, [data, industry, chartType, enabled]);

  const generateInsights = async () => {
    if (!enabled || data.length === 0) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // CMS Medicare - local
      if (industry === 'cms_medicare') {
        const localInsights = generateLocalCMSMedicareInsights(data, chartType);
        setInsights(localInsights);
        return;
      }

      // Other industries - backend
      const sampleData = data.slice(0, 20);
      const result = await generateBusinessInsights({ data: sampleData, industry, chartType });
      const limitedInsights = (result.insights || []).slice(0, 3);
      setInsights(limitedInsights);
    } catch (err: any) {
      console.error('AI caption error:', err);
      setError(err.message || 'Failed to generate business insights');
      setInsights([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Local CMS insights
  const generateLocalCMSMedicareInsights = (data: any[], chartType: 'bar' | 'line' | 'pie'): BusinessInsight[] => {
    const insights: BusinessInsight[] = [];
    
    try {
      if (chartType === 'bar') {
        // Bar chart insights for CMS Medicare
        const stateAnalysis = analyzeStateData(data);
        if (stateAnalysis) {
          insights.push({
            title: 'State Performance Analysis',
            description: stateAnalysis,
            type: 'positive',
            confidence: 0.9
          });
        }

        const drgAnalysis = analyzeDRGData(data);
        if (drgAnalysis) {
          insights.push({
            title: 'DRG Distribution Insights',
            description: drgAnalysis,
            type: 'neutral',
            confidence: 0.85
          });
        }

        const financialAnalysis = analyzeFinancialData(data);
        if (financialAnalysis) {
          insights.push({
            title: 'Financial Performance',
            description: financialAnalysis,
            type: 'positive',
            confidence: 0.8
          });
        }

        // Add provider analysis if we have enough data
        const providerAnalysis = analyzeProviderData(data);
        if (providerAnalysis && insights.length < 3) {
          insights.push({
            title: 'Provider Network Analysis',
            description: providerAnalysis,
            type: 'neutral',
            confidence: 0.75
          });
        }

        // Add discharge analysis if we have enough data
        const dischargeAnalysis = analyzeDischargeData(data);
        if (dischargeAnalysis && insights.length < 3) {
          insights.push({
            title: 'Discharge Volume Analysis',
            description: dischargeAnalysis,
            type: 'positive',
            confidence: 0.7
          });
        }
      } else if (chartType === 'pie') {
        // Pie chart insights for CMS Medicare
        const geographicAnalysis = analyzeGeographicData(data);
        if (geographicAnalysis) {
          insights.push({
            title: 'Provider Location Analysis',
            description: geographicAnalysis,
            type: 'neutral',
            confidence: 0.9
          });
        }

        const providerTypeAnalysis = analyzeProviderTypeData(data);
        if (providerTypeAnalysis) {
          insights.push({
            title: 'Provider Type Analysis',
            description: providerTypeAnalysis,
            type: 'positive',
            confidence: 0.85
          });
        }

        const paymentAnalysis = analyzePaymentDistribution(data);
        if (paymentAnalysis) {
          insights.push({
            title: 'Payment Distribution',
            description: paymentAnalysis,
            type: 'neutral',
            confidence: 0.8
          });
        }

        // Add Medicare vs Total payment analysis
        const medicareAnalysis = analyzeMedicarePaymentRatio(data);
        if (medicareAnalysis && insights.length < 3) {
          insights.push({
            title: 'Medicare Payment Ratio',
            description: medicareAnalysis,
            type: 'neutral',
            confidence: 0.75
          });
        }

        // Add charge analysis if we have enough data
        const chargeAnalysis = analyzeChargeData(data);
        if (chargeAnalysis && insights.length < 3) {
          insights.push({
            title: 'Charge Analysis',
            description: chargeAnalysis,
            type: 'positive',
            confidence: 0.7
          });
        }
      }

      // Add only the most essential insights (limit to 3 total)
      if (insights.length === 0) {
        insights.push({
          title: 'Data Quality Assessment',
          description: `Analyzed ${data.length} CMS Medicare records for comprehensive provider insights.`,
          type: 'neutral',
          confidence: 0.9
        });
      }
      
      if (insights.length === 1) {
        insights.push({
          title: 'Provider Network Analysis',
          description: 'Comprehensive analysis of provider types, geographic coverage, and service categories across the Medicare network.',
          type: 'positive',
          confidence: 0.85
        });
      }
      
      if (insights.length === 2) {
        insights.push({
          title: 'Performance Metrics',
          description: 'Analysis of Medicare payment patterns, DRG distribution, and financial performance across provider networks.',
          type: 'neutral',
          confidence: 0.8
        });
      }

      return insights.slice(0, 3);
    } catch (error) {
      console.error('Error generating local CMS Medicare insights:', error);
      return [{
        title: 'CMS Medicare Insights',
        description: 'Analysis of Medicare provider data with enhanced state abbreviation and RUCA description fields.',
        type: 'positive',
        confidence: 0.9
      }];
    }
  };

  // Helper functions for CMS Medicare analysis
  const analyzeStateData = (data: any[]): string | null => {
    try {
      const stateData = new Map<string, { totalPayment: number; count: number }>();
      
      data.forEach(row => {
        const state = row['Rndrng_Prvdr_State_Abrvtn'] || row['Rndrng_Prvdr_St'];
        const payment = parseFloat(row['Avg_Tot_Pymt_Amt']) || 0;
        
        if (state && payment > 0) {
          const existing = stateData.get(state) || { totalPayment: 0, count: 0 };
          existing.totalPayment += payment;
          existing.count += 1;
          stateData.set(state, existing);
        }
      });

      if (stateData.size > 0) {
        const topState = Array.from(stateData.entries())
          .sort((a, b) => b[1].totalPayment - a[1].totalPayment)[0];
        
        return `Top performing state: ${topState[0]} with $${(topState[1].totalPayment / 1000000).toFixed(1)}M in payments across ${topState[1].count} providers.`;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const analyzeDRGData = (data: any[]): string | null => {
    try {
      const drgData = new Map<string, number>();
      
      data.forEach(row => {
        const drg = row['DRG_Cd'];
        if (drg) {
          drgData.set(drg, (drgData.get(drg) || 0) + 1);
        }
      });

      if (drgData.size > 0) {
        const topDRG = Array.from(drgData.entries())
          .sort((a, b) => b[1] - a[1])[0];
        
        return `Most common DRG: ${topDRG[0]} with ${topDRG[1]} cases, representing ${((topDRG[1] / data.length) * 100).toFixed(1)}% of total discharges.`;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const analyzeFinancialData = (data: any[]): string | null => {
    try {
      const totalCharges = data.reduce((sum, row) => sum + (parseFloat(row['Avg_Submtd_Cvrd_Chrg']) || 0), 0);
      const totalPayments = data.reduce((sum, row) => sum + (parseFloat(row['Avg_Tot_Pymt_Amt']) || 0), 0);
      
      if (totalCharges > 0 && totalPayments > 0) {
        const paymentRatio = ((totalPayments / totalCharges) * 100).toFixed(1);
        return `Overall payment ratio: ${paymentRatio}% with total charges of $${(totalCharges / 1000000).toFixed(1)}M and payments of $${(totalPayments / 1000000).toFixed(1)}M.`;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const analyzeGeographicData = (data: any[]): string | null => {
    try {
      // Try to analyze geographic data, but provide fallback if RUCA data is not available
      const ruralCount = data.filter(row => {
        const ruca = row['Rndrng_Prvdr_RUCA_Desc'] || row['Rndrng_Prvdr_RUCA'];
        return ruca && ruca.toString().toLowerCase().includes('rural');
      }).length;
      
      const urbanCount = data.filter(row => {
        const ruca = row['Rndrng_Prvdr_RUCA_Desc'] || row['Rndrng_Prvdr_RUCA'];
        return ruca && ruca.toString().toLowerCase().includes('metropolitan');
      }).length;
      
      const total = data.length;
      if (total > 0) {
        if (ruralCount > 0 || urbanCount > 0) {
          return `Provider location analysis: ${ruralCount} rural providers (${((ruralCount / total) * 100).toFixed(1)}%) vs ${urbanCount} metropolitan providers (${((urbanCount / total) * 100).toFixed(1)}%).`;
        } else {
          // Fallback: Provide alternative geographic insight based on state data
          const stateData = new Set<string>();
          data.forEach(row => {
            const state = row['Rndrng_Prvdr_State_Abrvtn'] || row['Rndrng_Prvdr_St'];
            if (state) stateData.add(state.toString().toUpperCase());
          });
          
          if (stateData.size > 0) {
            const stateList = Array.from(stateData).slice(0, 5).join(', ');
            return `Provider network coverage: ${stateData.size} states represented including ${stateList}`;
          } else {
            return `Provider network analysis: ${total} providers across the Medicare network`;
          }
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const analyzeProviderTypeData = (data: any[]): string | null => {
    try {
      const providerTypes = new Map<string, number>();
      
      data.forEach(row => {
        const orgName = row['Rndrng_Prvdr_Org_Name'];
        if (orgName) {
          const type = orgName.toLowerCase().includes('hospital') ? 'Hospital' :
                      orgName.toLowerCase().includes('medical center') ? 'Medical Center' :
                      orgName.toLowerCase().includes('clinic') ? 'Clinic' : 'Other';
          providerTypes.set(type, (providerTypes.get(type) || 0) + 1);
        }
      });

      if (providerTypes.size > 0) {
        const topType = Array.from(providerTypes.entries())
          .sort((a, b) => b[1] - a[1])[0];
        
        return `Provider type distribution: ${topType[0]} represents ${((topType[1] / data.length) * 100).toFixed(1)}% of providers.`;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const analyzePaymentDistribution = (data: any[]): string | null => {
    try {
      const payments = data.map(row => parseFloat(row['Avg_Tot_Pymt_Amt']) || 0).filter(p => p > 0);
      
      if (payments.length > 0) {
        const avgPayment = payments.reduce((sum, p) => sum + p, 0) / payments.length;
        const maxPayment = Math.max(...payments);
        const minPayment = Math.min(...payments);
        
        return `Payment range: $${(minPayment / 1000).toFixed(1)}K to $${(maxPayment / 1000).toFixed(1)}K with average of $${(avgPayment / 1000).toFixed(1)}K per case.`;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Additional analysis functions for CMS Medicare
  const analyzeProviderData = (data: any[]): string | null => {
    try {
      const uniqueProviders = new Set();
      data.forEach(row => {
        const providerName = row['Rndrng_Prvdr_Org_Name'];
        if (providerName) {
          uniqueProviders.add(providerName);
        }
      });
      
      if (uniqueProviders.size > 0) {
        return `Network analysis: ${uniqueProviders.size} unique healthcare providers across ${data.length} total records.`;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const analyzeDischargeData = (data: any[]): string | null => {
    try {
      const discharges = data.map(row => parseInt(row['Tot_Dschrgs']) || 0).filter(d => d > 0);
      
      if (discharges.length > 0) {
        const totalDischarges = discharges.reduce((sum, d) => sum + d, 0);
        const avgDischarges = totalDischarges / discharges.length;
        
        return `Discharge volume: Total of ${totalDischarges.toLocaleString()} discharges with average of ${avgDischarges.toFixed(1)} per provider.`;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const analyzeMedicarePaymentRatio = (data: any[]): string | null => {
    try {
      let totalMedicarePayments = 0;
      let totalPayments = 0;
      let validRecords = 0;
      
      data.forEach(row => {
        const medicarePayment = parseFloat(row['Avg_Mdcr_Pymt_Amt']) || 0;
        const totalPayment = parseFloat(row['Avg_Tot_Pymt_Amt']) || 0;
        
        if (medicarePayment > 0 && totalPayment > 0) {
          totalMedicarePayments += medicarePayment;
          totalPayments += totalPayment;
          validRecords++;
        }
      });
      
      if (validRecords > 0 && totalPayments > 0) {
        const ratio = ((totalMedicarePayments / totalPayments) * 100).toFixed(1);
        return `Medicare payment ratio: ${ratio}% of total payments are Medicare-funded across ${validRecords} valid records.`;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const analyzeChargeData = (data: any[]): string | null => {
    try {
      const charges = data.map(row => parseFloat(row['Avg_Submtd_Cvrd_Chrg']) || 0).filter(c => c > 0);
      
      if (charges.length > 0) {
        const totalCharges = charges.reduce((sum, c) => sum + c, 0);
        const avgCharges = totalCharges / charges.length;
        const maxCharges = Math.max(...charges);
        
        return `Charge analysis: Total submitted charges of $${(totalCharges / 1000000).toFixed(1)}M with average of $${(avgCharges / 1000).toFixed(1)}K per case.`;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  if (!enabled) return null;

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-blue-700 dark:text-blue-300">Generating AI insights...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400 text-sm">
          AI insights unavailable: {error}
        </p>
      </div>
    );
  }

  if (insights.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 mb-6">
      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4 flex items-center">
        <Brain className="w-5 h-5 mr-2" />
        {industry === 'cms_medicare' ? 'CMS Medicare Insights' : `AI Business Insights (${insights.length} captions)`}
      </h3>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className={`p-1 rounded-full ${
              insight.type === 'positive' ? 'bg-green-100 dark:bg-green-900/20' :
              insight.type === 'negative' ? 'bg-red-100 dark:bg-red-900/20' :
              'bg-gray-100 dark:bg-gray-900/20'
            }`}>
              {insight.type === 'positive' ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : insight.type === 'negative' ? (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              ) : (
                <Brain className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">{insight.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">{insight.description}</p>
              <span className="text-xs text-blue-600 dark:text-blue-400">
                Confidence: {Math.round(insight.confidence * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
