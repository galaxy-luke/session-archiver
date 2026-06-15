"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicClient = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
/**
 * Anthropic AI client for generating session summaries
 */
class AnthropicClient {
    /**
     * Create a new Anthropic client
     * @param apiKey - Anthropic API key
     */
    constructor(apiKey) {
        this.client = new sdk_1.default({
            apiKey: apiKey
        });
    }
    /**
     * Generate a structured summary from session data
     * @param request - Session data to summarize
     * @param modelSelection - Model selection parameters
     * @returns Structured summary in Chinese
     */
    async generateSummary(request, modelSelection) {
        const prompt = this.buildPrompt(request);
        try {
            const response = await this.client.messages.create({
                model: modelSelection.model,
                max_tokens: 4096,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });
            // Extract text from response
            if (response.content.length === 0) {
                throw new Error('Empty response from AI model');
            }
            const textBlock = response.content[0];
            if (textBlock.type !== 'text') {
                throw new Error('Unexpected response format from AI model');
            }
            // Parse the structured response
            return this.parseResponse(textBlock.text);
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to generate summary: ${error.message}`);
            }
            throw new Error('Failed to generate summary: Unknown error');
        }
    }
    /**
     * Build Chinese prompt for AI summary generation
     * @param request - Session data
     * @returns Formatted prompt string
     */
    buildPrompt(request) {
        const conversation = this.formatConversation(request.conversationHistory);
        const fileChanges = this.formatFileChanges(request.fileChanges);
        const commits = request.gitCommits.length > 0
            ? request.gitCommits.join('\n')
            : '無提交記錄';
        const startTime = request.startTime.toISOString();
        const endTime = request.endTime.toISOString();
        const duration = Math.round((request.endTime.getTime() - request.startTime.getTime()) / 1000 / 60);
        return `請分析以下開發會話並生成結構化摘要。

## 對話歷史
${conversation}

## 檔案變更
${fileChanges}

## Git 狀態
\`\`\`
${request.gitStatus || '無變更'}
\`\`\`

## Git 提交
${commits}

## 工作目錄
${request.workDirectory}

## 時間範圍
- 開始時間: ${startTime}
- 結束時間: ${endTime}
- 會話時長: ${duration} 分鐘

請以 JSON 格式返回摘要，包含以下欄位：
{
  "摘要": "會話的簡短概述（2-3句話）",
  "主要工作項目": ["項目1", "項目2", "..."],
  "技術決策與理由": "解釋做出的技術決策及其背後理由",
  "關鍵程式碼片段": ["重要的程式碼片段1", "重要的程式碼片段2", "..."],
  "問題與解決方案": [{"問題": "遇到的問題", "解決方案": "如何解決"}],
  "下次行動": "下次會話應該繼續的工作或需要注意的事項",
  "元數據": {
    "model": "使用的模型名稱",
    "complexity": 1-10的複雜度評分,
    "tokensUsed": 估算的token使用量,
    "cost": 估算的成本（USD）
  }
}

請確保返回純 JSON 格式，不要包含其他說明文字。`;
    }
    /**
     * Format conversation history for prompt
     * @param messages - Array of AI messages
     * @returns Formatted conversation string
     */
    formatConversation(messages) {
        if (messages.length === 0) {
            return '對話歷史為空';
        }
        return messages
            .map(msg => {
            const role = msg.role === 'user' ? '使用者' : '助理';
            return `${role}: ${msg.content}`;
        })
            .join('\n\n');
    }
    /**
     * Format file changes for prompt
     * @param changes - Array of file changes
     * @returns Formatted file changes string
     */
    formatFileChanges(changes) {
        if (changes.length === 0) {
            return '無檔案變更';
        }
        const changeTypeMap = {
            created: '新增',
            modified: '修改',
            deleted: '刪除'
        };
        return changes
            .map(change => {
            const type = changeTypeMap[change.changeType] || change.changeType;
            const summary = change.summary ? ` - ${change.summary}` : '';
            return `- ${change.path} (${type})${summary}`;
        })
            .join('\n');
    }
    /**
     * Parse AI response into structured summary
     * @param responseText - Raw response text from AI
     * @returns Parsed summary object
     */
    parseResponse(responseText) {
        try {
            // Clean up response text - remove any markdown code blocks
            let cleanedText = responseText.trim();
            if (cleanedText.startsWith('```json')) {
                cleanedText = cleanedText.slice(7);
            }
            if (cleanedText.startsWith('```')) {
                cleanedText = cleanedText.slice(3);
            }
            if (cleanedText.endsWith('```')) {
                cleanedText = cleanedText.slice(0, -3);
            }
            cleanedText = cleanedText.trim();
            const parsed = JSON.parse(cleanedText);
            // Validate required fields
            const requiredFields = [
                '摘要',
                '主要工作項目',
                '技術決策與理由',
                '關鍵程式碼片段',
                '問題與解決方案',
                '下次行動',
                '元數據'
            ];
            for (const field of requiredFields) {
                if (!(field in parsed)) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }
            return parsed;
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
            }
            throw error;
        }
    }
}
exports.AnthropicClient = AnthropicClient;
//# sourceMappingURL=anthropicClient.js.map