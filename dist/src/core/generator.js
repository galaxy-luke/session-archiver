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
    constructor(sessionCollector, fileCollector, gitCollector, aiClient, vaultPath, templatePath, templateConfig) {
        this.sessionCollector = sessionCollector;
        this.fileCollector = fileCollector;
        this.gitCollector = gitCollector;
        this.aiClient = aiClient;
        this.vaultPath = vaultPath;
        this.templatePath = templatePath;
        this.templateConfig = templateConfig;
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
            // Smart template lookup with configuration
            let template = '';
            let templateLoaded = false;
            // Determine which template to use based on config
            const templateType = this.templateConfig?.templateType || 'default';
            const sharedTemplatesPath = this.templateConfig?.sharedTemplatesPath ||
                'G:\\我的雲端硬碟\\2ndBrain\\範本 Templates';
            console.log(`🔍 Template configuration: type=${templateType}, sharedPath=${sharedTemplatesPath}`);
            // 1. Try project-specific template first
            const projectTemplatePath = path.join(this.templatePath, 'session-draft.md');
            try {
                template = await fs_1.promises.readFile(projectTemplatePath, 'utf-8');
                templateLoaded = true;
                console.log('📝 Using project-specific template');
            }
            catch (error) {
                // 2. Try shared templates directory based on type
                const templateFileName = this.getTemplateName(templateType);
                const sharedTemplatePaths = [
                    path.join(sharedTemplatesPath, templateFileName),
                    path.join(process.env.USERPROFILE || '', 'Documents\\範本 Templates', templateFileName),
                    path.join(process.env.HOME || '', 'Templates', templateFileName)
                ];
                for (const sharedPath of sharedTemplatePaths) {
                    try {
                        template = await fs_1.promises.readFile(sharedPath, 'utf-8');
                        templateLoaded = true;
                        console.log(`📝 Using shared template: ${sharedPath}`);
                        break;
                    }
                    catch (err) {
                        // Continue to next path
                    }
                }
                // 3. Use built-in default template as last resort
                if (!templateLoaded) {
                    console.log('📝 Using built-in default template');
                    template = this.getDefaultTemplate(templateType);
                }
            }
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
     * Get template name based on template type
     * @param templateType - Type of template
     * @returns Template filename
     */
    getTemplateName(templateType) {
        const templateMap = {
            'default': 'session-draft.md',
            'simple': 'session-draft-simple.md',
            'tech': 'session-draft-tech.md',
            'custom': 'session-draft.md'
        };
        return templateMap[templateType] || 'session-draft.md';
    }
    /**
     * Get default template when custom template is not found
     * @param templateType - Type of template to generate
     * @returns Default template content
     */
    getDefaultTemplate(templateType = 'default') {
        const templates = {
            'default': this.getDefaultTemplateFull(),
            'simple': this.getDefaultTemplateSimple(),
            'tech': this.getDefaultTemplateTech()
        };
        return templates[templateType] || templates['default'];
    }
    /**
     * Get full default template
     */
    getDefaultTemplateFull() {
        return `---
type: session-draft
date: {{date}}
startTime: {{startTime}}
endTime: {{endTime}}
duration: {{duration}}
generatedBy: session-archiver
model: {{model}}
complexity: {{complexity}}
status: draft
tags: [session, draft, project]
project: {{projectPath}}
---

# 會話總結

{{summary}}

## 主要工作項目

{{mainWorkItems}}

## 技術決策與理由

{{techDecisions}}

## 關鍵程式碼片段

{{codeSnippets}}

## 問題與解決

{{problemsSolutions}}

## 下次行動

{{nextActions}}

## 相關檔案

### 檔案變更

{{fileChanges}}

### Git 狀態

\`\`\`
{{gitStatus}}
\`\`\`

### Git 提交

{{gitCommits}}

## 相關資源

- 會話ID: {{sessionId}}
- 使用的模型: {{model}}
- 會話時長: {{duration}}
- Token 使用量: {{tokensUsed}}
- 預估成本: \${{cost}}

## 元數據

\`\`\`json
{
  "generatedAt": "{{generatedAt}}",
  "model": "{{model}}",
  "complexity": {{complexity}},
  "tokensUsed": {{tokensUsed}},
  "cost": {{cost}},
  "sessionId": "{{sessionId}}"
}
\`\`\`

---

*此草稿由 session-archiver 自動生成，請在審查後編輯和完善內容。*`;
    }
    /**
     * Get simple default template
     */
    getDefaultTemplateSimple() {
        return `---
type: session-draft
date: {{date}}
status: draft
project: {{projectPath}}
---

# {{date}} 會話記錄

## 摘要
{{summary}}

## 完成項目
{{mainWorkItems}}

## 下次行動
{{nextActions}}

---
*會話ID: {{sessionId}} | 模型: {{model}} | 時長: {{duration}}*`;
    }
    /**
     * Get tech-focused default template
     */
    getDefaultTemplateTech() {
        return `---
type: session-draft
date: {{date}}
startTime: {{startTime}}
endTime: {{endTime}}
duration: {{duration}}
generatedBy: session-archiver
model: {{model}}
complexity: {{complexity}}
status: draft
tags: [session, tech, development]
project: {{projectPath}}
---

# {{date}} 技術會話

## 🎯 會話概要

**摘要**: {{summary}}

**主要目標**: {{mainWorkItems}}

## 💻 技術實現

### 程式碼變更
{{codeSnippets}}

### 技術決策
{{techDecisions}}

## 🐛 問題與解決

{{problemsSolutions}}

## 📋 後續任務

{{nextActions}}

## 📊 會話元數據

- **會話ID**: {{sessionId}}
- **使用模型**: {{model}}
- **會話時長**: {{duration}}
- **Token使用**: {{tokensUsed}}
- **預估成本**: \${{cost}}
- **複雜度**: {{complexity}}/10

## 🔗 相關連結

- **專案路徑**: {{projectPath}}
- **Git狀態**: {{gitStatus}}
- **相關提交**: {{gitCommits}}

---

*由 session-archiver 自動生成 | {{generatedAt}}*`;
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