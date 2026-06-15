import { AISummaryRequest, AISummary, ModelSelection } from './types';
/**
 * Anthropic AI client for generating session summaries
 */
export declare class AnthropicClient {
    private client;
    /**
     * Create a new Anthropic client
     * @param apiKey - Anthropic API key
     */
    constructor(apiKey: string);
    /**
     * Generate a structured summary from session data
     * @param request - Session data to summarize
     * @param modelSelection - Model selection parameters
     * @returns Structured summary in Chinese
     */
    generateSummary(request: AISummaryRequest, modelSelection: ModelSelection): Promise<AISummary>;
    /**
     * Build Chinese prompt for AI summary generation
     * @param request - Session data
     * @returns Formatted prompt string
     */
    private buildPrompt;
    /**
     * Format conversation history for prompt
     * @param messages - Array of AI messages
     * @returns Formatted conversation string
     */
    private formatConversation;
    /**
     * Format file changes for prompt
     * @param changes - Array of file changes
     * @returns Formatted file changes string
     */
    private formatFileChanges;
    /**
     * Parse AI response into structured summary
     * @param responseText - Raw response text from AI
     * @returns Parsed summary object
     */
    private parseResponse;
}
//# sourceMappingURL=anthropicClient.d.ts.map