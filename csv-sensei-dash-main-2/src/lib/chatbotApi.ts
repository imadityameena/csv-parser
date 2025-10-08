export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
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

export interface ChatError {
  error: string;
  code: string;
  details?: any;
}

const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_API_URL || '/chatbot-api/chat';

class ChatbotAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${CHATBOT_API_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/message', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getConversation(conversationId: string): Promise<{
    id: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
    context?: any;
  }> {
    return this.request(`/conversation/${conversationId}`);
  }

  async getConversations(): Promise<Array<{
    id: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
    context?: any;
  }>> {
    return this.request('/conversations');
  }

  async deleteConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/conversation/${conversationId}`, {
      method: 'DELETE',
    });
  }

  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    services: {
      openai: string;
      conversation: string;
    };
  }> {
    return this.request('/health');
  }
}

export const chatbotAPI = new ChatbotAPI();
