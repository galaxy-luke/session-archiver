"use strict";
/**
 * Unit tests for data collectors
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const sessionCollector_1 = require("../../src/collectors/sessionCollector");
const fileCollector_1 = require("../../src/collectors/fileCollector");
const gitCollector_1 = require("../../src/collectors/gitCollector");
(0, globals_1.describe)('SessionCollector', () => {
    let collector;
    (0, globals_1.beforeEach)(() => {
        collector = new sessionCollector_1.SessionCollector();
    });
    (0, globals_1.describe)('extractConversation', () => {
        (0, globals_1.it)('should filter assistant messages with content > 50 chars', () => {
            const messages = [
                { role: 'user', content: 'Short user message' },
                { role: 'assistant', content: 'A'.repeat(51) }, // Should be included
                { role: 'assistant', content: 'Short' }, // Should be excluded
                { role: 'user', content: 'B'.repeat(100) }, // Should be excluded (user role)
                { role: 'assistant', content: 'C'.repeat(60) }, // Should be included
            ];
            const result = collector.extractConversation(messages);
            (0, globals_1.expect)(result).toHaveLength(2);
            (0, globals_1.expect)(result[0].content).toHaveLength(51);
            (0, globals_1.expect)(result[1].content).toHaveLength(60);
        });
        (0, globals_1.it)('should handle empty messages array', () => {
            const result = collector.extractConversation([]);
            (0, globals_1.expect)(result).toEqual([]);
        });
        (0, globals_1.it)('should handle messages without content field', () => {
            const messages = [
                { role: 'assistant' }, // No content field
                { role: 'assistant', content: 'D'.repeat(51) },
            ];
            const result = collector.extractConversation(messages);
            (0, globals_1.expect)(result).toHaveLength(1);
        });
    });
    (0, globals_1.describe)('collect', () => {
        (0, globals_1.it)('should collect session context data', () => {
            const context = {
                messages: [
                    { role: 'assistant', content: 'E'.repeat(51) },
                    { role: 'assistant', content: 'F'.repeat(61) },
                ],
                workDirectory: '/test/dir',
                startTime: new Date('2024-01-01T10:00:00Z'),
            };
            const result = collector.collect(context);
            (0, globals_1.expect)(result).toMatchObject({
                timestamp: globals_1.expect.any(String),
                workDirectory: '/test/dir',
                startTime: '2024-01-01T10:00:00.000Z',
                endTime: globals_1.expect.any(String),
                conversationHistory: [
                    { role: 'assistant', content: 'E'.repeat(51) },
                    { role: 'assistant', content: 'F'.repeat(61) },
                ],
            });
        });
        (0, globals_1.it)('should handle missing startTime', () => {
            const context = {
                messages: [],
                workDirectory: '/test/dir',
            };
            const result = collector.collect(context);
            (0, globals_1.expect)(result.startTime).toBe('unknown');
        });
    });
});
(0, globals_1.describe)('FileCollector', () => {
    (0, globals_1.describe)('collectFileChanges', () => {
        (0, globals_1.it)('should return file changes from git status', async () => {
            const mockSimpleGit = {
                status: globals_1.jest.fn(),
                cwd: globals_1.jest.fn(),
            };
            mockSimpleGit.status.mockResolvedValue({
                modified: ['file1.ts', 'file2.ts'],
                created: ['file3.ts'],
                deleted: ['file4.ts'],
                not_added: [],
                conflicted: [],
                missing: [],
                renamed: [],
                staged: [],
                files: [],
            });
            const collector = new fileCollector_1.FileCollector(mockSimpleGit);
            const result = await collector.collectFileChanges('/test/dir');
            (0, globals_1.expect)(result).toMatchObject({
                modified: ['file1.ts', 'file2.ts'],
                created: ['file3.ts'],
                deleted: ['file4.ts'],
            });
        });
        (0, globals_1.it)('should handle git errors gracefully', async () => {
            const mockSimpleGit = {
                status: globals_1.jest.fn(),
                cwd: globals_1.jest.fn(),
            };
            mockSimpleGit.status.mockRejectedValue(new Error('Git error'));
            const collector = new fileCollector_1.FileCollector(mockSimpleGit);
            const result = await collector.collectFileChanges('/test/dir');
            (0, globals_1.expect)(result).toEqual({
                modified: [],
                created: [],
                deleted: [],
            });
        });
    });
    (0, globals_1.describe)('generateDiffSummary', () => {
        (0, globals_1.it)('should generate diff summary for modified file', async () => {
            const mockSimpleGit = {
                diffSummary: globals_1.jest.fn(),
                cwd: globals_1.jest.fn(),
            };
            mockSimpleGit.diffSummary.mockResolvedValue({
                files: [
                    { file: 'test.ts', changes: 5, insertions: 3, deletions: 2 },
                ],
            });
            const collector = new fileCollector_1.FileCollector(mockSimpleGit);
            const result = await collector.generateDiffSummary('/test/dir', 'test.ts');
            (0, globals_1.expect)(result).toBe('+3 -2 lines');
        });
        (0, globals_1.it)('should return "N/A" on diff error', async () => {
            const mockSimpleGit = {
                diffSummary: globals_1.jest.fn(),
                cwd: globals_1.jest.fn(),
            };
            mockSimpleGit.diffSummary.mockRejectedValue(new Error('Diff error'));
            const collector = new fileCollector_1.FileCollector(mockSimpleGit);
            const result = await collector.generateDiffSummary('/test/dir', 'test.ts');
            (0, globals_1.expect)(result).toBe('N/A');
        });
    });
});
(0, globals_1.describe)('GitCollector', () => {
    (0, globals_1.describe)('getGitStatus', () => {
        (0, globals_1.it)('should return git status', async () => {
            const mockSimpleGit = {
                status: globals_1.jest.fn(),
                cwd: globals_1.jest.fn(),
            };
            mockSimpleGit.status.mockResolvedValue({
                current: 'main',
                tracking: 'origin/main',
                files: [],
                created: [],
                modified: [],
                deleted: [],
            });
            const collector = new gitCollector_1.GitCollector(mockSimpleGit);
            const result = await collector.getGitStatus('/test/dir');
            (0, globals_1.expect)(result).toMatchObject({
                current: 'main',
                tracking: 'origin/main',
                status: 'unavailable',
            });
        });
        (0, globals_1.it)('should return "unavailable" on git error', async () => {
            const mockSimpleGit = {
                status: globals_1.jest.fn(),
                cwd: globals_1.jest.fn(),
            };
            mockSimpleGit.status.mockRejectedValue(new Error('Not a git repo'));
            const collector = new gitCollector_1.GitCollector(mockSimpleGit);
            const result = await collector.getGitStatus('/test/dir');
            (0, globals_1.expect)(result).toEqual({
                current: 'unavailable',
                tracking: 'unavailable',
                status: 'unavailable',
            });
        });
    });
    (0, globals_1.describe)('getRecentCommits', () => {
        (0, globals_1.it)('should return recent commits', async () => {
            const mockSimpleGit = {
                log: globals_1.jest.fn(),
                cwd: globals_1.jest.fn(),
            };
            mockSimpleGit.log.mockResolvedValue({
                latest: {
                    hash: 'abc123',
                    message: 'Test commit',
                    author_name: 'Test Author',
                    date: '2024-01-01',
                },
                all: [
                    {
                        hash: 'abc123',
                        message: 'Test commit',
                        author_name: 'Test Author',
                        date: '2024-01-01',
                    },
                    {
                        hash: 'def456',
                        message: 'Another commit',
                        author_name: 'Another Author',
                        date: '2024-01-02',
                    },
                ],
            });
            const collector = new gitCollector_1.GitCollector(mockSimpleGit);
            const result = await collector.getRecentCommits('/test/dir', 2);
            (0, globals_1.expect)(result).toHaveLength(2);
            (0, globals_1.expect)(result[0]).toMatchObject({
                hash: 'abc123',
                message: 'Test commit',
                author: 'Test Author',
                date: '2024-01-01',
            });
        });
        (0, globals_1.it)('should return "unavailable" on git error', async () => {
            const mockSimpleGit = {
                log: globals_1.jest.fn(),
                cwd: globals_1.jest.fn(),
            };
            mockSimpleGit.log.mockRejectedValue(new Error('Git error'));
            const collector = new gitCollector_1.GitCollector(mockSimpleGit);
            const result = await collector.getRecentCommits('/test/dir', 5);
            (0, globals_1.expect)(result).toEqual(['unavailable']);
        });
        (0, globals_1.it)('should use default count of 5 when not specified', async () => {
            const mockSimpleGit = {
                log: globals_1.jest.fn(),
                cwd: globals_1.jest.fn(),
            };
            mockSimpleGit.log.mockResolvedValue({
                latest: null,
                all: [],
            });
            const collector = new gitCollector_1.GitCollector(mockSimpleGit);
            await collector.getRecentCommits('/test/dir');
            (0, globals_1.expect)(mockSimpleGit.log).toHaveBeenCalledWith({ maxCount: 5 });
        });
    });
    (0, globals_1.describe)('collect', () => {
        (0, globals_1.it)('should collect git status and commits', async () => {
            const mockSimpleGit = {
                status: globals_1.jest.fn(),
                log: globals_1.jest.fn(),
                cwd: globals_1.jest.fn(),
            };
            mockSimpleGit.status.mockResolvedValue({
                current: 'main',
                tracking: 'origin/main',
                files: [],
            });
            mockSimpleGit.log.mockResolvedValue({
                latest: {
                    hash: 'abc123',
                    message: 'Test commit',
                    author_name: 'Test Author',
                    date: '2024-01-01',
                },
                all: [
                    {
                        hash: 'abc123',
                        message: 'Test commit',
                        author_name: 'Test Author',
                        date: '2024-01-01',
                    },
                ],
            });
            const collector = new gitCollector_1.GitCollector(mockSimpleGit);
            const result = await collector.collect('/test/dir');
            (0, globals_1.expect)(result).toMatchObject({
                gitStatus: {
                    current: 'main',
                    tracking: 'origin/main',
                    status: 'unavailable',
                },
                gitCommits: [
                    {
                        hash: 'abc123',
                        message: 'Test commit',
                        author: 'Test Author',
                        date: '2024-01-01',
                    },
                ],
            });
        });
    });
});
//# sourceMappingURL=collectors.test.js.map