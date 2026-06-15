"use strict";
/**
 * Session Collector - Collects session-related data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionCollector = void 0;
/**
 * SessionCollector collects session context and conversation history
 */
class SessionCollector {
    /**
     * Extract conversation from messages, filtering for assistant messages with substantial content
     */
    extractConversation(messages) {
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
    collect(context) {
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
exports.SessionCollector = SessionCollector;
//# sourceMappingURL=sessionCollector.js.map