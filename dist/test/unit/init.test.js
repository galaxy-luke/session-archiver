"use strict";
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
// Mock inquirer BEFORE importing modules
const mockInquirerPrompt = jest.fn();
jest.mock('inquirer', () => ({
    __esModule: true,
    default: {
        prompt: mockInquirerPrompt
    },
    prompt: mockInquirerPrompt
}));
const init_1 = require("../../src/cli/init");
const configManager_1 = require("../../src/utils/configManager");
const fs = __importStar(require("fs"));
// Mock dependencies
jest.mock('../../src/utils/configManager');
jest.mock('fs');
jest.mock('../../src/utils/promptHelper');
const MockConfigManager = configManager_1.ConfigManager;
const mockFs = fs;
const { promptForProjectConfig, buildConfigFromAnswers } = require('../../src/utils/promptHelper');
describe('init command', () => {
    let mockConfigManagerInstance;
    let consoleLogSpy;
    let consoleErrorSpy;
    let processExitSpy;
    beforeEach(() => {
        // Set up mocks
        mockConfigManagerInstance = {
            projectConfigExists: jest.fn(),
            loadProjectConfig: jest.fn(),
            saveProjectConfig: jest.fn(),
            validateConfig: jest.fn(),
            getProjectConfigPath: jest.fn().mockReturnValue('/test/project/.project-config/session-archiver.json'),
            ensureProjectConfigDir: jest.fn()
        };
        MockConfigManager.mockImplementation(() => mockConfigManagerInstance);
        mockFs.existsSync.mockReturnValue(false);
        // Spy on console and process
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`process.exit called with ${code}`);
        });
    });
    afterEach(() => {
        jest.clearAllMocks();
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
    });
    describe('when config does not exist', () => {
        it('should prompt for configuration and save it', async () => {
            mockConfigManagerInstance.projectConfigExists.mockReturnValue(false);
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
            const mockConfig = {
                projectName: 'test-project',
                obsidian: {
                    vaultPath: '/path/to/vault',
                    attachmentFolder: 'attachments',
                    dateFormat: 'YYYY-MM-DD'
                },
                ai: {
                    model: 'claude-3-5-sonnet-20241022',
                    maxTokens: 4096,
                    temperature: 0.7
                },
                archiving: {},
                daemon: {
                    enabled: true,
                    checkInterval: 60,
                    idleTimeout: 300
                },
                templates: {
                    sessionNote: 'default',
                    summaryTemplate: 'default',
                    tagsTemplate: 'default'
                }
            };
            promptForProjectConfig.mockResolvedValue(mockAnswers);
            buildConfigFromAnswers.mockReturnValue(mockConfig);
            mockConfigManagerInstance.validateConfig.mockReturnValue({ isValid: true, errors: [] });
            // Execute the command
            await (0, init_1.handleInitCommand)();
            // Verify prompts were called
            expect(promptForProjectConfig).toHaveBeenCalled();
            // Verify config was built
            expect(buildConfigFromAnswers).toHaveBeenCalledWith(mockAnswers);
            // Verify validation
            expect(mockConfigManagerInstance.validateConfig).toHaveBeenCalledWith(mockConfig);
            // Verify config was saved
            expect(mockConfigManagerInstance.saveProjectConfig).toHaveBeenCalledWith(mockConfig);
            // Verify success message
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Configuration initialized successfully'));
        });
        it('should display validation errors if config is invalid', async () => {
            mockConfigManagerInstance.projectConfigExists.mockReturnValue(false);
            const mockAnswers = {
                projectName: '',
                vaultPath: '',
                aiModel: '',
                attachmentFolder: '',
                dateFormat: '',
                maxTokens: 0,
                temperature: 0,
                enableDaemon: false,
                checkInterval: 0,
                idleTimeout: 0,
                sessionNoteTemplate: '',
                summaryTemplate: '',
                tagsTemplate: ''
            };
            const mockConfig = { projectName: '' };
            promptForProjectConfig.mockResolvedValue(mockAnswers);
            buildConfigFromAnswers.mockReturnValue(mockConfig);
            mockConfigManagerInstance.validateConfig.mockReturnValue({
                isValid: false,
                errors: ['projectName is required', 'obsidian.vaultPath is required']
            });
            try {
                await (0, init_1.handleInitCommand)();
                fail('Should have thrown an error');
            }
            catch (error) {
                // Verify error was logged
                expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Configuration validation failed'));
                expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('projectName is required'));
                expect(processExitSpy).toHaveBeenCalledWith(1);
            }
        });
    });
    describe('when config exists', () => {
        it('should prompt for overwrite confirmation', async () => {
            mockConfigManagerInstance.projectConfigExists.mockReturnValue(true);
            mockConfigManagerInstance.loadProjectConfig.mockReturnValue({
                projectName: 'existing-project',
                obsidian: { vaultPath: '/existing/vault' },
                ai: { model: 'claude-3-5-sonnet-20241022' },
                archiving: {},
                daemon: {},
                templates: {}
            });
            // Mock inquirer for overwrite prompt
            const inquirer = require('inquirer');
            jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ overwrite: false });
            await (0, init_1.handleInitCommand)();
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Configuration initialization cancelled'));
        });
        it('should overwrite config when user confirms', async () => {
            mockConfigManagerInstance.projectConfigExists.mockReturnValue(true);
            mockConfigManagerInstance.loadProjectConfig.mockReturnValue({
                projectName: 'existing-project',
                obsidian: { vaultPath: '/existing/vault' },
                ai: { model: 'claude-3-5-sonnet-20241022' },
                archiving: {},
                daemon: {},
                templates: {}
            });
            // Mock inquirer for overwrite prompt - first call for overwrite, second for config
            const inquirer = require('inquirer');
            jest.spyOn(inquirer, 'prompt')
                .mockResolvedValueOnce({ overwrite: true })
                .mockResolvedValueOnce({
                projectName: 'new-project',
                vaultPath: '/new/vault',
                aiModel: 'claude-3-5-sonnet-20241022',
                attachmentFolder: '',
                dateFormat: '',
                maxTokens: 0,
                temperature: 0,
                enableDaemon: false,
                checkInterval: 0,
                idleTimeout: 0,
                sessionNoteTemplate: '',
                summaryTemplate: '',
                tagsTemplate: ''
            });
            const mockConfig = {
                projectName: 'new-project',
                obsidian: { vaultPath: '/new/vault' },
                ai: { model: 'claude-3-5-sonnet-20241022' },
                archiving: {},
                daemon: {},
                templates: {}
            };
            promptForProjectConfig.mockResolvedValue({
                projectName: 'new-project',
                vaultPath: '/new/vault',
                aiModel: 'claude-3-5-sonnet-20241022',
                attachmentFolder: '',
                dateFormat: '',
                maxTokens: 0,
                temperature: 0,
                enableDaemon: false,
                checkInterval: 0,
                idleTimeout: 0,
                sessionNoteTemplate: '',
                summaryTemplate: '',
                tagsTemplate: ''
            });
            buildConfigFromAnswers.mockReturnValue(mockConfig);
            mockConfigManagerInstance.validateConfig.mockReturnValue({ isValid: true, errors: [] });
            await (0, init_1.handleInitCommand)();
            expect(mockConfigManagerInstance.saveProjectConfig).toHaveBeenCalledWith(mockConfig);
        });
    });
    describe('error handling', () => {
        it('should handle errors during config saving', async () => {
            mockConfigManagerInstance.projectConfigExists.mockReturnValue(false);
            const mockAnswers = {
                projectName: 'test-project',
                vaultPath: '/path/to/vault',
                aiModel: 'claude-3-5-sonnet-20241022',
                attachmentFolder: '',
                dateFormat: '',
                maxTokens: 0,
                temperature: 0,
                enableDaemon: false,
                checkInterval: 0,
                idleTimeout: 0,
                sessionNoteTemplate: '',
                summaryTemplate: '',
                tagsTemplate: ''
            };
            const mockConfig = { projectName: 'test-project' };
            promptForProjectConfig.mockResolvedValue(mockAnswers);
            buildConfigFromAnswers.mockReturnValue(mockConfig);
            mockConfigManagerInstance.validateConfig.mockReturnValue({ isValid: true, errors: [] });
            mockConfigManagerInstance.saveProjectConfig.mockImplementation(() => {
                throw new Error('Failed to save config');
            });
            try {
                await (0, init_1.handleInitCommand)();
                fail('Should have thrown an error');
            }
            catch (error) {
                expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save configuration:', expect.any(Error));
                expect(processExitSpy).toHaveBeenCalledWith(1);
            }
        });
    });
});
//# sourceMappingURL=init.test.js.map