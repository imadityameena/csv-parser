import { Request, Response } from 'express';
import { OpenAIService } from '../services/openaiService';
import { ConversationService } from '../services/conversationService';
import { ChatRequest, ChatResponse, ChatError, ChatMessage } from '../types/chat';

export class ChatController {
  private openaiService: OpenAIService;
  private conversationService: ConversationService;

  constructor() {
    this.openaiService = new OpenAIService();
    this.conversationService = new ConversationService();
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, conversationId, context } = req.body as ChatRequest;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({
          error: 'Message is required and must be a non-empty string',
          code: 'INVALID_MESSAGE'
        } as ChatError);
        return;
      }

      // Get or create conversation
      let conversation = conversationId 
        ? this.conversationService.getConversation(conversationId)
        : null;

      if (!conversation) {
        conversation = this.conversationService.createConversation(context);
      } else if (context) {
        // Update context if provided
        this.conversationService.updateConversationContext(conversation.id, context);
      }

      // Add user message to conversation
      const userMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'user',
        content: message.trim(),
        timestamp: new Date(),
      };

      this.conversationService.addMessage(conversation.id, userMessage);

      // Get conversation history for context
      const history = this.conversationService.getConversationHistory(conversation.id);

      // Generate AI response
      const chatRequest: ChatRequest = {
        message: message.trim(),
        conversationId: conversation.id,
        context,
      };

      const response = await this.openaiService.generateResponse(chatRequest, history);

      // Add AI response to conversation
      const aiMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp,
        metadata: response.metadata,
      };

      this.conversationService.addMessage(conversation.id, aiMessage);

      // Return response
      res.json(response);

    } catch (error) {
      console.error('Chat controller error:', error);
      
      const errorResponse: ChatError = {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'CHAT_ERROR',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      };

      res.status(500).json(errorResponse);
    }
  }

  async getConversation(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({
          error: 'Conversation ID is required',
          code: 'MISSING_CONVERSATION_ID'
        } as ChatError);
        return;
      }

      const conversation = this.conversationService.getConversation(conversationId);

      if (!conversation) {
        res.status(404).json({
          error: 'Conversation not found',
          code: 'CONVERSATION_NOT_FOUND'
        } as ChatError);
        return;
      }

      res.json(conversation);

    } catch (error) {
      console.error('Get conversation error:', error);
      
      const errorResponse: ChatError = {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'GET_CONVERSATION_ERROR',
      };

      res.status(500).json(errorResponse);
    }
  }

  async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const conversations = this.conversationService.getAllConversations();
      res.json(conversations);

    } catch (error) {
      console.error('Get conversations error:', error);
      
      const errorResponse: ChatError = {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'GET_CONVERSATIONS_ERROR',
      };

      res.status(500).json(errorResponse);
    }
  }

  async deleteConversation(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({
          error: 'Conversation ID is required',
          code: 'MISSING_CONVERSATION_ID'
        } as ChatError);
        return;
      }

      const deleted = this.conversationService.deleteConversation(conversationId);

      if (!deleted) {
        res.status(404).json({
          error: 'Conversation not found',
          code: 'CONVERSATION_NOT_FOUND'
        } as ChatError);
        return;
      }

      res.json({ success: true, message: 'Conversation deleted successfully' });

    } catch (error) {
      console.error('Delete conversation error:', error);
      
      const errorResponse: ChatError = {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'DELETE_CONVERSATION_ERROR',
      };

      res.status(500).json(errorResponse);
    }
  }

  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const isHealthy = await this.openaiService.healthCheck();
      
      if (isHealthy) {
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            openai: 'connected',
            conversation: 'active'
          }
        });
      } else {
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          services: {
            openai: 'disconnected',
            conversation: 'active'
          }
        });
      }

    } catch (error) {
      console.error('Health check error:', error);
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
