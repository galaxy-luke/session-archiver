"use strict";
/**
 * Unit tests for Generator class
 */
Object.defineProperty(exports, "__esModule", { value: true });
const generator_1 = require("../../src/core/generator");
const sessionCollector_1 = require("../../src/collectors/sessionCollector");
const fileCollector_1 = require("../../src/collectors/fileCollector");
const gitCollector_1 = require("../../src/collectors/gitCollector");
const anthropicClient_1 = require("../../src/ai/anthropicClient");
const fs_1 = require("fs");
// Mock dependencies
jest.mock('../../src/collectors/sessionCollector');
jest.mock('../../src/collectors/fileCollector');
jest.mock('../../src/collectors/gitCollector');
jest.mock('../../src/ai/anthropicClient');
jest.mock('simple-git', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        cwd: jest.fn().mockReturnThis()
    }))
}));
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
        mkdir: jest.fn(),
        access: jest.fn()
    }
}));
describe('Generator', () => {
    let generator;
    let mockSessionCollector;
    let mockFileCollector;
    let mockGitCollector;
    let mockAnthropicClient;
    // Mock data
    const mockSessionData = {
        timestamp: '2026-06-14T11:30:00Z',
        workDirectory: '/test/project',
        startTime: '2026-06-14T10:00:00Z',
        endTime: '2026-06-14T11:30:00Z',
        conversationHistory: [
            { role: 'assistant', content: 'This is a substantial assistant message that is definitely longer than 50 characters to meet the filter criteria.' }
        ]
    };
    const mockFileChanges = {
        modified: ['/test/file.ts'],
        created: ['/test/new.ts'],
        deleted: []
    };
    const mockGitData = {
        gitStatus: {
            current: 'main',
            tracking: 'origin/main',
            status: 'clean'
        },
        gitCommits: [
            {
                hash: 'abc123',
                message: 'feat: add new feature',
                author: 'Test Author',
                date: '2026-06-14'
            }
        ]
    };
    const mockAISummary = {
        摘要: 'Test session summary',
        主要工作項目: ['Implemented feature X', 'Fixed bug Y'],
        技術決策與理由: 'Used TypeScript for type safety',
        關鍵程式碼片段: ['function test() { return true; }'],
        問題與解決方案: [
            { 問題: 'Type error', 解決方案: 'Added proper types' }
        ],
        下次行動: 'Continue testing',
        元數據: {
            model: 'claude-3-5-sonnet-20241022',
            complexity: 5,
            tokensUsed: 2000,
            cost: 0.02
        }
    };
    const mockContext = {
        sessionId: 'test-session-123',
        projectPath: '/test/project',
        startTime: new Date('2026-06-14T10:00:00Z'),
        endTime: new Date('2026-06-14T11:30:00Z'),
        model: 'claude-3-5-sonnet-20241022'
    };
    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        // Create mock instances
        mockSessionCollector = new sessionCollector_1.SessionCollector();
        mockFileCollector = new fileCollector_1.FileCollector();
        mockGitCollector = new gitCollector_1.GitCollector();
        mockAnthropicClient = new anthropicClient_1.AnthropicClient('test-key');
        // Setup default mock returns
        mockSessionCollector.collect.mockReturnValue(mockSessionData);
        mockFileCollector.collectFileChanges.mockResolvedValue(mockFileChanges);
        mockGitCollector.collect.mockResolvedValue(mockGitData);
        mockAnthropicClient.generateSummary.mockResolvedValue(mockAISummary);
        // Mock file system operations
        const mockReadFile = fs_1.promises.readFile;
        mockReadFile.mockResolvedValue('{{date}} test template');
        const mockWriteFile = fs_1.promises.writeFile;
        mockWriteFile.mockResolvedValue();
        const mockMkdir = fs_1.promises.mkdir;
        mockMkdir.mockResolvedValue(undefined);
        // Create generator instance
        generator = new generator_1.Generator(mockSessionCollector, mockFileCollector, mockGitCollector, mockAnthropicClient, '/test/vault', '/test/templates');
    });
    describe('generate', () => {
        it('should successfully generate a session draft', async () => {
            // Execute
            const result = await generator.generate(mockContext);
            // Verify
            expect(result).toBeDefined();
            expect(result.summary).toEqual(mockAISummary);
            expect(result.draftPath).toContain('草稿');
            expect(mockSessionCollector.collect).toHaveBeenCalled();
            expect(mockFileCollector.collectFileChanges).toHaveBeenCalledWith('/test/project');
            expect(mockGitCollector.collect).toHaveBeenCalledWith('/test/project');
            expect(mockAnthropicClient.generateSummary).toHaveBeenCalled();
        });
        it('should handle collection errors gracefully', async () => {
            // Setup mock to throw error
            mockSessionCollector.collect.mockImplementation(() => {
                throw new Error('Collection failed');
            });
            // Execute and verify
            await expect(generator.generate(mockContext)).rejects.toThrow('Collection failed');
        });
        it('should handle AI generation errors gracefully', async () => {
            // Setup mocks
            mockAnthropicClient.generateSummary.mockRejectedValue(new Error('AI failed'));
            // Execute and verify
            await expect(generator.generate(mockContext)).rejects.toThrow('AI failed');
        });
    });
    describe('calculateDuration', () => {
        it('should calculate duration in hours and minutes', () => {
            const startTime = new Date('2026-06-14T10:00:00Z');
            const endTime = new Date('2026-06-14T11:30:00Z');
            const duration = generator['calculateDuration'](startTime, endTime);
            expect(duration).toBe('1h 30m');
        });
        it('should handle duration less than 1 hour', () => {
            const startTime = new Date('2026-06-14T10:00:00Z');
            const endTime = new Date('2026-06-14T10:45:00Z');
            const duration = generator['calculateDuration'](startTime, endTime);
            expect(duration).toBe('0h 45m');
        });
        it('should handle duration of multiple hours', () => {
            const startTime = new Date('2026-06-14T10:00:00Z');
            const endTime = new Date('2026-06-14T14:30:00Z');
            const duration = generator['calculateDuration'](startTime, endTime);
            expect(duration).toBe('4h 30m');
        });
        it('should handle zero duration', () => {
            const startTime = new Date('2026-06-14T10:00:00Z');
            const endTime = new Date('2026-06-14T10:00:00Z');
            const duration = generator['calculateDuration'](startTime, endTime);
            expect(duration).toBe('0h 0m');
        });
    });
    describe('renderDraft', () => {
        it('should render template with summary data', async () => {
            // Mock template
            const mockReadFile = fs_1.promises.readFile;
            const template = `---
date: {{date}}
startTime: {{startTime}}
endTime: {{endTime}}
duration: {{duration}}
model: {{model}}
---
# {{summary}}
{{mainWorkItems}}`;
            mockReadFile.mockResolvedValue(template);
            // Execute
            const rendered = await generator['renderDraft'](mockAISummary, mockContext, mockFileChanges, mockGitData, [
                { path: '/test/file.ts', changeType: 'modified', summary: '' },
                { path: '/test/new.ts', changeType: 'created', summary: '' }
            ]);
            // Verify
            expect(rendered).toContain('2026-06-14'); // date
            expect(rendered).toMatch(/\d{2}:\d{2}:\d{2}/); // startTime (time format)
            expect(rendered).toMatch(/\d{2}:\d{2}:\d{2}/); // endTime (time format)
            expect(rendered).toContain('claude-3-5-sonnet-20241022'); // model
            expect(rendered).toContain('Test session summary'); // summary
            expect(rendered).toContain('Implemented feature X'); // mainWorkItems
        });
        it('should handle template read errors', async () => {
            // Mock file read error
            const mockReadFile = fs_1.promises.readFile;
            mockReadFile.mockRejectedValue(new Error('Template not found'));
            // Execute and verify
            await expect(generator['renderDraft'](mockAISummary, mockContext, mockFileChanges, mockGitData, [])).rejects.toThrow('Template not found');
        });
        it('should replace all placeholders correctly', async () => {
            // Mock template with all placeholders
            const mockReadFile = fs_1.promises.readFile;
            const template = `{{date}}|{{startTime}}|{{endTime}}|{{duration}}|{{model}}|{{summary}}|{{mainWorkItems}}|{{techDecisions}}|{{codeSnippets}}|{{problemsSolutions}}|{{nextActions}}|{{complexity}}|{{tokensUsed}}|{{cost}}|{{gitStatus}}|{{gitCommits}}|{{fileChanges}}`;
            mockReadFile.mockResolvedValue(template);
            // Execute
            const rendered = await generator['renderDraft'](mockAISummary, mockContext, mockFileChanges, mockGitData, [
                { path: '/test/file.ts', changeType: 'modified', summary: '' }
            ]);
            // Verify no placeholders remain
            expect(rendered).not.toMatch(/\{\{.*\}\}/);
            const parts = rendered.split('|');
            expect(parts.length).toBeGreaterThan(1); // Should have multiple values
        });
    });
});
//# sourceMappingURL=generator.test.js.map