/**
 * Session Archiver
 * Handles moving draft files from drafts folder to appropriate archive locations
 */
import { ConfigManager } from '../utils/configManager';
/**
 * Result of archiving operation
 */
export interface ArchiveResult {
    targetPath: string;
    originalPath: string;
}
/**
 * Archiver class for moving session drafts to archive locations
 */
export declare class Archiver {
    private configManager;
    constructor(configManager: ConfigManager);
    /**
     * Archive a draft file to its appropriate location
     * @param draftPath - Path to the draft file
     * @returns Archive result with target and original paths
     */
    archive(draftPath: string): Promise<ArchiveResult>;
    /**
     * Read and parse draft file content
     * @param draftPath - Path to draft file
     * @returns Parsed draft content with frontmatter
     */
    private readDraftFile;
    /**
     * Parse YAML frontmatter from markdown content
     * @param content - Markdown file content
     * @returns Parsed frontmatter and remaining content
     */
    private parseFrontmatter;
    /**
     * Simple YAML parser for frontmatter
     * @param yamlText - YAML text to parse
     * @returns Parsed object
     */
    private parseYaml;
    /**
     * Parse a single YAML value
     * @param valueStr - String value to parse
     * @returns Parsed value
     */
    private parseYamlValue;
    /**
     * Determine target archive path based on frontmatter
     * @param draftPath - Original draft path
     * @param frontmatter - Parsed frontmatter
     * @returns Target archive path
     */
    private determineTargetPath;
    /**
     * Extract project name from project path
     * @param projectPath - Full project path
     * @returns Simplified project name
     */
    private extractProjectName;
    /**
     * Ensure target directory exists
     * @param targetPath - Path to target file
     */
    private ensureDirectoryExists;
    /**
     * Update status in frontmatter
     * @param draft - Draft content
     * @param newStatus - New status value
     * @returns Updated markdown content
     */
    private updateStatus;
    /**
     * Convert frontmatter object to YAML string
     * @param frontmatter - Frontmatter object
     * @returns YAML string
     */
    private stringifyFrontmatter;
    /**
     * Stringify a single YAML field
     * @param key - Field key
     * @param value - Field value
     * @returns YAML field string
     */
    private stringifyYamlField;
}
//# sourceMappingURL=archiver.d.ts.map