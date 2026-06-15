/**
 * Session Archiver
 * Handles moving draft files from drafts folder to appropriate archive locations
 */

import { ConfigManager } from '../utils/configManager';
import { promises as fs } from 'fs';
import * as path from 'path';
import { format } from 'date-fns';

/**
 * Result of archiving operation
 */
export interface ArchiveResult {
  targetPath: string;
  originalPath: string;
}

/**
 * Parsed frontmatter from draft file
 */
interface DraftFrontmatter {
  type?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
  generatedBy?: string;
  model?: string;
  complexity?: number;
  status?: string;
  tags?: string[];
  project?: string;
  summary?: string;
  [key: string]: any;
}

/**
 * Draft file content with frontmatter
 */
interface DraftContent {
  frontmatter: DraftFrontmatter;
  content: string;
}

/**
 * Archiver class for moving session drafts to archive locations
 */
export class Archiver {
  constructor(private configManager: ConfigManager) {}

  /**
   * Archive a draft file to its appropriate location
   * @param draftPath - Path to the draft file
   * @returns Archive result with target and original paths
   */
  async archive(draftPath: string): Promise<ArchiveResult> {
    try {
      // Step 1: Read draft file content
      const draft = await this.readDraftFile(draftPath);

      // Step 2: Determine target path based on frontmatter
      const targetPath = this.determineTargetPath(draftPath, draft.frontmatter);

      // Step 3: Create target directory if needed
      await this.ensureDirectoryExists(targetPath);

      // Step 4: Update status to archived
      const updatedContent = this.updateStatus(draft, 'archived');

      // Step 5: Write to temporary location first
      const tempPath = `${targetPath}.tmp`;
      await fs.writeFile(tempPath, updatedContent, 'utf-8');

      // Step 6: Move file from drafts to archive location
      await fs.rename(tempPath, targetPath);

      // Step 7: Optionally remove original draft file
      // (Commented out - keeping original as backup)
      // await fs.unlink(draftPath);

      return {
        targetPath,
        originalPath: draftPath
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to archive draft: ${error.message}`);
      }
      throw new Error('Failed to archive draft: Unknown error');
    }
  }

  /**
   * Read and parse draft file content
   * @param draftPath - Path to draft file
   * @returns Parsed draft content with frontmatter
   */
  private async readDraftFile(draftPath: string): Promise<DraftContent> {
    const content = await fs.readFile(draftPath, 'utf-8');
    return this.parseFrontmatter(content);
  }

  /**
   * Parse YAML frontmatter from markdown content
   * @param content - Markdown file content
   * @returns Parsed frontmatter and remaining content
   */
  private parseFrontmatter(content: string): DraftContent {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      throw new Error('Invalid draft format: no frontmatter found');
    }

    const frontmatterText = match[1];
    const bodyContent = match[2];

    try {
      const frontmatter: DraftFrontmatter = this.parseYaml(frontmatterText);
      return {
        frontmatter,
        content: bodyContent
      };
    } catch (error) {
      throw new Error('Invalid YAML frontmatter');
    }
  }

  /**
   * Simple YAML parser for frontmatter
   * @param yamlText - YAML text to parse
   * @returns Parsed object
   */
  private parseYaml(yamlText: string): DraftFrontmatter {
    const result: DraftFrontmatter = {};
    const lines = yamlText.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;

      const key = trimmed.substring(0, colonIndex).trim();
      const valueStr = trimmed.substring(colonIndex + 1).trim();

      // Handle different value types
      result[key] = this.parseYamlValue(valueStr);
    }

    return result;
  }

  /**
   * Parse a single YAML value
   * @param valueStr - String value to parse
   * @returns Parsed value
   */
  private parseYamlValue(valueStr: string): any {
    // Empty string
    if (!valueStr) return '';

    // Boolean
    if (valueStr === 'true') return true;
    if (valueStr === 'false') return false;

    // Number
    if (/^\d+$/.test(valueStr)) return parseInt(valueStr, 10);
    if (/^\d+\.\d+$/.test(valueStr)) return parseFloat(valueStr);

    // Array (simple format: [item1, item2])
    if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
      const arrayContent = valueStr.slice(1, -1);
      if (!arrayContent.trim()) return [];
      return arrayContent.split(',').map(item => this.parseYamlValue(item.trim()));
    }

    // String with quotes
    if ((valueStr.startsWith('"') && valueStr.endsWith('"')) ||
        (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
      return valueStr.slice(1, -1);
    }

    // Plain string
    return valueStr;
  }

  /**
   * Determine target archive path based on frontmatter
   * @param draftPath - Original draft path
   * @param frontmatter - Parsed frontmatter
   * @returns Target archive path
   */
  private determineTargetPath(draftPath: string, frontmatter: DraftFrontmatter): string {
    const vaultPath = this.configManager.loadProjectConfig().obsidian.vaultPath;
    const type = frontmatter.type || 'session-draft';
    const date = frontmatter.date || format(new Date(), 'yyyy-MM-dd');
    const project = frontmatter.project || 'default';

    let targetPath: string;

    switch (type) {
      case 'session-draft':
        // Archive to project folder
        const projectName = this.extractProjectName(project);
        targetPath = path.join(
          vaultPath,
          '01-專案 Projects',
          projectName,
          `${date}-會話記錄.md`
        );
        break;

      case 'daily-note':
        // Archive to daily notes
        targetPath = path.join(
          vaultPath,
          '日記/Daily Notes',
          `${date}.md`
        );
        break;

      default:
        // Default to project location
        const defaultProjectName = this.extractProjectName(project);
        targetPath = path.join(
          vaultPath,
          '01-專案 Projects',
          defaultProjectName,
          `${date}-會話記錄.md`
        );
    }

    return targetPath;
  }

  /**
   * Extract project name from project path
   * @param projectPath - Full project path
   * @returns Simplified project name
   */
  private extractProjectName(projectPath: string): string {
    // If it's a path, extract the last component
    if (projectPath.includes('/') || projectPath.includes('\\')) {
      const parts = projectPath.split(/[\/\\]/);
      const lastPart = parts[parts.length - 1];
      return lastPart || 'default-project';
    }

    // Otherwise use as-is or provide default
    return projectPath || 'default-project';
  }

  /**
   * Ensure target directory exists
   * @param targetPath - Path to target file
   */
  private async ensureDirectoryExists(targetPath: string): Promise<void> {
    const directory = path.dirname(targetPath);
    await fs.mkdir(directory, { recursive: true });
  }

  /**
   * Update status in frontmatter
   * @param draft - Draft content
   * @param newStatus - New status value
   * @returns Updated markdown content
   */
  private updateStatus(draft: DraftContent, newStatus: string): string {
    const updatedFrontmatter = { ...draft.frontmatter, status: newStatus };
    const frontmatterText = this.stringifyFrontmatter(updatedFrontmatter);

    return `---\n${frontmatterText}\n---\n${draft.content}`;
  }

  /**
   * Convert frontmatter object to YAML string
   * @param frontmatter - Frontmatter object
   * @returns YAML string
   */
  private stringifyFrontmatter(frontmatter: DraftFrontmatter): string {
    const lines: string[] = [];

    // Define key order for consistent output
    const keyOrder = [
      'type', 'date', 'startTime', 'endTime', 'duration',
      'generatedBy', 'model', 'complexity', 'status',
      'tags', 'project', 'summary'
    ];

    // Output keys in preferred order
    for (const key of keyOrder) {
      if (key in frontmatter) {
        lines.push(this.stringifyYamlField(key, frontmatter[key]));
      }
    }

    // Output any remaining keys
    for (const key of Object.keys(frontmatter)) {
      if (!keyOrder.includes(key)) {
        lines.push(this.stringifyYamlField(key, frontmatter[key]));
      }
    }

    return lines.join('\n');
  }

  /**
   * Stringify a single YAML field
   * @param key - Field key
   * @param value - Field value
   * @returns YAML field string
   */
  private stringifyYamlField(key: string, value: any): string {
    if (Array.isArray(value)) {
      return `${key}: [${value.map(v => {
        if (typeof v === 'string') {
          return `"${v}"`;
        }
        return String(v);
      }).join(', ')}]`;
    } else if (typeof value === 'object') {
      return `${key}: ${JSON.stringify(value)}`;
    } else if (typeof value === 'string') {
      // Check if value needs quotes
      if (value.includes(':') || value.includes('[') || value.includes(']') || value.includes('&')) {
        return `${key}: "${value}"`;
      }
      return `${key}: ${value}`;
    } else {
      return `${key}: ${value}`;
    }
  }
}
