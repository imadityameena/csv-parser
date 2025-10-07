import { Router } from 'express';
import { RecordModel } from './models/Record';
import { aiService } from './services/aiService.js';

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

// AI Chat endpoints
router.post('/ai/chat', async (req, res) => {
  try {
    const { question, data, context } = req.body;
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ 
        error: 'Question is required and must be a string' 
      });
    }

    // If data is provided, analyze the actual CSV data
    if (data && Array.isArray(data) && data.length > 0) {
      const answer = await analyzeCSVData(question, data, context);
      res.json({ 
        answer,
        question,
        timestamp: new Date().toISOString(),
        dataAnalyzed: true
      });
    } else {
      // Fallback to dashboard knowledge base
      const answer = await aiService.answerQuestion(question);
      res.json({ 
        answer,
        question,
        timestamp: new Date().toISOString(),
        dataAnalyzed: false
      });
    }
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ 
      error: 'Failed to process question',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Function to analyze CSV data with AI
async function analyzeCSVData(question: string, data: any[], context: string): Promise<string> {
  try {
    const openAIApiKey = process.env.OPENAI_API_KEY;
    
    if (!openAIApiKey) {
      return "AI analysis is not available. Please configure OpenAI API key for advanced data analysis.";
    }

    // Prepare data summary for AI analysis
    const dataSummary = {
      totalRecords: data.length,
      fields: Object.keys(data[0] || {}),
      sampleData: data.slice(0, 5), // First 5 rows
      context: context || 'general'
    };

    const prompt = `
You are a data analyst AI assistant. A user has uploaded CSV data and is asking questions about it.

Question: "${question}"

Data Summary:
- Total Records: ${dataSummary.totalRecords}
- Fields: ${dataSummary.fields.join(', ')}
- Context: ${dataSummary.context}
- Sample Data (first 5 rows):
${JSON.stringify(dataSummary.sampleData, null, 2)}

Instructions:
1. Analyze the question in relation to the actual CSV data provided
2. Provide a helpful, accurate answer based on the data structure and content
3. If the question can't be answered with the available data, explain what data would be needed
4. Be specific and use actual numbers/values from the data when possible
5. Keep your response concise but informative

Answer:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful data analyst. Always provide accurate, data-driven answers.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    return aiResponse.choices[0].message.content.trim();
    
  } catch (error) {
    console.error('Error analyzing CSV data:', error);
    return "I encountered an error while analyzing your data. Please try rephrasing your question or check if your data is properly formatted.";
  }
}

// Initialize AI service
router.post('/ai/initialize', async (req, res) => {
  try {
    await aiService.initializeVectorStore();
    res.json({ 
      message: 'AI service initialized successfully',
      knowledgeBaseSize: aiService.getKnowledgeBaseSize()
    });
  } catch (error) {
    console.error('Error initializing AI service:', error);
    res.status(500).json({ 
      error: 'Failed to initialize AI service',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Train AI agent
router.post('/ai/train', async (req, res) => {
  try {
    const { epochs = 5 } = req.body;
    
    if (typeof epochs !== 'number' || epochs < 1 || epochs > 20) {
      return res.status(400).json({ 
        error: 'Epochs must be a number between 1 and 20' 
      });
    }

    await aiService.trainAgent(epochs);
    
    res.json({ 
      message: `AI agent trained successfully with ${epochs} epochs`,
      knowledgeBaseSize: aiService.getKnowledgeBaseSize()
    });
  } catch (error) {
    console.error('Error training AI agent:', error);
    res.status(500).json({ 
      error: 'Failed to train AI agent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get supported questions
router.get('/ai/questions', async (req, res) => {
  try {
    const questions = aiService.getSupportedQuestions();
    res.json({ 
      questions,
      count: questions.length
    });
  } catch (error) {
    console.error('Error getting supported questions:', error);
    res.status(500).json({ 
      error: 'Failed to get supported questions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get AI service status
router.get('/ai/status', async (req, res) => {
  try {
    res.json({ 
      initialized: aiService.getKnowledgeBaseSize() > 0,
      knowledgeBaseSize: aiService.getKnowledgeBaseSize(),
      supportedQuestions: aiService.getSupportedQuestions().length
    });
  } catch (error) {
    console.error('Error getting AI status:', error);
    res.status(500).json({ 
      error: 'Failed to get AI status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


