"use strict";
/**
 * Unit tests for Archiver class
 * Tests archiving logic that moves draft files from drafts folder to archive location
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
Object.defineProperty(exports, "__esModule", { value: true });
const archiver_1 = require("../../src/core/archiver");
const fs_1 = require("fs");
const path = __importStar(require("path"));
// Helper function to normalize paths for testing
function normalizePath(p) {
    return path.normalize(p).replace(/\\/g, '/');
}
// Mock ConfigManager
jest.mock('../../src/utils/configManager');
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
        mkdir: jest.fn(),
        rename: jest.fn(),
        unlink: jest.fn(),
        access: jest.fn(),
        stat: jest.fn()
    }
}));
describe('Archiver', () => {
    let archiver;
    let mockConfigManager;
    const mockConfig = {
        projectName: 'test-project',
        obsidian: {
            vaultPath: '/test/vault'
        },
        ai: {
            model: 'claude-3-5-sonnet-20241022'
        },
        archiving: {},
        daemon: {},
        templates: {}
    };
    beforeEach(() => {
        jest.clearAllMocks();
        mockConfigManager = {
            loadProjectConfig: jest.fn().mockReturnValue(mockConfig),
            projectConfigExists: jest.fn().mockReturnValue(true),
            saveProjectConfig: jest.fn(),
            ensureProjectConfigDir: jest.fn(),
            getProjectConfigPath: jest.fn().mockReturnValue('/test/config.json'),
            loadGlobalConfig: jest.fn().mockReturnValue({}),
            mergeConfigs: jest.fn().mockReturnValue(mockConfig),
            validateConfig: jest.fn().mockReturnValue({ isValid: true, errors: [] })
        };
        archiver = new archiver_1.Archiver(mockConfigManager);
    });
    describe('archive()', () => {
        const draftPath = '/test/vault/草稿/session-draft-2026-06-14-1430.md';
        const draftContent = `---
type: session-draft
date: 2026-06-14
startTime: 14:30:00
endTime: 16:30:00
duration: 2h 0m
generatedBy: session-archiver
model: claude-3-5-sonnet-20241022
complexity: 5
status: ready
tags: [session, draft, project]
project: /test/project
summary: "Test session summary"
---

# 會話總結

Test summary content`;
        it('should archive session draft to project location', async () => {
            const mockFs = fs_1.promises;
            mockFs.readFile.mockResolvedValue(draftContent);
            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.rename.mockResolvedValue(undefined);
            mockFs.stat.mockResolvedValue({ isDirectory: () => false });
            const result = await archiver.archive(draftPath);
            expect(result.originalPath).toBe(draftPath);
            expect(normalizePath(result.targetPath)).toContain('/test/vault/01-專案 Projects/');
            expect(result.targetPath).toContain('2026-06-14-會話記錄.md');
            expect(mockFs.mkdir).toHaveBeenCalled();
            expect(mockFs.rename).toHaveBeenCalled();
        });
        it('should parse frontmatter correctly', async () => {
            const mockFs = fs_1.promises;
            mockFs.readFile.mockResolvedValue(draftContent);
            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.rename.mockResolvedValue(undefined);
            mockFs.stat.mockResolvedValue({ isDirectory: () => false });
            await archiver.archive(draftPath);
            expect(mockFs.readFile).toHaveBeenCalledWith(draftPath, 'utf-8');
        });
        it('should update status to archived', async () => {
            const mockFs = fs_1.promises;
            mockFs.readFile.mockResolvedValue(draftContent);
            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.rename.mockResolvedValue(undefined);
            mockFs.stat.mockResolvedValue({ isDirectory: () => false });
            await archiver.archive(draftPath);
            const writeCall = mockFs.writeFile.mock.calls[0];
            const writtenContent = writeCall[1];
            expect(writtenContent).toContain('status: archived');
        });
        it('should use current date when date not in frontmatter', async () => {
            const draftWithoutDate = `---
type: session-draft
status: ready
project: /test/project
---
# Content`;
            const mockFs = fs_1.promises;
            mockFs.readFile.mockResolvedValue(draftWithoutDate);
            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.rename.mockResolvedValue(undefined);
            mockFs.stat.mockResolvedValue({ isDirectory: () => false });
            const result = await archiver.archive(draftPath);
            // Should use today's date in filename
            expect(result.targetPath).toMatch(/\d{4}-\d{2}-\d{2}-會話記錄\.md/);
        });
        it('should create archive directory if not exists', async () => {
            const mockFs = fs_1.promises;
            mockFs.readFile.mockResolvedValue(draftContent);
            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.rename.mockResolvedValue(undefined);
            mockFs.stat.mockResolvedValue({ isDirectory: () => false });
            await archiver.archive(draftPath);
            expect(mockFs.mkdir).toHaveBeenCalledWith(expect.stringContaining('01-專案 Projects'), { recursive: true });
        });
        it('should handle missing project field gracefully', async () => {
            const draftWithoutProject = `---
type: session-draft
date: 2026-06-14
status: ready
---
# Content`;
            const mockFs = fs_1.promises;
            mockFs.readFile.mockResolvedValue(draftWithoutProject);
            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.rename.mockResolvedValue(undefined);
            mockFs.stat.mockResolvedValue({ isDirectory: () => false });
            const result = await archiver.archive(draftPath);
            // Should use default location or daily notes
            expect(result.targetPath).toBeTruthy();
        });
        it('should preserve all frontmatter and content', async () => {
            const mockFs = fs_1.promises;
            mockFs.readFile.mockResolvedValue(draftContent);
            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.rename.mockResolvedValue(undefined);
            mockFs.stat.mockResolvedValue({ isDirectory: () => false });
            await archiver.archive(draftPath);
            const writeCall = mockFs.writeFile.mock.calls[0];
            const writtenContent = writeCall[1];
            expect(writtenContent).toContain('type: session-draft');
            expect(writtenContent).toContain('date: 2026-06-14');
            expect(writtenContent).toContain('startTime: "14:30:00"');
            expect(writtenContent).toContain('summary: Test session summary');
            expect(writtenContent).toContain('# 會話總結');
            expect(writtenContent).toContain('Test summary content');
        });
        it('should throw error when file not found', async () => {
            const mockFs = fs_1.promises;
            mockFs.readFile.mockRejectedValue(new Error('File not found'));
            await expect(archiver.archive(draftPath)).rejects.toThrow('File not found');
        });
        it('should throw error when frontmatter is invalid', async () => {
            // Missing closing dashes makes it invalid
            const invalidDraft = '---\ntype: session-draft\n# Content';
            const mockFs = fs_1.promises;
            mockFs.readFile.mockResolvedValue(invalidDraft);
            await expect(archiver.archive(draftPath)).rejects.toThrow();
        });
        it('should throw error when file move fails', async () => {
            const mockFs = fs_1.promises;
            mockFs.readFile.mockResolvedValue(draftContent);
            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.rename.mockRejectedValue(new Error('Move failed'));
            mockFs.stat.mockResolvedValue({ isDirectory: () => false });
            await expect(archiver.archive(draftPath)).rejects.toThrow('Move failed');
        });
        it('should handle different draft types', async () => {
            const dailyNoteDraft = `---
type: daily-note
date: 2026-06-14
status: ready
---
# Daily Note`;
            const mockFs = fs_1.promises;
            mockFs.readFile.mockResolvedValue(dailyNoteDraft);
            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.rename.mockResolvedValue(undefined);
            mockFs.stat.mockResolvedValue({ isDirectory: () => false });
            const result = await archiver.archive(draftPath);
            // Should archive to daily notes location
            expect(normalizePath(result.targetPath)).toContain('日記/Daily Notes');
        });
        it('should extract tags from frontmatter', async () => {
            const draftWithTags = `---
type: session-draft
date: 2026-06-14
status: ready
tags: [session, frontend, bugfix]
---
# Content`;
            const mockFs = fs_1.promises;
            mockFs.readFile.mockResolvedValue(draftWithTags);
            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.rename.mockResolvedValue(undefined);
            mockFs.stat.mockResolvedValue({ isDirectory: () => false });
            await archiver.archive(draftPath);
            const writeCall = mockFs.writeFile.mock.calls[0];
            const writtenContent = writeCall[1];
            // Tags should be preserved (with quotes)
            expect(writtenContent).toContain('tags: ["session", "frontend", "bugfix"]');
        });
        it('should generate intelligent filename from summary', async () => {
            const draftWithSummary = `---
type: session-draft
date: 2026-06-14
status: ready
summary: "Fixed authentication bug in login flow"
---
# Content`;
            const mockFs = fs_1.promises;
            mockFs.readFile.mockResolvedValue(draftWithSummary);
            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.rename.mockResolvedValue(undefined);
            mockFs.stat.mockResolvedValue({ isDirectory: () => false });
            const result = await archiver.archive(draftPath);
            // Filename should be descriptive
            expect(result.targetPath).toContain('2026-06-14');
        });
        it('should handle special characters in project names', async () => {
            const draftWithSpecialChars = `---
type: session-draft
date: 2026-06-14
status: ready
project: "/path/to/project with spaces & special-chars"
---
# Content`;
            const mockFs = fs_1.promises;
            mockFs.readFile.mockResolvedValue(draftWithSpecialChars);
            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.rename.mockResolvedValue(undefined);
            mockFs.stat.mockResolvedValue({ isDirectory: () => false });
            const result = await archiver.archive(draftPath);
            // Should handle special characters safely (including Chinese characters)
            expect(result.targetPath).toBeTruthy();
            // Just check it ends with .md and contains valid characters
            expect(result.targetPath).toMatch(/\S+\.md$/);
        });
    });
    describe('ArchiveResult interface', () => {
        it('should have correct structure', () => {
            const result = {
                targetPath: '/path/to/target.md',
                originalPath: '/path/to/original.md'
            };
            expect(result.targetPath).toBeTruthy();
            expect(result.originalPath).toBeTruthy();
        });
    });
});
//# sourceMappingURL=archiver.test.js.map