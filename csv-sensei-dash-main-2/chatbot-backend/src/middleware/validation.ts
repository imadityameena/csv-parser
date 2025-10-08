import { Request, Response, NextFunction } from 'express';
import { CustomError } from './errorHandler';

export const validateChatMessage = (req: Request, res: Response, next: NextFunction): void => {
  const { message, conversationId, context } = req.body;

  // Validate message
  if (!message) {
    throw new CustomError('Message is required', 400, 'MISSING_MESSAGE');
  }

  if (typeof message !== 'string') {
    throw new CustomError('Message must be a string', 400, 'INVALID_MESSAGE_TYPE');
  }

  if (message.trim().length === 0) {
    throw new CustomError('Message cannot be empty', 400, 'EMPTY_MESSAGE');
  }

  if (message.length > 2000) {
    throw new CustomError('Message is too long (max 2000 characters)', 400, 'MESSAGE_TOO_LONG');
  }

  // Validate conversationId if provided
  if (conversationId && typeof conversationId !== 'string') {
    throw new CustomError('Conversation ID must be a string', 400, 'INVALID_CONVERSATION_ID_TYPE');
  }

  // Validate context if provided
  if (context && typeof context !== 'object') {
    throw new CustomError('Context must be an object', 400, 'INVALID_CONTEXT_TYPE');
  }

  if (context) {
    const { industry, dataType, currentDashboard } = context;
    
    if (industry && typeof industry !== 'string') {
      throw new CustomError('Industry must be a string', 400, 'INVALID_INDUSTRY_TYPE');
    }
    
    if (dataType && typeof dataType !== 'string') {
      throw new CustomError('Data type must be a string', 400, 'INVALID_DATA_TYPE');
    }
    
    if (currentDashboard && typeof currentDashboard !== 'string') {
      throw new CustomError('Current dashboard must be a string', 400, 'INVALID_DASHBOARD_TYPE');
    }
  }

  next();
};

export const validateConversationId = (req: Request, res: Response, next: NextFunction): void => {
  const { conversationId } = req.params;

  if (!conversationId) {
    throw new CustomError('Conversation ID is required', 400, 'MISSING_CONVERSATION_ID');
  }

  if (typeof conversationId !== 'string') {
    throw new CustomError('Conversation ID must be a string', 400, 'INVALID_CONVERSATION_ID_TYPE');
  }

  // Basic format validation for conversation ID
  if (!conversationId.startsWith('conv_') || conversationId.length < 20) {
    throw new CustomError('Invalid conversation ID format', 400, 'INVALID_CONVERSATION_ID_FORMAT');
  }

  next();
};
