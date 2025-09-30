
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
      console.log('OpenAI API key not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured',
          message: 'Please add your OPENAI_API_KEY to Supabase Edge Function Secrets'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { csvHeaders, selectedIndustry, validationErrors } = await req.json();
    
    console.log('Analyzing CSV schema for industry:', selectedIndustry);
    console.log('CSV Headers:', csvHeaders);
    console.log('Validation Errors:', validationErrors);

    const prompt = `
You are a data schema expert. A user uploaded a CSV file for a ${selectedIndustry} industry dashboard but it failed validation.

CSV Headers: ${csvHeaders.join(', ')}
Validation Errors: ${validationErrors.map(e => `${e.field}: ${e.message}`).join('; ')}

Industry Schema Requirements:
- Sales: Invoice ID, Customer Name, Product, Qty
- Retail: Product, Category, Price, Region  
- Finance: Account, Transaction Type, Amount, Date
- Healthcare: Patient ID, Service, Provider, Amount
- Accounting: Account, Transaction Type, Amount, Date, Description
- Raw Material Procurement: Material ID, Material Name, Category, Supplier ID, Unit Cost, Quantity, Total Cost
- Spare Parts: Part ID, Part Name, Category, Supplier ID, Purchase Date, Warranty Years, Stock Quantity, Unit Cost, Shipping Cost, Import Duty, Handling Cost, Other Cost, Revenue, Restock Threshold, Currency, Part Status, Barcode
- Training Institute: Student ID, Student Name, Course Name, Trainer Name, Trainer Rating, Enrollment Date, Course Fee, Discount, Payment Status, Payment Mode, Session Attended, Total Sessions, Course Completion Status, Trainer Experience Years, Course Rating, Refund Requested, Placement Assistance, ID Proof, Email ID, Mobile Number, City, State
- Service Maintenance: Service ID, Customer Name, Equipment, Service Type, Service Date, Service Cost, Parts Cost, Total Cost, Payment Status, Payment Date, Payment Method, Warranty Status, Technician Efficiency, Customer Feedback, Equipment Age, Equipment Condition, Equipment Brand, Equipment Model, Equipment Serial Number, Equipment Location, Equipment Status, Equipment Notes
- Real Estate Agency: Property ID, Listing Date, Property Type, Area (sqft), Location City, State, Listed Price, Final Sale Price, Commission Amount, Commission Percentage, GST Amount, GST Rate, Buyer Type, Buyer ID, Agent ID, Agent Name, Agent Experience Years, Profit, Profit Margin, Total Deal Value, Lead Source, Closing Status, Property Status, Visit Count, Days on Market, Documentation Status, Assigned Executive, Site Visit Completed, Payment Mode

Analyze the CSV headers and suggest:
1. Field mappings from CSV headers to required schema fields
2. Any data transformations needed
3. Whether the data is suitable for ${selectedIndustry} analysis

Respond with ONLY a JSON object (no markdown formatting):
{
  "canProceed": boolean,
  "mappings": { "csvHeader": "schemaField" },
  "transformations": ["list of needed transformations"],
  "reasoning": "explanation of analysis",
  "confidence": number (0-1)
}
`;

    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a data schema analysis expert. Always respond with valid JSON only, no markdown formatting.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');
    
    let analysis;
    try {
      let content = data.choices[0].message.content.trim();
      
      // Remove markdown code blocks if present
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      analysis = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', data.choices[0].message.content);
      throw new Error('Invalid response format from OpenAI');
    }

    console.log('Analysis completed successfully');
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-csv-schema function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze schema', 
        details: error.message,
        message: 'Check the console logs for more details'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
