export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
    processingTime?: number;
  };
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: {
    industry?: string;
    dataType?: string;
    currentDashboard?: string;
  };
  dataAnalysis?: {
    summary: string;
    insights: string[];
    dataFields: string[];
    recordCount: number;
    dataTypes: Record<string, string>;
    sampleData: any[];
    statistics: Record<string, any>;
  };
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  timestamp: Date;
  metadata: {
    tokens: number;
    model: string;
    processingTime: number;
  };
}

export interface Conversation {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  context?: {
    industry?: string;
    dataType?: string;
    currentDashboard?: string;
  };
}

export interface ChatError {
  error: string;
  code: string;
  details?: any;
}
