import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  User, 
  Loader2,
  Minimize2,
  Maximize2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatbotAPI, ChatMessage, ChatRequest } from '@/lib/chatbotApi';


interface ChatbotProps {
  context?: {
    industry?: string;
    dataType?: string;
    currentDashboard?: string;
  };
  className?: string;
}


export const Chatbot: React.FC<ChatbotProps> = ({ context, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

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
      const chatRequest: ChatRequest = {
        message: userMessage.content,
        conversationId,
        context,
      };

      const data = await chatbotAPI.sendMessage(chatRequest);
      
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(data.timestamp),
        metadata: data.metadata,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationId(data.conversationId);

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

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50',
          'bg-blue-600 hover:bg-blue-700 text-white',
          className
        )}
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      'fixed bottom-6 right-6 w-96 shadow-2xl z-50 transition-all duration-300',
      isMinimized ? 'h-16' : 'h-[600px]',
      className
    )}>
      <CardHeader className={cn(
        'pb-3 border-b',
        isMinimized ? 'py-3' : 'py-4'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Assistant</CardTitle>
              {!isMinimized && (
                <p className="text-xs text-gray-500">CSV Sensei Helper</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {!isMinimized && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConversation}
                className="h-8 w-8 p-0"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <Bot className="w-12 h-12 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Welcome to AI Assistant!</h3>
                  <p className="text-sm mb-4">
                    I'm here to help you analyze your data and answer questions about your dashboard.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="secondary" className="text-xs">
                      Data Analysis
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Insights
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Help
                    </Badge>
                  </div>
                </div>
              ) : (
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
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4">
              {error && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your data..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                  className="shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
};
