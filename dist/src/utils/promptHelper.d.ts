/**
 * Helper functions for inquirer prompts
 * Provides reusable prompt configurations for user interaction
 */
import { SessionArchiverConfig } from '../types/config';
/**
 * Answers collected from user prompts
 */
export interface ProjectConfigAnswers {
    projectName: string;
    vaultPath: string;
    attachmentFolder: string;
    dateFormat: string;
    aiModel: string;
    maxTokens: number;
    temperature: number;
    enableDaemon: boolean;
    checkInterval: number;
    idleTimeout: number;
    sessionNoteTemplate: string;
    summaryTemplate: string;
    tagsTemplate: string;
}
/**
 * Prompt user for project configuration
 * Collects all necessary information through interactive prompts
 */
export declare function promptForProjectConfig(): Promise<ProjectConfigAnswers>;
/**
 * Build SessionArchiverConfig from prompt answers
 * Converts user input into the proper configuration structure
 */
export declare function buildConfigFromAnswers(answers: ProjectConfigAnswers): SessionArchiverConfig;
//# sourceMappingURL=promptHelper.d.ts.map