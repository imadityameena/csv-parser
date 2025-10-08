import OpenAI from 'openai';
import { ChatMessage, ChatRequest, ChatResponse } from '../types/chat';

export class OpenAIService {
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey: apiKey,
    });
    
    // Use GPT-4 for better performance, fallback to GPT-3.5-turbo if needed
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
  }

  async generateResponse(
    request: ChatRequest,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      // Debug: Log the request data
      console.log('🤖 OpenAI Service Debug:');
      console.log('Request message:', request.message);
      console.log('Request context:', request.context);
      console.log('Data analysis available:', !!request.dataAnalysis);
      if (request.dataAnalysis) {
        console.log('Data summary:', request.dataAnalysis.summary);
        console.log('Record count:', request.dataAnalysis.recordCount);
        console.log('Data fields:', request.dataAnalysis.dataFields);
        console.log('Sample data:', request.dataAnalysis.sampleData);
      }

      // Build conversation context
      const messages = this.buildConversationContext(request, conversationHistory);
      
      // Generate response using OpenAI
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response generated from OpenAI');
      }

      const processingTime = Date.now() - startTime;

      return {
        message: response,
        conversationId: request.conversationId || this.generateConversationId(),
        timestamp: new Date(),
        metadata: {
          tokens: completion.usage?.total_tokens || 0,
          model: this.model,
          processingTime,
        },
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildConversationContext(
    request: ChatRequest,
    conversationHistory: ChatMessage[]
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    // System message with context about CSV Sensei Dashboard
    const systemMessage = this.buildSystemMessage(request.context, request.dataAnalysis);
    messages.push(systemMessage);

    // Add conversation history (last 10 messages to stay within token limits)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: request.message,
    });

    return messages;
  }

  private buildSystemMessage(
    context?: ChatRequest['context'], 
    dataAnalysis?: ChatRequest['dataAnalysis']
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam {
    const baseContext = `You are an AI assistant for the CSV Sensei Dashboard, a comprehensive business intelligence and data analysis platform for healthcare organizations. You help users understand their data, provide insights, and answer questions about their CSV files and dashboard metrics.

## CSV SENSEI DASHBOARD OVERVIEW
The CSV Sensei Dashboard is a multi-dashboard platform with the following main sections:

### 1. BUSINESS INTELLIGENCE DASHBOARD
- General data analysis and insights
- KPI monitoring and alerts
- Data quality assessment
- Business metrics and trends

### 2. COMPLIANCE DASHBOARD
- Healthcare compliance monitoring
- Violation tracking and analysis
- Risk assessment and scoring
- Regulatory compliance reporting

### 3. BILLING DASHBOARD
- Revenue and billing analysis
- Payment tracking and status
- Financial metrics and KPIs
- Billing compliance monitoring

### 4. DOCTOR ROSTER DASHBOARD
- Staff management and scheduling
- Doctor availability and assignments
- License tracking and expiry monitoring
- Staff performance metrics

## COMPLIANCE VIOLATIONS KNOWLEDGE BASE
The system tracks specific compliance violations with the following rules:

### HIGH SEVERITY VIOLATIONS (R1-R8):
- **R1**: Patient_ID must exist and be unique per Visit_ID
- **R2**: Age must be between 0 and 120 years
- **R3**: Visit_Date cannot be in the future
- **R4**: Doctor_ID must exist in doctor roster
- **R5**: Doctor's License_Expiry must be ≥ Visit_Date
- **R6**: Procedure_Code must be OP100, OP200, or OP300
- **R7**: Amount must be >0 and ≤100,000
- **R8**: If Procedure_Code=OP300, Consent_Flag must be Y

### MEDIUM SEVERITY VIOLATIONS:
- **R9**: Doctor's specialty must match procedure mapping
  - OP100 → General Medicine
  - OP200 → Orthopedics  
  - OP300 → Cardiology

### LOW SEVERITY VIOLATIONS:
- **R10**: Payer_Type must be CASH, INSURANCE, or GOVT

## DATA SCHEMAS AND STRUCTURES

### OP BILLING SCHEMA:
Required fields: Visit_ID, Patient_ID, Patient_Name, Age, Visit_Date, Doctor_ID, Procedure_Code, Payer_Type, Amount, Consent_Flag
Optional fields: Bill_ID, Bill_Date, Doctor_Name, Department, Service_Code, Service_Description, Quantity, Unit_Price, Total_Amount, Payment_Status, Payment_Method, Discount_Amount, Tax_Amount, Net_Amount, Currency, Payer, Insurance_Provider, Policy_Number, Authorization_No, Due_Date, Paid_Date, Notes

### DOCTOR ROSTER SCHEMA:
Required fields: Doctor_ID, Doctor_Name, Specialty, License_No, License_Expiry, Shift_Start, Shift_End
Optional fields: Specialization, Department, Date, Shift, Start_Time, End_Time, Location, Room_No, On_Call, Contact, Email, Max_Appointments, Notes

## KEY CAPABILITIES:
- Analyze CSV data and provide insights
- Explain dashboard metrics and KPIs
- Help with data interpretation and visualization
- Provide business intelligence recommendations
- Answer questions about compliance, billing, and operational data
- Suggest data analysis approaches
- Explain specific compliance violations and their meanings
- Provide guidance on data quality and validation issues

## GUIDELINES:
- Be helpful, accurate, and professional
- Provide specific, actionable insights when possible
- Use clear, concise language
- If you don't know something, say so rather than guessing
- Focus on data-driven insights and business value
- Consider the context of the user's current dashboard and data type
- Use the provided data analysis to give accurate, data-driven answers
- When asked about violations (R1-R10), provide detailed explanations of what they mean and how to fix them
- Always refer to actual data values when available`;

    let contextSpecific = '';
    if (context) {
      if (context.industry) {
        contextSpecific += `\n\nCurrent Industry Context: ${context.industry}`;
      }
      if (context.dataType) {
        contextSpecific += `\nCurrent Data Type: ${context.dataType}`;
      }
      if (context.currentDashboard) {
        contextSpecific += `\nCurrent Dashboard: ${context.currentDashboard}`;
      }
    }

    let dataContext = '';
    if (dataAnalysis) {
      dataContext = `\n\nCURRENT DATA ANALYSIS:
Dataset Summary: ${dataAnalysis.summary}
Record Count: ${dataAnalysis.recordCount}
Data Fields: ${dataAnalysis.dataFields.join(', ')}
Data Types: ${JSON.stringify(dataAnalysis.dataTypes, null, 2)}
Key Insights: ${dataAnalysis.insights.join('; ')}
Sample Data: ${JSON.stringify(dataAnalysis.sampleData, null, 2)}
Statistics: ${JSON.stringify(dataAnalysis.statistics, null, 2)}

IMPORTANT: Use this actual data to provide accurate, specific answers. When users ask about their data, refer to these actual values and statistics.`;

      // Add specific guidance based on data type and dashboard context
      if (dataAnalysis.dataFields.some(f => f.toLowerCase().includes('patient'))) {
        dataContext += `\n\nPATIENT DATA DETECTED: You can answer questions about patient counts, demographics, and patient-related metrics.`;
      }
      if (dataAnalysis.dataFields.some(f => f.toLowerCase().includes('doctor'))) {
        dataContext += `\n\nDOCTOR DATA DETECTED: You can answer questions about doctor counts, specializations, and staff metrics.`;
      }
      if (dataAnalysis.dataFields.some(f => f.toLowerCase().includes('amount') || f.toLowerCase().includes('revenue'))) {
        dataContext += `\n\nFINANCIAL DATA DETECTED: You can answer questions about revenue, amounts, totals, and financial metrics.`;
      }
      if (dataAnalysis.dataFields.some(f => f.toLowerCase().includes('violation') || f.toLowerCase().includes('rule'))) {
        dataContext += `\n\nCOMPLIANCE DATA DETECTED: You can answer questions about violations (R1-R10), compliance issues, and regulatory requirements.`;
      }
      if (dataAnalysis.dataFields.some(f => f.toLowerCase().includes('procedure') || f.toLowerCase().includes('consent'))) {
        dataContext += `\n\nPROCEDURE DATA DETECTED: You can answer questions about medical procedures, consent requirements, and procedure-specific compliance rules.`;
      }
      if (dataAnalysis.dataFields.some(f => f.toLowerCase().includes('license') || f.toLowerCase().includes('expiry'))) {
        dataContext += `\n\nLICENSE DATA DETECTED: You can answer questions about doctor licenses, expiry dates, and license-related compliance issues.`;
      }
    }

    return {
      role: 'system',
      content: baseContext + contextSpecific + dataContext,
    };
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return false;
    }
  }
}
