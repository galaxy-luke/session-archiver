/**
 * Session Summary Generator
 * Orchestrates data collection and AI generation to create session drafts
 */
import { SessionCollector } from '../collectors/sessionCollector';
import { FileCollector } from '../collectors/fileCollector';
import { GitCollector } from '../collectors/gitCollector';
import { AnthropicClient } from '../ai/anthropicClient';
import { AISummary } from '../ai/types';
/**
 * Generator context with session metadata
 */
export interface GeneratorContext {
    sessionId: string;
    projectPath: string;
    startTime: Date;
    endTime: Date;
    model: string;
}
/**
 * Generator result
 */
export interface GeneratorResult {
    summary: AISummary;
    draftPath: string;
    context: GeneratorContext;
}
/**
 * Session summary generator
 * Orchestrates collection, AI generation, and template rendering
 */
export declare class Generator {
    private sessionCollector;
    private fileCollector;
    private gitCollector;
    private aiClient;
    private vaultPath;
    private templatePath;
    private git;
    constructor(sessionCollector: SessionCollector, fileCollector: FileCollector, gitCollector: GitCollector, aiClient: AnthropicClient, vaultPath: string, templatePath: string);
    /**
     * Generate a complete session draft
     * @param context - Generator context
     * @returns Generator result with summary and draft path
     */
    generate(context: GeneratorContext): Promise<GeneratorResult>;
    /**
     * Render template with summary data
     * @param summary - AI-generated summary
     * @param context - Generator context
     * @param fileChanges - File changes data
     * @param gitData - Git data
     * @param aiFileChanges - AI-formatted file changes
     * @returns Rendered template content
     */
    private renderDraft;
    /**
     * Calculate duration between two dates in "Xh Ym" format
     * @param startTime - Start time
     * @param endTime - End time
     * @returns Formatted duration string
     */
    private calculateDuration;
    /**
     * Generate draft filename from context
     * @param context - Generator context
     * @returns Draft filename
     */
    private generateDraftFileName;
}
//# sourceMappingURL=generator.d.ts.map