import { Conversation, ChatMessage } from '../types/chat';

export class ConversationService {
  private conversations: Map<string, Conversation> = new Map();

  createConversation(context?: Conversation['context']): Conversation {
    const conversation: Conversation = {
      id: this.generateConversationId(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      context,
    };

    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  addMessage(conversationId: string, message: ChatMessage): boolean {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return false;
    }

    conversation.messages.push(message);
    conversation.updatedAt = new Date();
    
    // Keep only last 50 messages to prevent memory issues
    if (conversation.messages.length > 50) {
      conversation.messages = conversation.messages.slice(-50);
    }

    return true;
  }

  getConversationHistory(conversationId: string, limit: number = 20): ChatMessage[] {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return [];
    }

    return conversation.messages.slice(-limit);
  }

  updateConversationContext(conversationId: string, context: Conversation['context']): boolean {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return false;
    }

    conversation.context = { ...conversation.context, ...context };
    conversation.updatedAt = new Date();
    return true;
  }

  deleteConversation(conversationId: string): boolean {
    return this.conversations.delete(conversationId);
  }

  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  cleanupOldConversations(maxAge: number = 24 * 60 * 60 * 1000): number {
    const cutoff = new Date(Date.now() - maxAge);
    let deletedCount = 0;

    for (const [id, conversation] of this.conversations.entries()) {
      if (conversation.updatedAt < cutoff) {
        this.conversations.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
