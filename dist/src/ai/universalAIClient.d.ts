import { AISummaryRequest, AISummary, ModelSelection, AIProvider } from './types';
/**
 * Universal AI client supporting multiple providers (OpenAI-compatible and Anthropic)
 */
export declare class UniversalAIClient {
    private openaiClient?;
    private anthropicClient?;
    private provider;
    private apiKey;
    private baseURL?;
    constructor(config: {
        provider: AIProvider;
        apiKey: string;
        baseURL?: string;
    });
    /**
     * Generate a structured summary from session data
     */
    generateSummary(request: AISummaryRequest, modelSelection: ModelSelection): Promise<AISummary>;
    /**
     * Generate summary using OpenAI-compatible API
     */
    private generateWithOpenAI;
    /**
     * Generate summary using Anthropic API
     */
    private generateWithAnthropic;
    /**
     * Build Chinese prompt for AI summary generation
     */
    private buildPrompt;
    /**
     * Format conversation history for prompt
     */
    private formatConversation;
    /**
     * Format file changes for prompt
     */
    private formatFileChanges;
    /**
     * Parse AI response into structured summary
     */
    private parseResponse;
}
//# sourceMappingURL=universalAIClient.d.ts.map