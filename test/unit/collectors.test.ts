/**
 * Unit tests for data collectors
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SessionCollector } from '../../src/collectors/sessionCollector';
import { FileCollector } from '../../src/collectors/fileCollector';
import { GitCollector } from '../../src/collectors/gitCollector';

describe('SessionCollector', () => {
  let collector: SessionCollector;

  beforeEach(() => {
    collector = new SessionCollector();
  });

  describe('extractConversation', () => {
    it('should filter assistant messages with content > 50 chars', () => {
      const messages = [
        { role: 'user', content: 'Short user message' },
        { role: 'assistant', content: 'A'.repeat(51) }, // Should be included
        { role: 'assistant', content: 'Short' }, // Should be excluded
        { role: 'user', content: 'B'.repeat(100) }, // Should be excluded (user role)
        { role: 'assistant', content: 'C'.repeat(60) }, // Should be included
      ];

      const result = collector.extractConversation(messages);

      expect(result).toHaveLength(2);
      expect(result[0].content).toHaveLength(51);
      expect(result[1].content).toHaveLength(60);
    });

    it('should handle empty messages array', () => {
      const result = collector.extractConversation([]);
      expect(result).toEqual([]);
    });

    it('should handle messages without content field', () => {
      const messages = [
        { role: 'assistant' }, // No content field
        { role: 'assistant', content: 'D'.repeat(51) },
      ];

      const result = collector.extractConversation(messages as any);
      expect(result).toHaveLength(1);
    });
  });

  describe('collect', () => {
    it('should collect session context data', () => {
      const context = {
        messages: [
          { role: 'assistant', content: 'E'.repeat(51) },
          { role: 'assistant', content: 'F'.repeat(61) },
        ],
        workDirectory: '/test/dir',
        startTime: new Date('2024-01-01T10:00:00Z'),
      };

      const result = collector.collect(context);

      expect(result).toMatchObject({
        timestamp: expect.any(String),
        workDirectory: '/test/dir',
        startTime: '2024-01-01T10:00:00.000Z',
        endTime: expect.any(String),
        conversationHistory: [
          { role: 'assistant', content: 'E'.repeat(51) },
          { role: 'assistant', content: 'F'.repeat(61) },
        ],
      });
    });

    it('should handle missing startTime', () => {
      const context = {
        messages: [],
        workDirectory: '/test/dir',
      };

      const result = collector.collect(context as any);

      expect(result.startTime).toBe('unknown');
    });
  });
});

describe('FileCollector', () => {
  describe('collectFileChanges', () => {
    it('should return file changes from git status', async () => {
      const mockSimpleGit: any = {
        status: jest.fn(),
        cwd: jest.fn(),
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

      const collector = new FileCollector(mockSimpleGit);

      const result = await collector.collectFileChanges('/test/dir');

      expect(result).toMatchObject({
        modified: ['file1.ts', 'file2.ts'],
        created: ['file3.ts'],
        deleted: ['file4.ts'],
      });
    });

    it('should handle git errors gracefully', async () => {
      const mockSimpleGit: any = {
        status: jest.fn(),
        cwd: jest.fn(),
      };
      mockSimpleGit.status.mockRejectedValue(new Error('Git error'));

      const collector = new FileCollector(mockSimpleGit);

      const result = await collector.collectFileChanges('/test/dir');

      expect(result).toEqual({
        modified: [],
        created: [],
        deleted: [],
      });
    });
  });

  describe('generateDiffSummary', () => {
    it('should generate diff summary for modified file', async () => {
      const mockSimpleGit: any = {
        diffSummary: jest.fn(),
        cwd: jest.fn(),
      };
      mockSimpleGit.diffSummary.mockResolvedValue({
        files: [
          { file: 'test.ts', changes: 5, insertions: 3, deletions: 2 },
        ],
      });

      const collector = new FileCollector(mockSimpleGit);

      const result = await collector.generateDiffSummary('/test/dir', 'test.ts');

      expect(result).toBe('+3 -2 lines');
    });

    it('should return "N/A" on diff error', async () => {
      const mockSimpleGit: any = {
        diffSummary: jest.fn(),
        cwd: jest.fn(),
      };
      mockSimpleGit.diffSummary.mockRejectedValue(new Error('Diff error'));

      const collector = new FileCollector(mockSimpleGit);

      const result = await collector.generateDiffSummary('/test/dir', 'test.ts');

      expect(result).toBe('N/A');
    });
  });
});

describe('GitCollector', () => {
  describe('getGitStatus', () => {
    it('should return git status', async () => {
      const mockSimpleGit: any = {
        status: jest.fn(),
        cwd: jest.fn(),
      };
      mockSimpleGit.status.mockResolvedValue({
        current: 'main',
        tracking: 'origin/main',
        files: [],
        created: [],
        modified: [],
        deleted: [],
      });

      const collector = new GitCollector(mockSimpleGit);

      const result = await collector.getGitStatus('/test/dir');

      expect(result).toMatchObject({
        current: 'main',
        tracking: 'origin/main',
        status: 'unavailable',
      });
    });

    it('should return "unavailable" on git error', async () => {
      const mockSimpleGit: any = {
        status: jest.fn(),
        cwd: jest.fn(),
      };
      mockSimpleGit.status.mockRejectedValue(new Error('Not a git repo'));

      const collector = new GitCollector(mockSimpleGit);

      const result = await collector.getGitStatus('/test/dir');

      expect(result).toEqual({
        current: 'unavailable',
        tracking: 'unavailable',
        status: 'unavailable',
      });
    });
  });

  describe('getRecentCommits', () => {
    it('should return recent commits', async () => {
      const mockSimpleGit: any = {
        log: jest.fn(),
        cwd: jest.fn(),
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

      const collector = new GitCollector(mockSimpleGit);

      const result = await collector.getRecentCommits('/test/dir', 2);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        hash: 'abc123',
        message: 'Test commit',
        author: 'Test Author',
        date: '2024-01-01',
      });
    });

    it('should return "unavailable" on git error', async () => {
      const mockSimpleGit: any = {
        log: jest.fn(),
        cwd: jest.fn(),
      };
      mockSimpleGit.log.mockRejectedValue(new Error('Git error'));

      const collector = new GitCollector(mockSimpleGit);

      const result = await collector.getRecentCommits('/test/dir', 5);

      expect(result).toEqual(['unavailable']);
    });

    it('should use default count of 5 when not specified', async () => {
      const mockSimpleGit: any = {
        log: jest.fn(),
        cwd: jest.fn(),
      };
      mockSimpleGit.log.mockResolvedValue({
        latest: null,
        all: [],
      });

      const collector = new GitCollector(mockSimpleGit);

      await collector.getRecentCommits('/test/dir');

      expect(mockSimpleGit.log).toHaveBeenCalledWith({ maxCount: 5 });
    });
  });

  describe('collect', () => {
    it('should collect git status and commits', async () => {
      const mockSimpleGit: any = {
        status: jest.fn(),
        log: jest.fn(),
        cwd: jest.fn(),
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

      const collector = new GitCollector(mockSimpleGit);

      const result = await collector.collect('/test/dir');

      expect(result).toMatchObject({
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
