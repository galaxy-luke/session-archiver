"use strict";
/**
 * Session Summary Generator
 * Orchestrates data collection and AI generation to create session drafts
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Generator = void 0;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const date_fns_1 = require("date-fns");
const simple_git_1 = __importDefault(require("simple-git"));
/**
 * Session summary generator
 * Orchestrates collection, AI generation, and template rendering
 */
class Generator {
    constructor(sessionCollector, fileCollector, gitCollector, aiClient, vaultPath, templatePath) {
        this.sessionCollector = sessionCollector;
        this.fileCollector = fileCollector;
        this.gitCollector = gitCollector;
        this.aiClient = aiClient;
        this.vaultPath = vaultPath;
        this.templatePath = templatePath;
        this.git = (0, simple_git_1.default)();
    }
    /**
     * Generate a complete session draft
     * @param context - Generator context
     * @returns Generator result with summary and draft path
     */
    async generate(context) {
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
            const aiFileChanges = [
                ...fileChanges.modified.map(path => ({ path, changeType: 'modified', summary: '' })),
                ...fileChanges.created.map(path => ({ path, changeType: 'created', summary: '' })),
                ...fileChanges.deleted.map(path => ({ path, changeType: 'deleted', summary: '' }))
            ];
            // Step 5: Convert git commits to string array
            const gitCommitStrings = Array.isArray(gitData.gitCommits)
                ? gitData.gitCommits.map((commit) => typeof commit === 'string' ? commit : commit.message)
                : [];
            // Step 6: Prepare AI request
            const aiRequest = {
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
            const modelSelection = {
                model: context.model,
                complexity: 5 // Default complexity
            };
            // Step 8: Generate AI summary
            const summary = await this.aiClient.generateSummary(aiRequest, modelSelection);
            // Step 9: Render template
            const draftContent = await this.renderDraft(summary, context, fileChanges, gitData, aiFileChanges);
            // Step 10: Save to Obsidian vault
            const draftFileName = this.generateDraftFileName(context);
            const draftPath = path.join(this.vaultPath, '草稿', draftFileName);
            // Ensure directory exists
            const draftDir = path.dirname(draftPath);
            await fs_1.promises.mkdir(draftDir, { recursive: true });
            // Write draft file
            await fs_1.promises.writeFile(draftPath, draftContent, 'utf-8');
            return {
                summary,
                draftPath,
                context
            };
        }
        catch (error) {
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
    async renderDraft(summary, context, fileChanges, gitData, aiFileChanges) {
        try {
            // Read template
            const templateFilePath = path.join(this.templatePath, 'session-draft.md');
            let template = await fs_1.promises.readFile(templateFilePath, 'utf-8');
            // Calculate duration
            const duration = this.calculateDuration(context.startTime, context.endTime);
            // Format dates and times
            const date = (0, date_fns_1.format)(context.startTime, 'yyyy-MM-dd');
            const startTime = (0, date_fns_1.format)(context.startTime, 'HH:mm:ss');
            const endTime = (0, date_fns_1.format)(context.endTime, 'HH:mm:ss');
            const generatedAt = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd HH:mm:ss');
            // Format summary fields
            const mainWorkItems = summary.主要工作項目.map(item => `- ${item}`).join('\n');
            const codeSnippets = summary.關鍵程式碼片段.map(code => `\`\`\`\n${code}\n\`\`\``).join('\n\n');
            const problemsSolutions = summary.問題與解決方案
                .map(ps => `- **問題**: ${ps.問題}\n  **解決方案**: ${ps.解決方案}`)
                .join('\n');
            // Format file changes
            const fileChangesText = aiFileChanges
                .map(fc => {
                const changeTypeMap = {
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
            const replacements = {
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
                '{{cost}}': typeof summary.元數據.cost === 'number'
                    ? summary.元數據.cost.toFixed(4)
                    : summary.元數據.cost,
                '{{gitStatus}}': gitStatusText,
                '{{gitCommits}}': gitCommitsText,
                '{{fileChanges}}': fileChangesText
            };
            let rendered = template;
            for (const [placeholder, value] of Object.entries(replacements)) {
                rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
            }
            return rendered;
        }
        catch (error) {
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
    calculateDuration(startTime, endTime) {
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
    generateDraftFileName(context) {
        const date = (0, date_fns_1.format)(context.startTime, 'yyyy-MM-dd');
        const time = (0, date_fns_1.format)(context.startTime, 'HHmm');
        return `session-draft-${date}-${time}.md`;
    }
}
exports.Generator = Generator;
/**
 * Helper function to format git commits
 */
function gitCommitStrings(commits) {
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
//# sourceMappingURL=generator.js.map