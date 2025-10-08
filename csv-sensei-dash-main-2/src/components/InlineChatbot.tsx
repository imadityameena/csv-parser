import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Send, 
  Bot, 
  User, 
  Loader2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatbotAPI, ChatMessage, ChatRequest } from '@/lib/chatbotApi';
import { DataAnalysisService } from '@/lib/dataAnalysisService';

interface InlineChatbotProps {
  context?: {
    industry?: string;
    dataType?: string;
    currentDashboard?: string;
  };
  placeholder?: string;
  className?: string;
  data?: any[];
  additionalData?: any[];
}

export const InlineChatbot: React.FC<InlineChatbotProps> = ({ 
  context, 
  placeholder,
  className,
  data = [],
  additionalData = []
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-expand when there are messages
  useEffect(() => {
    if (messages.length > 0) {
      setIsExpanded(true);
    }
  }, [messages.length]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    // Check if we have data to analyze
    if (!data || data.length === 0) {
      setError('No data available. Please upload a CSV file first.');
      return;
    }

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Debug: Log the data being analyzed
      console.log('🔍 Chatbot Data Analysis Debug:');
      console.log('Main data:', data?.length, 'records');
      console.log('Additional data:', additionalData?.length, 'records');
      console.log('Context:', context);
      console.log('Sample data record:', data?.[0]);
      console.log('Full data array:', data);

      // Generate data analysis
      const insights = DataAnalysisService.analyzeData(data, additionalData, context);
      const dataSummary = DataAnalysisService.generateDataSummary(data, context);
      const dataFields = data.length > 0 ? Object.keys(data[0]) : [];

      console.log('📊 Generated insights:', insights);
      console.log('📝 Data summary:', dataSummary);

      const chatRequest: ChatRequest = {
        message: userMessage.content,
        conversationId,
        context,
        dataAnalysis: {
          summary: dataSummary,
          insights: insights.insights,
          dataFields: dataFields,
          recordCount: data.length,
          dataTypes: insights.dataTypes,
          sampleData: insights.sampleData,
          statistics: insights.statistics
        }
      };

      const response = await chatbotAPI.sendMessage(chatRequest);
      
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(response.timestamp),
        metadata: response.metadata,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationId(response.conversationId);

    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setIsExpanded(false);
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const isError = message.id.startsWith('error_');

    return (
      <div
        key={message.id}
        className={cn(
          'flex gap-3 p-3 rounded-lg',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        {!isUser && (
          <div className="flex-shrink-0">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              isError ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            )}>
              {isError ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
          </div>
        )}
        
        <div className={cn(
          'max-w-[80%] rounded-lg px-4 py-2',
          isUser 
            ? 'bg-blue-600 text-white' 
            : isError 
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-gray-100 text-gray-800'
        )}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <div className={cn(
            'text-xs mt-1 opacity-70',
            isUser ? 'text-blue-100' : 'text-gray-500'
          )}>
            {formatTime(message.timestamp)}
            {message.metadata?.processingTime && (
              <span className="ml-2">
                ({message.metadata.processingTime}ms)
              </span>
            )}
          </div>
        </div>

        {isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
    );
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    
    // Check if we have data
    const hasData = data && data.length > 0;
    
    if (!hasData) {
      return 'Upload data to start asking questions about your CSV files';
    }
    
    switch (context?.currentDashboard) {
      case 'billing':
        return 'Ask billing questions (e.g., "total revenue last month")';
      case 'compliance':
        return 'Ask compliance questions (e.g., "any violations this quarter?")';
      case 'doctor-roster':
        return 'Ask about staff (e.g., "how many doctors are available?")';
      default:
        return 'Ask questions about your data (e.g., "what are the key insights?")';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Main Input Section */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={getPlaceholder()}
              disabled={isLoading || !data || data.length === 0}
              className="pl-10 pr-4 py-3 text-base rounded-xl border-2 focus:border-blue-500"
            />
          </div>
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading || !data || data.length === 0}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Ask
              </>
            )}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Data Status */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {data && data.length > 0 ? (
              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                📊 {data.length} records loaded
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                ⚠️ No data available
              </Badge>
            )}
            {additionalData && additionalData.length > 0 && (
              <Badge variant="outline" className="text-xs">
                +{additionalData.length} additional records
              </Badge>
            )}
          </div>
        </div>

        {/* Conversation Status */}
        {messages.length > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {messages.length} messages
              </Badge>
              {conversationId && (
                <Badge variant="outline" className="text-xs">
                  Session active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConversation}
                className="h-8 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Conversation */}
      {isExpanded && messages.length > 0 && (
        <Card className="mt-4 border-2">
          <CardContent className="p-0">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-gray-900">AI Assistant</h3>
                <Badge variant="secondary" className="text-xs">
                  {context?.currentDashboard || 'General'} Dashboard
                </Badge>
              </div>
            </div>
            
            <ScrollArea className="h-96 p-4">
              <div className="space-y-2">
                {messages.map(renderMessage)}
                {isLoading && (
                  <div className="flex gap-3 p-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
