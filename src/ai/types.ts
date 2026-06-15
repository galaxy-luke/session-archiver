/**
 * AI-related type definitions for session archiver
 */

/**
 * AI message in a conversation
 */
export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * File change information
 */
export interface FileChange {
  path: string;
  changeType: 'created' | 'modified' | 'deleted';
  summary?: string;
}

/**
 * Request for AI-generated session summary
 */
export interface AISummaryRequest {
  conversationHistory: AIMessage[];
  fileChanges: FileChange[];
  gitStatus: string;
  gitCommits: string[];
  workDirectory: string;
  startTime: Date;
  endTime: Date;
}

/**
 * AI-generated session summary with Chinese keys
 */
export interface AISummary {
  摘要: string;
  主要工作項目: string[];
  技術決策與理由: string;
  關鍵程式碼片段: string[];
  問題與解決方案: Array<{
    問題: string;
    解決方案: string;
  }>;
  下次行動: string;
  元數據: {
    model: string;
    complexity: number;
    tokensUsed: number;
    cost: number;
  };
}

/**
 * Model selection for AI request
 */
export interface ModelSelection {
  model: string;
  complexity: number;
}
