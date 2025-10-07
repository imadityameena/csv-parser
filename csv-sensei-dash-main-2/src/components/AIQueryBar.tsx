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

// Simple NL parser
function localAnswer(query: string, data: DataRecord[], context: 'billing' | 'roster'): string {
  const q = query.toLowerCase();
  if (context === 'billing') {
    if (q.includes('total revenue')) {
      const total = data.reduce((s, r) => s + (parseFloat(String((r as BillingRecord).Total_Amount)) || 0), 0);
      return `Total revenue: $${total.toLocaleString()}`;
    }
    if (q.includes('average') && (q.includes('bill') || q.includes('amount'))) {
      const vals = data.map(r => parseFloat(String((r as BillingRecord).Total_Amount)) || 0).filter(v => v > 0);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return `Average bill amount: $${avg.toFixed(2)}`;
    }
    if (q.includes('revenue by') && (q.includes('payer') || q.includes('payer type'))) {
      const map = new Map<string, number>();
      data.forEach(r => {
        const k = String((r as BillingRecord).Payer_Type || 'Unknown');
        const v = parseFloat(String((r as BillingRecord).Total_Amount)) || 0;
        map.set(k, (map.get(k) || 0) + v);
      });
      const parts = Array.from(map.entries()).map(([k, v]) => `${k}: $${v.toLocaleString()}`);
      return `Revenue by Payer_Type → ${parts.join(' | ')}`;
    }
    if (q.includes('which doctor') && (q.includes('most revenue') || q.includes('top doctor'))) {
      const map = new Map<string, number>();
      data.forEach(r => {
        const k = String((r as BillingRecord).Doctor_Name || 'Unknown');
        const v = parseFloat(String((r as BillingRecord).Total_Amount)) || 0;
        map.set(k, (map.get(k) || 0) + v);
      });
      const top = Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0];
      return top ? `Top doctor by revenue: ${top[0]} ($${top[1].toLocaleString()})` : 'No data available';
    }
  }
  if (context === 'roster') {
    if (q.includes('how many') && q.includes('doctors')) {
      const unique = new Set(data.map(r => (r as RosterRecord).Doctor_ID)).size;
      return `Total unique doctors: ${unique}`;
    }
    if (q.includes('most active department')) {
      const map = new Map<string, number>();
      data.forEach(r => {
        const k = String((r as RosterRecord).Department || 'Unknown');
        map.set(k, (map.get(k) || 0) + 1);
      });
      const top = Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0];
      return top ? `Most active department: ${top[0]} (${top[1]} shifts)` : 'No data available';
    }
    if (q.includes('on call')) {
      const count = data.filter(r => ((r as RosterRecord).On_Call === 'Y' || String((r as RosterRecord).On_Call).toLowerCase() === 'yes')).length;
      return `On-call shifts: ${count}`;
    }
  }
  return 'I could not interpret that question locally. Try rephrasing or enable OpenAI for richer Q&A.';
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
    
    // If local answer is not helpful, try AI service
    if (local.includes('I could not interpret that question locally')) {
      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: query
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAnswer(data.answer);
          onAnswer?.(data.answer);
        }
      } catch (error) {
        console.error('Error getting AI response:', error);
        toast({
          title: "Error",
          description: "Failed to get AI response. Please try again.",
          variant: "destructive",
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




