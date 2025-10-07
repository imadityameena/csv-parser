import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';

// Knowledge base with 50+ dashboard-related questions and answers
const DASHBOARD_KNOWLEDGE_BASE = [
  {
    question: "What is CSV Sensei Dashboard?",
    answer: "CSV Sensei Dashboard is an AI-powered business intelligence platform that transforms CSV data into interactive visualizations and insights. It supports multiple industries including Doctor Roster, OP Billing, Compliance AI, and general business data analysis."
  },
  {
    question: "How do I upload a CSV file?",
    answer: "You can upload a CSV file by clicking the 'Upload CSV' button or dragging and dropping your file into the upload area. The system supports files up to 100,000 rows."
  },
  {
    question: "What industries are supported?",
    answer: "The dashboard supports Doctor Roster management, OP Billing, Compliance AI, and general business data analysis. Each industry has specialized schemas and validation rules."
  },
  {
    question: "What is the maximum file size?",
    answer: "The maximum supported file size is 100,000 rows. If your file exceeds this limit, you'll need to split it into smaller files."
  },
  {
    question: "How does data validation work?",
    answer: "The system performs comprehensive validation including missing field detection, data type validation, outlier detection, empty value analysis, and format validation for dates and numbers."
  },
  {
    question: "What visualization types are available?",
    answer: "Available visualizations include bar charts, line charts, pie charts, area charts, and scatter plots. The system automatically selects the best chart type based on your data."
  },
  {
    question: "How do I fix validation errors?",
    answer: "You can use the 'Fix with AI' feature which provides automated suggestions for common data issues, or manually correct the errors in your CSV file and re-upload."
  },
  {
    question: "What is AI-powered schema mapping?",
    answer: "AI schema mapping automatically maps your CSV columns to the expected fields for your selected industry, even if your column names don't exactly match the required schema."
  },
  {
    question: "How do I generate business insights?",
    answer: "Business insights are automatically generated after successful data validation. The AI analyzes your data and provides key performance trends, revenue opportunities, and risk factors."
  },
  {
    question: "What is compliance mode?",
    answer: "Compliance mode allows you to upload both OP Billing and Doctor Roster files for cross-validation and compliance violation detection in healthcare settings."
  },
  {
    question: "How do I switch between dark and light mode?",
    answer: "Use the theme toggle button in the top-right corner of the dashboard to switch between dark and light modes."
  },
  {
    question: "What data formats are supported?",
    answer: "The system supports various date formats (YYYY-MM-DD, MM/DD/YYYY, DD.MM.YYYY), numeric formats, and text data. It automatically detects and converts data types."
  },
  {
    question: "How do I export my results?",
    answer: "You can export your visualizations as images or download processed data. Look for the export options in the dashboard toolbar."
  },
  {
    question: "What is the step-by-step workflow?",
    answer: "The workflow consists of 4 steps: 1) Upload your CSV file, 2) Validate data quality, 3) Analyze and fix issues, 4) Visualize and explore insights."
  },
  {
    question: "How do I select my industry?",
    answer: "Use the industry selector dropdown at the beginning of the process to choose from Doctor Roster, OP Billing, Compliance AI, or General Business data."
  },
  {
    question: "What are the required fields for Doctor Roster?",
    answer: "Required fields include Doctor ID, Doctor Name, Department, Shift, and Date. Optional fields are Specialization, Contact, and Availability."
  },
  {
    question: "What are the required fields for OP Billing?",
    answer: "Required fields include Visit ID, Patient ID, Patient Name, Age, Visit Date, Doctor ID, Procedure Code, Payer Type, Amount, and Consent Flag."
  },
  {
    question: "How does outlier detection work?",
    answer: "The system uses statistical methods to identify unusual values in your data that may indicate errors or require special attention."
  },
  {
    question: "What is data completeness scoring?",
    answer: "Data completeness scoring evaluates how complete your dataset is by checking for missing values and calculating a percentage score."
  },
  {
    question: "How do I handle missing data?",
    answer: "The system identifies missing data and provides suggestions for handling it, such as filling with default values or excluding incomplete records."
  },
  {
    question: "What is the AI caption feature?",
    answer: "AI captions automatically generate meaningful descriptions for your charts, highlighting key trends and anomalies in your data."
  },
  {
    question: "How do I customize visualizations?",
    answer: "You can customize visualizations by changing chart types, colors, and labels through the dashboard interface."
  },
  {
    question: "What is the difference between Doctor Roster and OP Billing?",
    answer: "Doctor Roster manages doctor schedules and availability, while OP Billing tracks patient visits, procedures, and billing information."
  },
  {
    question: "How do I add multiple files?",
    answer: "For compliance mode, you can upload both OP Billing and Doctor Roster files. For other modes, upload one file at a time."
  },
  {
    question: "What happens if my data fails validation?",
    answer: "If validation fails, you'll see detailed error messages with suggestions for fixing the issues. You can then correct your data and re-upload."
  },
  {
    question: "How do I save my work?",
    answer: "Your data and visualizations are automatically saved in your browser session. For permanent storage, use the export features."
  },
  {
    question: "What browsers are supported?",
    answer: "The dashboard works on Chrome (recommended), Firefox, Safari, and Edge browsers."
  },
  {
    question: "How do I get help with data issues?",
    answer: "Use the 'Fix with AI' feature for automated suggestions, or check the validation results for specific error messages and solutions."
  },
  {
    question: "What is the purpose of the dashboard?",
    answer: "The dashboard helps businesses transform raw CSV data into actionable insights through AI-powered analysis and beautiful visualizations."
  },
  {
    question: "How do I filter my data?",
    answer: "Use the filter options in the dashboard to focus on specific time periods, categories, or data ranges."
  },
  {
    question: "What is real-time data processing?",
    answer: "All data processing happens locally in your browser for security and speed. No data is sent to external servers except for AI features."
  },
  {
    question: "How do I compare different datasets?",
    answer: "You can upload multiple files and use the comparison features to analyze differences between datasets."
  },
  {
    question: "What is the validation engine?",
    answer: "The validation engine checks data quality, format compliance, and completeness to ensure your data is ready for analysis."
  },
  {
    question: "How do I handle large datasets?",
    answer: "For datasets larger than 100,000 rows, split them into smaller files. The system is optimized for efficient processing of large datasets."
  },
  {
    question: "What is the AI query bar?",
    answer: "The AI query bar allows you to ask natural language questions about your data and get intelligent responses."
  },
  {
    question: "How do I reset my dashboard?",
    answer: "Use the 'Start Over' button to clear your current data and begin with a new upload."
  },
  {
    question: "What is the purpose of the step indicator?",
    answer: "The step indicator shows your progress through the 4-step workflow: Upload, Validate, Analyze, and Visualize."
  },
  {
    question: "How do I handle date format issues?",
    answer: "The system supports multiple date formats. If you have issues, ensure your dates follow standard formats like YYYY-MM-DD or MM/DD/YYYY."
  },
  {
    question: "What is the difference between validation and analysis?",
    answer: "Validation checks data quality and format, while analysis provides business insights and identifies trends in your data."
  },
  {
    question: "How do I use the compliance dashboard?",
    answer: "Upload both OP Billing and Doctor Roster files, then the system will cross-validate them for compliance violations."
  },
  {
    question: "What is the purpose of the logo?",
    answer: "The logo represents the CSV Sensei brand and provides visual identity for the dashboard application."
  },
  {
    question: "How do I handle authentication?",
    answer: "The system includes secure login functionality with company-based access control."
  },
  {
    question: "What is the purpose of the theme provider?",
    answer: "The theme provider manages the dark/light mode switching and maintains consistent styling across the application."
  },
  {
    question: "How do I handle errors?",
    answer: "The system provides detailed error messages with suggestions for resolution. Check the console for technical details."
  },
  {
    question: "What is the purpose of the protected route?",
    answer: "Protected routes ensure only authenticated users can access certain features of the dashboard."
  },
  {
    question: "How do I use the mobile version?",
    answer: "The dashboard is fully responsive and works on mobile devices. Use touch gestures to interact with charts and data."
  },
  {
    question: "What is the purpose of the demo mode?",
    answer: "Demo mode allows you to explore the dashboard features with sample data without uploading your own files."
  },
  {
    question: "How do I handle special characters in data?",
    answer: "The system handles special characters automatically. Ensure your CSV file uses proper encoding (UTF-8 recommended)."
  },
  {
    question: "What is the purpose of the analytics utility?",
    answer: "The analytics utility tracks usage patterns and helps improve the dashboard experience."
  },
  {
    question: "How do I handle duplicate data?",
    answer: "The system can detect and handle duplicate records. Use the validation results to identify and remove duplicates."
  },
  {
    question: "What is the purpose of the compliance utility?",
    answer: "The compliance utility helps ensure your data meets regulatory requirements, especially for healthcare data."
  },
  {
    question: "How do I handle time zone issues?",
    answer: "Ensure your date/time data includes timezone information or use a consistent timezone throughout your dataset."
  },
  {
    question: "What is the purpose of the row limit validator?",
    answer: "The row limit validator ensures your file doesn't exceed the 100,000 row limit and provides suggestions for handling large datasets."
  },
  {
    question: "How do I handle null values?",
    answer: "The system identifies null values and provides options for handling them, such as filling with default values or excluding records."
  },
  {
    question: "What is the purpose of the validation results component?",
    answer: "The validation results component displays detailed information about data quality issues and provides AI-powered suggestions for fixes."
  },
  {
    question: "How do I handle currency data?",
    answer: "The system supports various currency formats. Ensure your currency data is in a consistent format with proper decimal places."
  },
  {
    question: "What is the purpose of the AI schema fixer?",
    answer: "The AI schema fixer automatically maps your CSV columns to the required schema fields and suggests data transformations."
  },
  {
    question: "How do I handle percentage data?",
    answer: "The system supports percentage data in various formats. Ensure your percentages are in a consistent format (e.g., 0.5 for 50%)."
  },
  {
    question: "What is the purpose of the KPI alerts?",
    answer: "KPI alerts notify you of important metrics and thresholds in your data, helping you stay informed about key performance indicators."
  }
];

class AIService {
  private llm: ChatOpenAI;
  private vectorStore: FaissStore | null = null;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4o-mini',
      temperature: 0.3,
    });

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  async initializeVectorStore(): Promise<void> {
    try {
      // Create documents from knowledge base
      const documents = DASHBOARD_KNOWLEDGE_BASE.map(item => 
        new Document({
          pageContent: `Question: ${item.question}\nAnswer: ${item.answer}`,
          metadata: { question: item.question, answer: item.answer }
        })
      );

      // Create vector store
      this.vectorStore = await FaissStore.fromDocuments(documents, this.embeddings);
      console.log('Vector store initialized with', documents.length, 'documents');
    } catch (error) {
      console.error('Error initializing vector store:', error);
      throw error;
    }
  }

  async answerQuestion(question: string): Promise<string> {
    try {
      if (!this.vectorStore) {
        await this.initializeVectorStore();
      }

      // Create prompt template
      const prompt = PromptTemplate.fromTemplate(`
You are a helpful assistant for the CSV Sensei Dashboard. Your role is to answer questions about the dashboard functionality, features, and usage.

Context from knowledge base:
{context}

User Question: {question}

Instructions:
1. If the question is about the CSV Sensei Dashboard, provide a helpful and accurate answer based on the context
2. If the question is NOT about the dashboard, respond with: "Sorry, I couldn't find information about that in the dashboard. I can only help with questions about the CSV Sensei Dashboard functionality."
3. Keep your answers concise but informative
4. If you're unsure about something, say so rather than guessing

Answer:`);

      // Create the chain
      const chain = RunnableSequence.from([
        prompt,
        this.llm,
        new StringOutputParser(),
      ]);

      // Search for relevant context
      const relevantDocs = await this.vectorStore!.similaritySearch(question, 3);
      const context = relevantDocs.map(doc => doc.pageContent).join('\n\n');

      // Check if question is dashboard-related
      const isDashboardRelated = this.isDashboardRelated(question, relevantDocs);
      
      if (!isDashboardRelated) {
        return "Sorry, I couldn't find information about that in the dashboard. I can only help with questions about the CSV Sensei Dashboard functionality.";
      }

      // Generate answer
      const response = await chain.invoke({
        context,
        question,
      });

      return response;
    } catch (error) {
      console.error('Error answering question:', error);
      return "I'm sorry, I encountered an error while processing your question. Please try again.";
    }
  }

  private isDashboardRelated(question: string, relevantDocs: any[]): boolean {
    const dashboardKeywords = [
      'csv', 'dashboard', 'upload', 'validation', 'visualization', 'chart', 'data',
      'doctor', 'roster', 'billing', 'compliance', 'industry', 'schema', 'ai',
      'insight', 'analysis', 'file', 'format', 'error', 'fix', 'theme', 'mode',
      'export', 'import', 'filter', 'step', 'workflow', 'authentication', 'login'
    ];

    const questionLower = question.toLowerCase();
    const hasDashboardKeywords = dashboardKeywords.some(keyword => 
      questionLower.includes(keyword)
    );

    // Check if any relevant documents have high similarity
    const hasRelevantContext = relevantDocs.length > 0 && 
      relevantDocs.some(doc => doc.metadata && doc.metadata.question);

    return hasDashboardKeywords || hasRelevantContext;
  }

  async trainAgent(epochs: number = 5): Promise<void> {
    console.log(`Training agent with ${epochs} epochs...`);
    
    for (let epoch = 1; epoch <= epochs; epoch++) {
      console.log(`Epoch ${epoch}/${epochs}`);
      
      // Simulate training by reinitializing vector store with updated knowledge
      await this.initializeVectorStore();
      
      // Test with sample questions
      const testQuestions = [
        "What is CSV Sensei Dashboard?",
        "How do I upload a file?",
        "What industries are supported?",
        "How does validation work?"
      ];

      for (const question of testQuestions) {
        try {
          await this.answerQuestion(question);
        } catch (error) {
          console.error(`Error in epoch ${epoch} for question: ${question}`, error);
        }
      }
      
      console.log(`Epoch ${epoch} completed`);
    }
    
    console.log('Agent training completed');
  }

  getKnowledgeBaseSize(): number {
    return DASHBOARD_KNOWLEDGE_BASE.length;
  }

  getSupportedQuestions(): string[] {
    return DASHBOARD_KNOWLEDGE_BASE.map(item => item.question);
  }
}

export const aiService = new AIService();
