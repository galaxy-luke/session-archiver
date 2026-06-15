"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Mock inquirer module
const mockPrompt = jest.fn();
jest.mock('inquirer', () => ({
    __esModule: true,
    default: {
        prompt: mockPrompt
    },
    prompt: mockPrompt
}));
const promptHelper_1 = require("../../src/utils/promptHelper");
describe('promptHelper', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('promptForProjectConfig', () => {
        it('should prompt for all required configuration fields', async () => {
            const mockAnswers = {
                projectName: 'test-project',
                vaultPath: '/path/to/vault',
                attachmentFolder: 'attachments',
                dateFormat: 'YYYY-MM-DD',
                aiModel: 'claude-3-5-sonnet-20241022',
                maxTokens: 4096,
                temperature: 0.7,
                enableDaemon: true,
                checkInterval: 60,
                idleTimeout: 300,
                sessionNoteTemplate: 'default',
                summaryTemplate: 'default',
                tagsTemplate: 'default'
            };
            mockPrompt.mockResolvedValue(mockAnswers);
            const result = await (0, promptHelper_1.promptForProjectConfig)();
            expect(mockPrompt).toHaveBeenCalled();
            expect(result).toEqual(mockAnswers);
        });
        it('should handle default values for optional fields', async () => {
            const mockAnswers = {
                projectName: 'test-project',
                vaultPath: '/path/to/vault',
                attachmentFolder: '',
                dateFormat: '',
                aiModel: 'claude-3-5-sonnet-20241022',
                maxTokens: 0,
                temperature: 0,
                enableDaemon: false,
                checkInterval: 0,
                idleTimeout: 0,
                sessionNoteTemplate: '',
                summaryTemplate: '',
                tagsTemplate: ''
            };
            mockPrompt.mockResolvedValue(mockAnswers);
            const result = await (0, promptHelper_1.promptForProjectConfig)();
            expect(result).toEqual(mockAnswers);
        });
        it('should prompt user to confirm when daemon is enabled', async () => {
            const mockAnswers = {
                projectName: 'test-project',
                vaultPath: '/path/to/vault',
                enableDaemon: true,
                aiModel: 'claude-3-5-sonnet-20241022',
                attachmentFolder: '',
                dateFormat: '',
                maxTokens: 0,
                temperature: 0,
                checkInterval: 60,
                idleTimeout: 300,
                sessionNoteTemplate: '',
                summaryTemplate: '',
                tagsTemplate: ''
            };
            mockPrompt.mockResolvedValue(mockAnswers);
            await (0, promptHelper_1.promptForProjectConfig)();
            expect(mockPrompt).toHaveBeenCalled();
        });
    });
    describe('buildConfigFromAnswers', () => {
        it('should build complete config from answers', () => {
            const answers = {
                projectName: 'test-project',
                vaultPath: '/path/to/vault',
                attachmentFolder: 'attachments',
                dateFormat: 'YYYY-MM-DD',
                aiModel: 'claude-3-5-sonnet-20241022',
                maxTokens: 4096,
                temperature: 0.7,
                enableDaemon: true,
                checkInterval: 60,
                idleTimeout: 300,
                sessionNoteTemplate: 'default',
                summaryTemplate: 'default',
                tagsTemplate: 'default'
            };
            const result = (0, promptHelper_1.buildConfigFromAnswers)(answers);
            expect(result.projectName).toBe('test-project');
            expect(result.obsidian.vaultPath).toBe('/path/to/vault');
            expect(result.obsidian.attachmentFolder).toBe('attachments');
            expect(result.obsidian.dateFormat).toBe('YYYY-MM-DD');
            expect(result.ai.model).toBe('claude-3-5-sonnet-20241022');
            expect(result.ai.maxTokens).toBe(4096);
            expect(result.ai.temperature).toBe(0.7);
            expect(result.daemon.enabled).toBe(true);
            expect(result.daemon.checkInterval).toBe(60);
            expect(result.daemon.idleTimeout).toBe(300);
            expect(result.templates.sessionNote).toBe('default');
            expect(result.templates.summaryTemplate).toBe('default');
            expect(result.templates.tagsTemplate).toBe('default');
        });
        it('should handle empty optional fields', () => {
            const answers = {
                projectName: 'test-project',
                vaultPath: '/path/to/vault',
                attachmentFolder: '',
                dateFormat: '',
                aiModel: 'claude-3-5-sonnet-20241022',
                maxTokens: 0,
                temperature: 0,
                enableDaemon: false,
                checkInterval: 0,
                idleTimeout: 0,
                sessionNoteTemplate: '',
                summaryTemplate: '',
                tagsTemplate: ''
            };
            const result = (0, promptHelper_1.buildConfigFromAnswers)(answers);
            expect(result.projectName).toBe('test-project');
            expect(result.obsidian.vaultPath).toBe('/path/to/vault');
            expect(result.obsidian.attachmentFolder).toBeUndefined();
            expect(result.obsidian.dateFormat).toBeUndefined();
            expect(result.ai.model).toBe('claude-3-5-sonnet-20241022');
            expect(result.ai.maxTokens).toBeUndefined();
            expect(result.ai.temperature).toBeUndefined();
            expect(result.daemon.enabled).toBe(false);
            expect(result.daemon.checkInterval).toBeUndefined();
            expect(result.daemon.idleTimeout).toBeUndefined();
            expect(result.templates.sessionNote).toBeUndefined();
            expect(result.templates.summaryTemplate).toBeUndefined();
            expect(result.templates.tagsTemplate).toBeUndefined();
        });
        it('should create valid archiving config defaults', () => {
            const answers = {
                projectName: 'test-project',
                vaultPath: '/path/to/vault',
                attachmentFolder: '',
                dateFormat: '',
                aiModel: 'claude-3-5-sonnet-20241022',
                maxTokens: 0,
                temperature: 0,
                enableDaemon: false,
                checkInterval: 0,
                idleTimeout: 0,
                sessionNoteTemplate: '',
                summaryTemplate: '',
                tagsTemplate: ''
            };
            const result = (0, promptHelper_1.buildConfigFromAnswers)(answers);
            expect(result.archiving).toBeDefined();
            expect(result.archiving.archiveInterval).toBeUndefined();
            expect(result.archiving.maxRetries).toBeUndefined();
            expect(result.archiving.retryDelay).toBeUndefined();
        });
    });
});
//# sourceMappingURL=promptHelper.test.js.map