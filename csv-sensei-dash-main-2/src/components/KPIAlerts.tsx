
import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Activity } from 'lucide-react';

// KPI Alert Governance Matrix
const EXCLUDED_FIELDS = [
  'customer_id', 'invoice_id', 'order_id', 'vin', 'serial_no', 'phone', 'email', 
  'ticket_id', 'user_id', 'reference_no', 'contact_number', 'address', 'comments'
];

const KPI_FOCUS_AREAS = {
  trends: ['revenue', 'unit_price', 'price', 'volume', 'service_duration', 'duration'],
  spikes: ['cost', 'defects', 'complaints', 'returns', 'expense', 'error'],
  drops: ['inventory', 'conversions', 'attendance', 'engagement', 'stock', 'conversion_rate']
};

interface KPIAlert {
  id: string;
  title: string;
  message: string;
  type: 'spike' | 'trend' | 'anomaly';
  severity: 'low' | 'medium' | 'high';
  value: number;
  threshold: number;
}

interface KPIAlertsProps {
  data: any[];
  industry: string;
}

export const KPIAlerts: React.FC<KPIAlertsProps> = ({ data, industry }) => {
  const [alerts, setAlerts] = useState<KPIAlert[]>([]);

  useEffect(() => {
    if (data && data.length > 0) {
      generateKPIAlerts();
    }
  }, [data, industry]);

  const generateKPIAlerts = () => {
    const newAlerts: KPIAlert[] = [];
    
    if (data.length === 0) return;

    const fields = Object.keys(data[0]);
    
    // Filter out excluded fields and only keep numeric fields
    const numericFields = fields.filter(field => {
      const fieldLower = field.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const isExcluded = EXCLUDED_FIELDS.some(excluded => 
        fieldLower.includes(excluded.toLowerCase())
      );
      const isNumeric = data.some(row => !isNaN(parseFloat(row[field])));
      return !isExcluded && isNumeric;
    });

    numericFields.forEach(field => {
      const values = data.map(row => parseFloat(row[field]) || 0).filter(val => val > 0);
      if (values.length === 0) return;

      const fieldLower = field.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      // Check if field matches KPI focus areas
      const isTrendField = KPI_FOCUS_AREAS.trends.some(keyword => 
        fieldLower.includes(keyword)
      );
      const isSpikeField = KPI_FOCUS_AREAS.spikes.some(keyword => 
        fieldLower.includes(keyword)
      );
      const isDropField = KPI_FOCUS_AREAS.drops.some(keyword => 
        fieldLower.includes(keyword)
      );

      // Spike detection (for cost, defects, complaints, returns)
      if (isSpikeField || (!isTrendField && !isDropField)) {
        const spikeThreshold = avg * 1.5; // Lower threshold for spike fields
        const spikes = values.filter(val => val > spikeThreshold);
        if (spikes.length > 0) {
          newAlerts.push({
            id: `spike-${field}`,
            title: `${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Spike Alert`,
            message: `${spikes.length} values exceed normal range (${spikeThreshold.toFixed(2)})`,
            type: 'spike',
            severity: spikes.length > values.length * 0.1 ? 'high' : 'medium',
            value: Math.max(...spikes),
            threshold: spikeThreshold
          });
        }
      }

      // Trend detection (for revenue, unit price, volume, service duration)
      if ((isTrendField || (!isSpikeField && !isDropField)) && values.length >= 5) {
        const midPoint = Math.floor(values.length / 2);
        const recentAvg = values.slice(midPoint).reduce((sum, val) => sum + val, 0) / (values.length - midPoint);
        const earlierAvg = values.slice(0, midPoint).reduce((sum, val) => sum + val, 0) / midPoint;
        const trendPercentage = ((recentAvg - earlierAvg) / earlierAvg) * 100;

        if (Math.abs(trendPercentage) > 15) {
          newAlerts.push({
            id: `trend-${field}`,
            title: `${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Trend Alert`,
            message: `${trendPercentage > 0 ? 'Upward' : 'Downward'} trend: ${Math.abs(trendPercentage).toFixed(1)}%`,
            type: 'trend',
            severity: Math.abs(trendPercentage) > 30 ? 'high' : 'medium',
            value: recentAvg,
            threshold: earlierAvg
          });
        }
      }

      // Drop detection (for inventory, conversions, attendance, engagement)
      if (isDropField && values.length >= 3) {
        const recent = values.slice(-3);
        const earlier = values.slice(0, -3);
        if (earlier.length > 0) {
          const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
          const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
          const dropPercentage = ((earlierAvg - recentAvg) / earlierAvg) * 100;

          if (dropPercentage > 20) {
            newAlerts.push({
              id: `drop-${field}`,
              title: `${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Drop Alert`,
              message: `Significant decline detected: ${dropPercentage.toFixed(1)}% drop`,
              type: 'anomaly',
              severity: dropPercentage > 40 ? 'high' : 'medium',
              value: recentAvg,
              threshold: earlierAvg
            });
          }
        }
      }
    });

    setAlerts(newAlerts.slice(0, 5)); // Limit to 5 most important alerts
  };

  const getAlertIcon = (type: KPIAlert['type']) => {
    switch (type) {
      case 'spike':
        return <TrendingUp className="w-5 h-5 text-red-500" />;
      case 'trend':
        return <TrendingDown className="w-5 h-5 text-yellow-500" />;
      case 'anomaly':
        return <Activity className="w-5 h-5 text-purple-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: KPIAlert['severity']) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800 mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
              All KPIs Normal
            </h3>
            <p className="text-green-600 dark:text-green-400">
              No significant spikes, trends, or anomalies detected in your data
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <AlertTriangle className="w-6 h-6 mr-2 text-orange-500" />
        Smart KPI Alerts
      </h3>
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-2xl p-4 border ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {alert.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {alert.message}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Value: {alert.value.toLocaleString()}</span>
                  <span>Threshold: {alert.threshold.toLocaleString()}</span>
                  <span className={`px-2 py-1 rounded-full ${
                    alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
