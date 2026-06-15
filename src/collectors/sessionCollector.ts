/**
 * Session Collector - Collects session-related data
 */

export interface SessionMessage {
  role: string;
  content?: string;
}

export interface SessionContext {
  messages: SessionMessage[];
  workDirectory: string;
  startTime?: Date;
}

export interface SessionData {
  timestamp: string;
  workDirectory: string;
  startTime: string;
  endTime: string;
  conversationHistory: SessionMessage[];
}

/**
 * SessionCollector collects session context and conversation history
 */
export class SessionCollector {
  /**
   * Extract conversation from messages, filtering for assistant messages with substantial content
   */
  extractConversation(messages: SessionMessage[]): SessionMessage[] {
    if (!Array.isArray(messages)) {
      return [];
    }

    return messages.filter((msg) => {
      // Only include assistant messages
      if (msg.role !== 'assistant') {
        return false;
      }

      // Must have content field with substantial content (> 50 characters)
      const content = msg.content || '';
      return content.length > 50;
    });
  }

  /**
   * Collect session data from context
   */
  collect(context: SessionContext): SessionData {
    const timestamp = new Date().toISOString();
    const endTime = timestamp;

    // Format startTime or use 'unknown'
    const startTime = context.startTime
      ? context.startTime.toISOString()
      : 'unknown';

    // Extract conversation history
    const conversationHistory = this.extractConversation(context.messages || []);

    return {
      timestamp,
      workDirectory: context.workDirectory || '',
      startTime,
      endTime,
      conversationHistory,
    };
  }
}
