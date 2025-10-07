import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface BillingRecord {
  Total_Amount?: string | number;
  Payer_Type?: string;
  Doctor_Name?: string;
  [key: string]: string | number | undefined;
}

interface RosterRecord {
  Doctor_ID?: string | number;
  Department?: string;
  On_Call?: string | number;
  [key: string]: string | number | undefined;
}

type DataRecord = BillingRecord | RosterRecord;

interface AIQueryBarProps {
  data: DataRecord[];
  context: 'billing' | 'roster';
  onAnswer?: (text: string) => void;
}

// Enhanced NL parser that actually analyzes the CSV data
function localAnswer(query: string, data: DataRecord[], context: 'billing' | 'roster'): string {
  if (!data || data.length === 0) {
    return 'No data available to analyze. Please upload a CSV file first.';
  }

  const q = query.toLowerCase();
  
  // Helper function to get field value with multiple possible field names
  const getFieldValue = (row: any, possibleNames: string[], fallback: any = undefined) => {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        return row[name];
      }
    }
    return fallback;
  };

  // Helper function to parse amounts
  const parseAmount = (value: any): number => {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const str = String(value).replace(/[,\s]/g, '').replace(/[^0-9.-]/g, '');
    const n = parseFloat(str);
    return Number.isFinite(n) ? n : 0;
  };

  if (context === 'billing') {
    // Revenue and financial questions
    if (q.includes('total revenue') || q.includes('total amount') || q.includes('total billing')) {
      const total = data.reduce((sum, row) => {
        const amount = parseAmount(getFieldValue(row, ['Total_Amount', 'Amount', 'TotalAmount', 'Amount_Billed', 'Bill_Amount', 'Gross_Amount', 'Revenue', 'Billing_Amount']));
        return sum + amount;
      }, 0);
      return `Total revenue: $${total.toLocaleString()}`;
    }
    
    if (q.includes('average') && (q.includes('bill') || q.includes('amount') || q.includes('revenue'))) {
      const amounts = data.map(row => parseAmount(getFieldValue(row, ['Total_Amount', 'Amount', 'TotalAmount', 'Amount_Billed', 'Bill_Amount', 'Gross_Amount', 'Revenue', 'Billing_Amount']))).filter(v => v > 0);
      const avg = amounts.length ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
      return `Average bill amount: $${avg.toFixed(2)}`;
    }
    
    if (q.includes('revenue by') && (q.includes('payer') || q.includes('payer type'))) {
      const map = new Map<string, number>();
      data.forEach(row => {
        const payerType = getFieldValue(row, ['Payer_Type', 'PayerType', 'Insurance_Type', 'InsuranceType', 'Payment_Type', 'PaymentType']) || 'Unknown';
        const amount = parseAmount(getFieldValue(row, ['Total_Amount', 'Amount', 'TotalAmount', 'Amount_Billed', 'Bill_Amount', 'Gross_Amount', 'Revenue', 'Billing_Amount']));
        map.set(String(payerType), (map.get(String(payerType)) || 0) + amount);
      });
      const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
      return `Revenue by payer type:\n${entries.map(([k, v]) => `${k}: $${v.toLocaleString()}`).join('\n')}`;
    }
    
    // Visit and patient questions
    if (q.includes('total visits') || q.includes('total patients') || q.includes('total records')) {
      return `Total visits: ${data.length}`;
    }
    
    if (q.includes('unique doctors') || q.includes('total doctors') || q.includes('how many doctors')) {
      const unique = new Set(data.map(row => getFieldValue(row, ['Doctor_Name', 'DoctorName', 'Doctor_ID', 'DoctorId', 'Provider_Name', 'ProviderName'])).filter(Boolean)).size;
      return `Total unique doctors: ${unique}`;
    }
    
    if (q.includes('unique patients') || q.includes('total patients') || q.includes('how many patients')) {
      const unique = new Set(data.map(row => getFieldValue(row, ['Patient_ID', 'PatientId', 'Patient_Name', 'PatientName'])).filter(Boolean)).size;
      return `Total unique patients: ${unique}`;
    }
    
    // Department analysis
    if (q.includes('department') || q.includes('specialty') || q.includes('specialization')) {
      const map = new Map<string, number>();
      data.forEach(row => {
        const dept = getFieldValue(row, ['Department', 'Dept', 'Specialty', 'specialty', 'Specialization', 'specialization', 'Speciality', 'speciality']) || 'Unknown';
        map.set(String(dept), (map.get(String(dept)) || 0) + 1);
      });
      const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
      return `Department distribution:\n${entries.map(([k, v]) => `${k}: ${v} visits`).join('\n')}`;
    }
    
    // Payment status
    if (q.includes('payment status') || q.includes('payment') || q.includes('paid')) {
      const map = new Map<string, number>();
      data.forEach(row => {
        const status = getFieldValue(row, ['Payment_Status', 'PaymentStatus', 'Status', 'Payment_Status_Desc', 'Paid_Status']) || 'Unknown';
        map.set(String(status), (map.get(String(status)) || 0) + 1);
      });
      const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
      return `Payment status distribution:\n${entries.map(([k, v]) => `${k}: ${v} records`).join('\n')}`;
    }
    
    // Date analysis
    if (q.includes('date') || q.includes('when') || q.includes('time')) {
      const dates = data.map(row => getFieldValue(row, ['Visit_Date', 'VisitDate', 'Date', 'Service_Date', 'ServiceDate', 'Billing_Date', 'BillingDate'])).filter(Boolean);
      if (dates.length > 0) {
        const sortedDates = dates.sort();
        return `Date range: ${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]} (${dates.length} records)`;
      }
    }
    
  } else if (context === 'roster') {
    // Doctor roster questions
    if (q.includes('total doctors') || q.includes('unique doctors') || q.includes('how many doctors')) {
      const unique = new Set(data.map(row => getFieldValue(row, ['Doctor_ID', 'DoctorId', 'ID', 'id', 'Doctor_Name', 'DoctorName'])).filter(Boolean)).size;
      return `Total unique doctors: ${unique}`;
    }
    
    if (q.includes('most active department') || q.includes('department') || q.includes('specialty')) {
      const map = new Map<string, number>();
      data.forEach(row => {
        const dept = getFieldValue(row, ['Department', 'Dept', 'Specialty', 'specialty', 'Specialization', 'specialization', 'Speciality', 'speciality']) || 'Unknown';
        map.set(String(dept), (map.get(String(dept)) || 0) + 1);
      });
      const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
      return `Department distribution:\n${entries.map(([k, v]) => `${k}: ${v} shifts`).join('\n')}`;
    }
    
    if (q.includes('on call') || q.includes('on-call')) {
      const count = data.filter(row => {
        const onCall = getFieldValue(row, ['On_Call', 'OnCall', 'On_Call_Status', 'OnCallStatus']);
        return onCall === 'Y' || String(onCall).toLowerCase() === 'yes' || String(onCall).toLowerCase() === 'true';
      }).length;
      return `On-call shifts: ${count} out of ${data.length} total shifts`;
    }
    
    if (q.includes('total shifts') || q.includes('shifts')) {
      return `Total shifts: ${data.length}`;
    }
    
    // Shift analysis
    if (q.includes('shift') || q.includes('schedule')) {
      const map = new Map<string, number>();
      data.forEach(row => {
        const shift = getFieldValue(row, ['Shift', 'Shift_Type', 'ShiftType', 'Time_Slot', 'TimeSlot']) || 'Unknown';
        map.set(String(shift), (map.get(String(shift)) || 0) + 1);
      });
      const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
      return `Shift distribution:\n${entries.map(([k, v]) => `${k}: ${v} shifts`).join('\n')}`;
    }
  }
  
  // If no specific pattern matches, try to provide general data insights
  const totalRecords = data.length;
  const sampleFields = Object.keys(data[0] || {});
  
  return `I found ${totalRecords} records with fields: ${sampleFields.slice(0, 5).join(', ')}${sampleFields.length > 5 ? '...' : ''}. Try asking about specific metrics like "total revenue", "unique doctors", "department distribution", or "payment status".`;
}

export const AIQueryBar: React.FC<AIQueryBarProps> = ({ data, context, onAnswer }) => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const { toast } = useToast();

  const handleAsk = async () => {
    if (!query.trim()) return;
    
    // Try local intent first
    const local = localAnswer(query, data, context);
    setAnswer(local);
    onAnswer?.(local);
    
    // If local answer is not helpful, try AI service with actual data
    if (local.includes('I could not interpret that question locally') || local.includes('Try asking about specific metrics')) {
      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: query,
            data: data, // Send the actual CSV data
            context: context
          }),
        });

        if (response.ok) {
          const responseData = await response.json();
          setAnswer(responseData.answer);
          onAnswer?.(responseData.answer);
        } else {
          // If AI service fails, show the local answer
          setAnswer(local);
          onAnswer?.(local);
        }
      } catch (error) {
        console.error('Error getting AI response:', error);
        // If AI service fails, show the local answer
        setAnswer(local);
        onAnswer?.(local);
        toast({
          title: "AI Service Unavailable",
          description: "Using local analysis. For advanced queries, ensure OpenAI API is configured.",
          variant: "default",
        });
      }
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-gray-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={context === 'billing' ? 'Ask billing questions (e.g., "total revenue last month")' : 'Ask roster questions (e.g., "how many doctors?")'}
          />
          <Button onClick={handleAsk} className="flex items-center">
            <Sparkles className="w-4 h-4 mr-1" />
            Ask
          </Button>
        </div>
        {answer && (
          <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
            {answer}
          </div>
        )}
      </CardContent>
    </Card>
  );
};




