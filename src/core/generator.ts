/**
 * Session Summary Generator
 * Orchestrates data collection and AI generation to create session drafts
 */

import { SessionCollector, SessionData, SessionContext, SessionMessage } from '../collectors/sessionCollector';
import { FileCollector, FileChanges } from '../collectors/fileCollector';
import { GitCollector, GitData } from '../collectors/gitCollector';
import { UniversalAIClient } from '../ai/universalAIClient';
import { AISummary, AISummaryRequest, ModelSelection, FileChange } from '../ai/types';
import { promises as fs } from 'fs';
import * as path from 'path';
import { format } from 'date-fns';
import simpleGit, { SimpleGit } from 'simple-git';

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
export class Generator {
  private git: SimpleGit;

  constructor(
    private sessionCollector: SessionCollector,
    private fileCollector: FileCollector,
    private gitCollector: GitCollector,
    private aiClient: UniversalAIClient,
    private vaultPath: string,
    private templatePath: string
  ) {
    this.git = simpleGit();
  }

  /**
   * Generate a complete session draft
   * @param context - Generator context
   * @returns Generator result with summary and draft path
   */
  async generate(context: GeneratorContext): Promise<GeneratorResult> {
    try {
      // Step 1: Collect session data
      const sessionData = this.sessionCollector.collect({
        messages: [], // Will be populated from actual session
        workDirectory: context.projectPath,
        startTime: context.startTime
      });

      // Step 2: Collect file changes
      const fileChanges = await this.fileCollector.collectFileChanges(context.projectPath);

      // Step 3: Collect git data
      const gitData = await this.gitCollector.collect(context.projectPath);

      // Step 4: Convert file changes to AI format
      const aiFileChanges: FileChange[] = [
        ...fileChanges.modified.map(path => ({ path, changeType: 'modified' as const, summary: '' })),
        ...fileChanges.created.map(path => ({ path, changeType: 'created' as const, summary: '' })),
        ...fileChanges.deleted.map(path => ({ path, changeType: 'deleted' as const, summary: '' }))
      ];

      // Step 5: Convert git commits to string array
      const gitCommitStrings = Array.isArray(gitData.gitCommits)
        ? gitData.gitCommits.map((commit: any) =>
            typeof commit === 'string' ? commit : commit.message
          )
        : [];

      // Step 6: Prepare AI request
      const aiRequest: AISummaryRequest = {
        conversationHistory: sessionData.conversationHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content || ''
        })),
        fileChanges: aiFileChanges,
        gitStatus: gitData.gitStatus.status,
        gitCommits: gitCommitStrings,
        workDirectory: context.projectPath,
        startTime: context.startTime,
        endTime: context.endTime
      };

      // Step 7: Select model
      const modelSelection: ModelSelection = {
        model: context.model,
        complexity: 5 // Default complexity
      };

      // Step 8: Generate AI summary
      const summary = await this.aiClient.generateSummary(aiRequest, modelSelection);

      // Step 9: Render template
      const draftContent = await this.renderDraft(
        summary,
        context,
        fileChanges,
        gitData,
        aiFileChanges
      );

      // Step 10: Save to Obsidian vault
      const draftFileName = this.generateDraftFileName(context);
      const draftPath = path.join(this.vaultPath, '草稿', draftFileName);

      // Ensure directory exists
      const draftDir = path.dirname(draftPath);
      await fs.mkdir(draftDir, { recursive: true });

      // Write draft file
      await fs.writeFile(draftPath, draftContent, 'utf-8');

      return {
        summary,
        draftPath,
        context
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate session draft: ${error.message}`);
      }
      throw new Error('Failed to generate session draft: Unknown error');
    }
  }

  /**
   * Render template with summary data
   * @param summary - AI-generated summary
   * @param context - Generator context
   * @param fileChanges - File changes data
   * @param gitData - Git data
   * @param aiFileChanges - AI-formatted file changes
   * @returns Rendered template content
   */
  private async renderDraft(
    summary: AISummary,
    context: GeneratorContext,
    fileChanges: FileChanges,
    gitData: GitData,
    aiFileChanges: FileChange[]
  ): Promise<string> {
    try {
      // Read template
      const templateFilePath = path.join(this.templatePath, 'session-draft.md');
      let template = await fs.readFile(templateFilePath, 'utf-8');

      // Calculate duration
      const duration = this.calculateDuration(context.startTime, context.endTime);

      // Format dates and times
      const date = format(context.startTime, 'yyyy-MM-dd');
      const startTime = format(context.startTime, 'HH:mm:ss');
      const endTime = format(context.endTime, 'HH:mm:ss');
      const generatedAt = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

      // Format summary fields
      const mainWorkItems = summary.主要工作項目.map(item => `- ${item}`).join('\n');
      const codeSnippets = summary.關鍵程式碼片段.map(code => `\`\`\`\n${code}\n\`\`\``).join('\n\n');
      const problemsSolutions = summary.問題與解決方案
        .map(ps => `- **問題**: ${ps.問題}\n  **解決方案**: ${ps.解決方案}`)
        .join('\n');

      // Format file changes
      const fileChangesText = aiFileChanges
        .map(fc => {
          const changeTypeMap: Record<string, string> = {
            created: '新增',
            modified: '修改',
            deleted: '刪除'
          };
          const type = changeTypeMap[fc.changeType] || fc.changeType;
          const summary = fc.summary ? ` - ${fc.summary}` : '';
          return `- ${fc.path} (${type})${summary}`;
        })
        .join('\n');

      // Format git commits
      const gitCommitsText = gitCommitStrings(gitData.gitCommits);

      // Format git status
      const gitStatusText = `${gitData.gitStatus.current} (${gitData.gitStatus.tracking})`;

      // Replace placeholders
      const replacements: Record<string, string | number> = {
        '{{date}}': date,
        '{{startTime}}': startTime,
        '{{endTime}}': endTime,
        '{{duration}}': duration,
        '{{model}}': summary.元數據.model,
        '{{complexity}}': summary.元數據.complexity,
        '{{summary}}': summary.摘要,
        '{{mainWorkItems}}': mainWorkItems,
        '{{techDecisions}}': summary.技術決策與理由,
        '{{codeSnippets}}': codeSnippets,
        '{{problemsSolutions}}': problemsSolutions,
        '{{nextActions}}': summary.下次行動,
        '{{sessionId}}': context.sessionId,
        '{{projectPath}}': context.projectPath,
        '{{generatedAt}}': generatedAt,
        '{{tokensUsed}}': summary.元數據.tokensUsed,
        '{{cost}}': summary.元數據.cost.toFixed(4),
        '{{gitStatus}}': gitStatusText,
        '{{gitCommits}}': gitCommitsText,
        '{{fileChanges}}': fileChangesText
      };

      let rendered = template;
      for (const [placeholder, value] of Object.entries(replacements)) {
        rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
      }

      return rendered;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to render template: ${error.message}`);
      }
      throw new Error('Failed to render template: Unknown error');
    }
  }

  /**
   * Calculate duration between two dates in "Xh Ym" format
   * @param startTime - Start time
   * @param endTime - End time
   * @returns Formatted duration string
   */
  private calculateDuration(startTime: Date, endTime: Date): string {
    const diffMs = endTime.getTime() - startTime.getTime();
    const totalMinutes = Math.floor(diffMs / 1000 / 60);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  }

  /**
   * Generate draft filename from context
   * @param context - Generator context
   * @returns Draft filename
   */
  private generateDraftFileName(context: GeneratorContext): string {
    const date = format(context.startTime, 'yyyy-MM-dd');
    const time = format(context.startTime, 'HHmm');
    return `session-draft-${date}-${time}.md`;
  }
}

/**
 * Helper function to format git commits
 */
function gitCommitStrings(commits: any): string {
  if (Array.isArray(commits)) {
    if (commits.length === 0) {
      return '無提交記錄';
    }
    return commits
      .map(commit => typeof commit === 'string' ? commit : commit.message)
      .map(msg => `- ${msg}`)
      .join('\n');
  }
  return '無提交記錄';
}
