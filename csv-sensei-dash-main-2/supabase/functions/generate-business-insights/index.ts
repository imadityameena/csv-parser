
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured',
          insights: []
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data, industry, chartType } = await req.json();
    
    console.log('Generating business insights for:', industry, chartType);

    // Prepare minimal data summary for efficient token usage
    const dataSummary = {
      rowCount: data.length,
      fields: Object.keys(data[0] || {}),
      // Only include first 3 sample rows to minimize token consumption
      sampleData: data.slice(0, 3)
    };

    const prompt = `
Analyze this ${industry} business data and generate exactly 2-3 key business insights:

Data Summary:
- Rows: ${dataSummary.rowCount}
- Fields: ${dataSummary.fields.join(', ')}
- Chart Type: ${chartType}

Sample Data (first 3 rows):
${JSON.stringify(dataSummary.sampleData, null, 2)}

Generate exactly 2-3 actionable business captions focusing on:
1. Key performance trends
2. Revenue/growth opportunities  
3. Risk factors or operational insights

Respond with ONLY a JSON object containing exactly 2-3 insights:
{
  "insights": [
    {
      "title": "Brief insight title (max 8 words)",
      "description": "Detailed explanation (max 100 words)",
      "type": "positive|negative|neutral",
      "confidence": 0.8
    }
  ]
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using efficient model to minimize costs
        messages: [
          { role: 'system', content: 'You are a business intelligence expert. Always respond with valid JSON containing exactly 2-3 insights.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800, // Reduced token limit for efficiency
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    
    let insights;
    try {
      let content = aiResponse.choices[0].message.content.trim();
      
      // Clean up response
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      
      insights = JSON.parse(content);
      
      // Ensure we have exactly 2-3 insights
      if (insights.insights && insights.insights.length > 3) {
        insights.insights = insights.insights.slice(0, 3);
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse.choices[0].message.content);
      return new Response(JSON.stringify({ insights: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate insights',
        insights: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
