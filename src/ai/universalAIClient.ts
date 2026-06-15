import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import {
  AIMessage,
  AISummaryRequest,
  AISummary,
  FileChange,
  ModelSelection,
  AIProvider
} from './types';

/**
 * Universal AI client supporting multiple providers (OpenAI-compatible and Anthropic)
 */
export class UniversalAIClient {
  private openaiClient?: OpenAI;
  private anthropicClient?: Anthropic;
  private provider: AIProvider;
  private apiKey: string;
  private baseURL?: string;

  constructor(config: { provider: AIProvider; apiKey: string; baseURL?: string }) {
    this.provider = config.provider;
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL;

    if (config.provider === 'openai' || config.provider === 'glm') {
      this.openaiClient = new OpenAI({
        baseURL: config.baseURL || 'https://api.openai.com/v1',
        apiKey: config.apiKey
      });
    } else if (config.provider === 'anthropic') {
      this.anthropicClient = new Anthropic({
        apiKey: config.apiKey
      });
    }
  }

  /**
   * Generate a structured summary from session data
   */
  async generateSummary(
    request: AISummaryRequest,
    modelSelection: ModelSelection
  ): Promise<AISummary> {
    const prompt = this.buildPrompt(request);

    try {
      let responseText: string;

      if (this.provider === 'openai' || this.provider === 'glm') {
        // Use OpenAI-compatible API (for GLM and others)
        responseText = await this.generateWithOpenAI(prompt, modelSelection);
      } else if (this.provider === 'anthropic') {
        // Use Anthropic API
        responseText = await this.generateWithAnthropic(prompt, modelSelection);
      } else {
        throw new Error(`Unsupported AI provider: ${this.provider}`);
      }

      // Parse the structured response
      return this.parseResponse(responseText);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate summary: ${error.message}`);
      }
      throw new Error('Failed to generate summary: Unknown error');
    }
  }

  /**
   * Generate summary using OpenAI-compatible API
   */
  private async generateWithOpenAI(
    prompt: string,
    modelSelection: ModelSelection
  ): Promise<string> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openaiClient.chat.completions.create({
      model: modelSelection.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: modelSelection.maxTokens || 4096,
      temperature: modelSelection.temperature || 0.7
    });

    if (!response.choices[0]?.message?.content) {
      throw new Error('Empty response from AI model');
    }

    return response.choices[0].message.content;
  }

  /**
   * Generate summary using Anthropic API
   */
  private async generateWithAnthropic(
    prompt: string,
    modelSelection: ModelSelection
  ): Promise<string> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }

    const response = await this.anthropicClient.messages.create({
      model: modelSelection.model,
      max_tokens: modelSelection.maxTokens || 4096,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    if (response.content.length === 0) {
      throw new Error('Empty response from AI model');
    }

    const textBlock = response.content[0];
    if (textBlock.type !== 'text') {
      throw new Error('Unexpected response format from AI model');
    }

    return textBlock.text;
  }

  /**
   * Build Chinese prompt for AI summary generation
   */
  private buildPrompt(request: AISummaryRequest): string {
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
    "tokensUsed": "估算的token使用量",
    "cost": "估算的成本（USD）"
  }
}

請確保返回純 JSON 格式，不要包含其他說明文字。`;
  }

  /**
   * Format conversation history for prompt
   */
  private formatConversation(messages: AIMessage[]): string {
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
   */
  private formatFileChanges(changes: FileChange[]): string {
    if (changes.length === 0) {
      return '無檔案變更';
    }

    const changeTypeMap: Record<string, string> = {
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
   */
  private parseResponse(responseText: string): AISummary {
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
      const requiredFields: (keyof AISummary)[] = [
        '摘要',
        '主要工作項目',
        '技術決策與理由',
        '關鍵程式碼片段',
        '問題與解決方案',
        '下次行動',
        '元數據'
      ];

      const missingFields = requiredFields.filter(field => !(field in parsed));
      if (missingFields.length > 0) {
        console.error('❌ Missing fields:', missingFields);
        console.error('📄 Actual response keys:', Object.keys(parsed));
        throw new Error(`Missing required field: ${missingFields[0]}`);
      }

      return parsed as AISummary;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
      }
      throw error;
    }
  }
}
