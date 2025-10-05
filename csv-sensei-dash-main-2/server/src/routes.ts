import { Router } from 'express';
import { RecordModel } from './models/Record';

export const router = Router();

router.get('/health', async (_req, res) => {
  const ok = !!(await RecordModel.db?.readyState);
  res.json({ ok });
});

// AI endpoints
router.post('/ai/analyze-csv-schema', async (req, res) => {
  try {
    const { csvHeaders, selectedIndustry, validationErrors } = req.body ?? {};
    
    if (!Array.isArray(csvHeaders)) {
      return res.status(400).json({ error: 'csvHeaders required' });
    }

    const openAIApiKey = process.env.OPENAI_API_KEY;
    
    if (!openAIApiKey) {
      console.log('OpenAI API key not found in environment variables');
      return res.status(400).json({ 
        error: 'OpenAI API key not configured',
        message: 'Please add your OPENAI_API_KEY to environment variables'
      });
    }

    console.log('Analyzing schema:', selectedIndustry);

    const prompt = `
You are a data schema expert. A user uploaded a CSV file for a ${selectedIndustry} industry dashboard but it failed validation.

CSV Headers: ${csvHeaders.join(', ')}
Validation Errors: ${validationErrors?.map((e: any) => `${e.field}: ${e.message}`).join('; ') || 'None'}

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

    console.log('Calling OpenAI...');
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
      
      // Remove markdown blocks
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

    console.log('Analysis complete');
    res.json(analysis);
  } catch (error) {
    console.error('Error in analyze-csv-schema function:', error);
    res.status(500).json({ 
      error: 'Failed to analyze schema', 
      details: error instanceof Error ? error.message : 'Unknown error',
      message: 'Check the console logs for more details'
    });
  }
});

router.post('/ai/generate-business-insights', async (req, res) => {
  try {
    const { data, industry, chartType } = req.body ?? {};
    
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'data array required' });
    }

    const openAIApiKey = process.env.OPENAI_API_KEY;
    
    if (!openAIApiKey) {
      return res.status(400).json({ 
        error: 'OpenAI API key not configured',
        insights: []
      });
    }

    console.log('Generating insights:', industry);

    // Prepare data summary
    const dataSummary = {
      rowCount: data.length,
      fields: Object.keys(data[0] || {}),
      // Sample 3 rows
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
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a business intelligence expert. Always respond with valid JSON containing exactly 2-3 insights.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    
    let insights;
    try {
      let content = aiResponse.choices[0].message.content.trim();
      
      // Clean response
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      
      insights = JSON.parse(content);
      
      // Limit to 3 insights
      if (insights.insights && insights.insights.length > 3) {
        insights.insights = insights.insights.slice(0, 3);
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse.choices[0].message.content);
      return res.json({ insights: [] });
    }

    res.json(insights);
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ 
      error: 'Failed to generate insights',
      insights: []
    });
  }
});

router.get('/records', async (req, res) => {
  const userEmail = String(req.query.userEmail || '');
  const q = userEmail ? { userEmail } : {};
  const items = await RecordModel.find(q).sort({ createdAt: -1 }).lean();
  res.json(items);
});

router.post('/records', async (req, res) => {
  const { userEmail, data } = req.body ?? {};
  if (!data) return res.status(400).json({ error: 'data required' });
  const doc = await RecordModel.create({ userEmail, data });
  res.status(201).json(doc);
});

router.delete('/records/:id', async (req, res) => {
  await RecordModel.findByIdAndDelete(req.params.id);
  res.status(204).end();
});


