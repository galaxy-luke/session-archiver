// Mock inquirer BEFORE importing modules
const mockInquirerPrompt = jest.fn();

jest.mock('inquirer', () => ({
  __esModule: true,
  default: {
    prompt: mockInquirerPrompt
  },
  prompt: mockInquirerPrompt
}));

import { initCommand, handleInitCommand } from '../../src/cli/init';
import { ConfigManager } from '../../src/utils/configManager';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('../../src/utils/configManager');
jest.mock('fs');
jest.mock('../../src/utils/promptHelper');

const MockConfigManager = ConfigManager as jest.MockedClass<typeof ConfigManager>;
const mockFs = fs as jest.Mocked<typeof fs>;
const { promptForProjectConfig, buildConfigFromAnswers } = require('../../src/utils/promptHelper');

describe('init command', () => {
  let mockConfigManagerInstance: jest.Mocked<ConfigManager>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    // Set up mocks
    mockConfigManagerInstance = {
      projectConfigExists: jest.fn(),
      loadProjectConfig: jest.fn(),
      saveProjectConfig: jest.fn(),
      validateConfig: jest.fn(),
      getProjectConfigPath: jest.fn().mockReturnValue('/test/project/.project-config/session-archiver.json'),
      ensureProjectConfigDir: jest.fn()
    } as any;

    MockConfigManager.mockImplementation(() => mockConfigManagerInstance);
    mockFs.existsSync.mockReturnValue(false);

    // Spy on console and process
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
      throw new Error(`process.exit called with ${code}`);
    }) as any;
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
      await handleInitCommand();

      // Verify prompts were called
      expect(promptForProjectConfig).toHaveBeenCalled();

      // Verify config was built
      expect(buildConfigFromAnswers).toHaveBeenCalledWith(mockAnswers);

      // Verify validation
      expect(mockConfigManagerInstance.validateConfig).toHaveBeenCalledWith(mockConfig);

      // Verify config was saved
      expect(mockConfigManagerInstance.saveProjectConfig).toHaveBeenCalledWith(mockConfig);

      // Verify success message
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Configuration initialized successfully')
      );
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
        await handleInitCommand();
        fail('Should have thrown an error');
      } catch (error) {
        // Verify error was logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Configuration validation failed')
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('projectName is required')
        );
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

      await handleInitCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Configuration initialization cancelled')
      );
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

      await handleInitCommand();

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
        await handleInitCommand();
        fail('Should have thrown an error');
      } catch (error) {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to save configuration:',
          expect.any(Error)
        );
        expect(processExitSpy).toHaveBeenCalledWith(1);
      }
    });
  });
});
