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
export declare class SessionCollector {
    /**
     * Extract conversation from messages, filtering for assistant messages with substantial content
     */
    extractConversation(messages: SessionMessage[]): SessionMessage[];
    /**
     * Collect session data from context
     */
    collect(context: SessionContext): SessionData;
}
//# sourceMappingURL=sessionCollector.d.ts.map