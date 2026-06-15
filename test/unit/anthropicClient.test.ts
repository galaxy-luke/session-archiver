import { AnthropicClient } from '../../src/ai/anthropicClient';
import { AIMessage, AISummaryRequest, FileChange, ModelSelection } from '../../src/ai/types';
import Anthropic from '@anthropic-ai/sdk';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk');

describe('AnthropicClient', () => {
  let client: AnthropicClient;
  let mockAnthropic: jest.Mocked<Anthropic>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock Anthropic instance with proper mock structure
    mockAnthropic = {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                摘要: 'Test summary',
                主要工作項目: ['Item 1', 'Item 2'],
                技術決策與理由: 'Test decisions',
                關鍵程式碼片段: ['code 1', 'code 2'],
                問題與解決方案: [{ 問題: 'test problem', 解決方案: 'test solution' }],
                下次行動: 'Next action',
                元數據: {
                  model: 'glm-4.7-flash',
                  complexity: 5,
                  tokensUsed: 100,
                  cost: 0.001
                }
              })
            }
          ],
          id: 'test-id',
          model: 'glm-4.7-flash',
          role: 'assistant',
          type: 'message'
        })
      }
    } as unknown as jest.Mocked<Anthropic>;

    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => mockAnthropic);

    // Create client instance
    client = new AnthropicClient('test-api-key');
  });

  describe('buildPrompt', () => {
    it('should build a Chinese prompt with all request data', () => {
      const request: AISummaryRequest = {
        conversationHistory: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there' }
        ],
        fileChanges: [
          { path: 'src/test.ts', changeType: 'modified', summary: 'Updated test' }
        ],
        gitStatus: 'M src/test.ts',
        gitCommits: ['feat: add feature'],
        workDirectory: '/project',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T11:00:00')
      };

      const prompt = client['buildPrompt'](request);

      expect(prompt).toContain('請分析以下開發會話');
      expect(prompt).toContain('對話歷史');
      expect(prompt).toContain('Hello');
      expect(prompt).toContain('檔案變更');
      expect(prompt).toContain('src/test.ts');
      expect(prompt).toContain('Git 狀態');
      expect(prompt).toContain('Git 提交');
      expect(prompt).toContain('工作目錄');
      expect(prompt).toContain('/project');
      expect(prompt).toContain('開始時間');
      expect(prompt).toContain('結束時間');
    });

    it('should handle empty conversation history', () => {
      const request: AISummaryRequest = {
        conversationHistory: [],
        fileChanges: [],
        gitStatus: '',
        gitCommits: [],
        workDirectory: '/project',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T11:00:00')
      };

      const prompt = client['buildPrompt'](request);

      expect(prompt).toContain('對話歷史為空');
    });

    it('should handle empty file changes', () => {
      const request: AISummaryRequest = {
        conversationHistory: [{ role: 'user', content: 'Test' }],
        fileChanges: [],
        gitStatus: '',
        gitCommits: [],
        workDirectory: '/project',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T11:00:00')
      };

      const prompt = client['buildPrompt'](request);

      expect(prompt).toContain('無檔案變更');
    });
  });

  describe('formatFileChanges', () => {
    it('should format file changes as Chinese list', () => {
      const changes: FileChange[] = [
        { path: 'src/test.ts', changeType: 'modified', summary: 'Updated test' },
        { path: 'src/new.ts', changeType: 'created', summary: 'New file' }
      ];

      const formatted = client['formatFileChanges'](changes);

      expect(formatted).toContain('src/test.ts');
      expect(formatted).toContain('修改');  // Chinese for 'modified'
      expect(formatted).toContain('Updated test');
      expect(formatted).toContain('src/new.ts');
      expect(formatted).toContain('新增');  // Chinese for 'created'
      expect(formatted).toContain('New file');
    });

    it('should handle empty changes', () => {
      const formatted = client['formatFileChanges']([]);
      expect(formatted).toContain('無檔案變更');
    });

    it('should handle changes without summary', () => {
      const changes: FileChange[] = [
        { path: 'src/test.ts', changeType: 'modified' }
      ];

      const formatted = client['formatFileChanges'](changes);

      expect(formatted).toContain('src/test.ts');
      expect(formatted).toContain('修改');  // Chinese for 'modified'
    });
  });

  describe('parseResponse', () => {
    it('should parse valid AI response into AISummary', () => {
      const responseText = JSON.stringify({
        摘要: 'Session summary',
        主要工作項目: ['Task 1', 'Task 2'],
        技術決策與理由: 'Technical decision reasoning',
        關鍵程式碼片段: ['function test() { return true; }'],
        問題與解決方案: [
          { 問題: 'Bug found', 解決方案: 'Fixed it' }
        ],
        下次行動: 'Continue testing',
        元數據: {
          model: 'glm-4.7-flash',
          complexity: 7,
          tokensUsed: 150,
          cost: 0.002
        }
      });

      const summary = client['parseResponse'](responseText);

      expect(summary).toEqual({
        摘要: 'Session summary',
        主要工作項目: ['Task 1', 'Task 2'],
        技術決策與理由: 'Technical decision reasoning',
        關鍵程式碼片段: ['function test() { return true; }'],
        問題與解決方案: [
          { 問題: 'Bug found', 解決方案: 'Fixed it' }
        ],
        下次行動: 'Continue testing',
        元數據: {
          model: 'glm-4.7-flash',
          complexity: 7,
          tokensUsed: 150,
          cost: 0.002
        }
      });
    });

    it('should handle malformed JSON gracefully', () => {
      const responseText = 'Invalid JSON';

      expect(() => {
        client['parseResponse'](responseText);
      }).toThrow();
    });

    it('should handle partial response data', () => {
      const responseText = JSON.stringify({
        摘要: 'Partial summary',
        主要工作項目: [],
        技術決策與理由: 'Some decision',
        關鍵程式碼片段: [],
        問題與解決方案: [],
        下次行動: 'Next action',
        元數據: {
          model: 'glm-4.7-flash',
          complexity: 5,
          tokensUsed: 100,
          cost: 0.001
        }
      });

      const summary = client['parseResponse'](responseText);

      expect(summary.摘要).toBe('Partial summary');
      expect(summary.主要工作項目).toEqual([]);
    });
  });

  describe('generateSummary', () => {
    it('should generate summary with default model', async () => {
      const request: AISummaryRequest = {
        conversationHistory: [
          { role: 'user', content: 'Implement feature X' },
          { role: 'assistant', content: 'I will implement feature X' }
        ],
        fileChanges: [
          { path: 'src/feature.ts', changeType: 'created', summary: 'New feature implementation' }
        ],
        gitStatus: 'A src/feature.ts',
        gitCommits: ['feat: add feature X'],
        workDirectory: '/project',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T11:00:00')
      };

      const modelSelection: ModelSelection = {
        model: 'glm-4.7-flash',
        complexity: 5
      };

      const summary = await client.generateSummary(request, modelSelection);

      // Verify API was called
      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'glm-4.7-flash',
          max_tokens: expect.any(Number),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: expect.any(String),
              content: expect.any(String)
            })
          ])
        })
      );

      // Verify summary structure
      expect(summary.摘要).toBeDefined();
      expect(summary.主要工作項目).toBeDefined();
      expect(summary.技術決策與理由).toBeDefined();
      expect(summary.關鍵程式碼片段).toBeDefined();
      expect(summary.問題與解決方案).toBeDefined();
      expect(summary.下次行動).toBeDefined();
      expect(summary.元數據).toBeDefined();
    });

    it('should use custom model when specified', async () => {
      const request: AISummaryRequest = {
        conversationHistory: [{ role: 'user', content: 'Test' }],
        fileChanges: [],
        gitStatus: '',
        gitCommits: [],
        workDirectory: '/project',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T11:00:00')
      };

      const modelSelection: ModelSelection = {
        model: 'glm-4.7-turbo',
        complexity: 7
      };

      await client.generateSummary(request, modelSelection);

      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'glm-4.7-turbo'
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const request: AISummaryRequest = {
        conversationHistory: [{ role: 'user', content: 'Test' }],
        fileChanges: [],
        gitStatus: '',
        gitCommits: [],
        workDirectory: '/project',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T11:00:00')
      };

      const modelSelection: ModelSelection = {
        model: 'glm-4.7-flash',
        complexity: 5
      };

      // Mock API error
      (mockAnthropic.messages.create as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(client.generateSummary(request, modelSelection)).rejects.toThrow('API Error');
    });

    it('should handle empty response from API', async () => {
      const request: AISummaryRequest = {
        conversationHistory: [{ role: 'user', content: 'Test' }],
        fileChanges: [],
        gitStatus: '',
        gitCommits: [],
        workDirectory: '/project',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T11:00:00')
      };

      const modelSelection: ModelSelection = {
        model: 'glm-4.7-flash',
        complexity: 5
      };

      // Mock empty response
      (mockAnthropic.messages.create as jest.Mock).mockResolvedValue({
        content: [],
        id: 'test-id',
        model: 'glm-4.7-flash',
        role: 'assistant',
        type: 'message'
      });

      await expect(client.generateSummary(request, modelSelection)).rejects.toThrow();
    });
  });
});
