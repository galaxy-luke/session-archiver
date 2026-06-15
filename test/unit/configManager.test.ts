import { ConfigManager } from '../../src/utils/configManager';
import { SessionArchiverConfig } from '../../src/types/config';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock os module for home directory
jest.mock('os');
const mockOs = os as jest.Mocked<typeof os>;

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let mockProjectRoot: string;
  let mockGlobalConfigPath: string;
  let mockProjectConfigPath: string;

  beforeEach(() => {
    // Set up mocks
    mockProjectRoot = '/test/project';
    mockGlobalConfigPath = path.join('/home/user', '.session-archiver', 'config.json');
    mockProjectConfigPath = path.join(mockProjectRoot, '.project-config', 'session-archiver.json');

    mockOs.homedir.mockReturnValue('/home/user');
    mockFs.existsSync.mockReturnValue(false);
    mockFs.mkdirSync.mockImplementation();
    mockFs.readFileSync.mockReturnValue('{}');
    mockFs.writeFileSync.mockImplementation();

    configManager = new ConfigManager(mockProjectRoot);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureProjectConfigDir', () => {
    it('should create project config directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      configManager.ensureProjectConfigDir();

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        path.join(mockProjectRoot, '.project-config'),
        { recursive: true }
      );
    });

    it('should not create directory if it already exists', () => {
      mockFs.existsSync.mockReturnValue(true);

      configManager.ensureProjectConfigDir();

      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('getProjectConfigPath', () => {
    it('should return correct project config path', () => {
      const result = configManager.getProjectConfigPath();
      expect(result).toBe(mockProjectConfigPath);
    });
  });

  describe('projectConfigExists', () => {
    it('should return true when project config exists', () => {
      mockFs.existsSync.mockReturnValue(true);

      const result = configManager.projectConfigExists();
      expect(result).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalledWith(mockProjectConfigPath);
    });

    it('should return false when project config does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = configManager.projectConfigExists();
      expect(result).toBe(false);
    });
  });

  describe('loadProjectConfig', () => {
    it('should load and parse project config', () => {
      const mockConfig = {
        projectName: 'test-project',
        obsidian: { vaultPath: '/vault' },
        ai: { model: 'claude-3-5-sonnet-20241022' },
        archiving: {},
        daemon: {},
        templates: {}
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = configManager.loadProjectConfig();

      expect(result).toEqual(mockConfig);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        mockProjectConfigPath,
        'utf-8'
      );
    });

    it('should throw error if config file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(() => configManager.loadProjectConfig()).toThrow(
        'Project config file not found'
      );
    });

    it('should throw error if config is invalid JSON', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');

      expect(() => configManager.loadProjectConfig()).toThrow();
    });
  });

  describe('saveProjectConfig', () => {
    it('should save config to project config file', () => {
      const mockConfig: SessionArchiverConfig = {
        projectName: 'test-project',
        obsidian: { vaultPath: '/vault' },
        ai: { model: 'claude-3-5-sonnet-20241022' },
        archiving: {},
        daemon: {},
        templates: {}
      };

      configManager.saveProjectConfig(mockConfig);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        path.join(mockProjectRoot, '.project-config'),
        { recursive: true }
      );
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockProjectConfigPath,
        JSON.stringify(mockConfig, null, 2),
        'utf-8'
      );
    });
  });

  describe('loadGlobalConfig', () => {
    it('should load global config if it exists', () => {
      const mockGlobalConfig = {
        ai: {
          apiKey: 'test-key',
          model: 'claude-3-5-sonnet-20241022'
        }
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockGlobalConfig));

      const result = configManager.loadGlobalConfig();

      expect(result).toEqual(mockGlobalConfig);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        mockGlobalConfigPath,
        'utf-8'
      );
    });

    it('should return empty object if global config does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = configManager.loadGlobalConfig();

      expect(result).toEqual({});
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });
  });

  describe('mergeConfigs', () => {
    it('should merge global and project configs', () => {
      const globalConfig = {
        ai: {
          apiKey: 'global-key',
          model: 'claude-3-5-sonnet-20241022'
        }
      };

      const projectConfig: SessionArchiverConfig = {
        projectName: 'test-project',
        obsidian: { vaultPath: '/vault' },
        ai: { model: 'claude-3-5-sonnet-20241022' },
        archiving: {},
        daemon: {},
        templates: {}
      };

      const result = configManager.mergeConfigs(globalConfig, projectConfig);

      expect(result.projectName).toBe('test-project');
      expect(result.ai.apiKey).toBe('global-key');
      expect(result.ai.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should handle empty global config', () => {
      const projectConfig: SessionArchiverConfig = {
        projectName: 'test-project',
        obsidian: { vaultPath: '/vault' },
        ai: { model: 'claude-3-5-sonnet-20241022' },
        archiving: {},
        daemon: {},
        templates: {}
      };

      const result = configManager.mergeConfigs({}, projectConfig);

      expect(result).toEqual(projectConfig);
    });
  });

  describe('validateConfig', () => {
    it('should validate a correct config', () => {
      const validConfig: SessionArchiverConfig = {
        projectName: 'test-project',
        obsidian: { vaultPath: '/vault' },
        ai: { model: 'claude-3-5-sonnet-20241022' },
        archiving: {},
        daemon: {},
        templates: {}
      };

      const result = configManager.validateConfig(validConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject config missing projectName', () => {
      const invalidConfig = {
        obsidian: { vaultPath: '/vault' },
        ai: { model: 'claude-3-5-sonnet-20241022' },
        archiving: {},
        daemon: {},
        templates: {}
      } as any;

      const result = configManager.validateConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('projectName is required');
    });

    it('should reject config missing vaultPath', () => {
      const invalidConfig = {
        projectName: 'test-project',
        obsidian: {},
        ai: { model: 'claude-3-5-sonnet-20241022' },
        archiving: {},
        daemon: {},
        templates: {}
      } as any;

      const result = configManager.validateConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('obsidian.vaultPath is required');
    });

    it('should reject config missing AI model', () => {
      const invalidConfig = {
        projectName: 'test-project',
        obsidian: { vaultPath: '/vault' },
        ai: {},
        archiving: {},
        daemon: {},
        templates: {}
      } as any;

      const result = configManager.validateConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ai.model is required');
    });

    it('should collect multiple validation errors', () => {
      const invalidConfig = {
        projectName: '',
        obsidian: {},
        ai: {},
        archiving: {},
        daemon: {},
        templates: {}
      } as any;

      const result = configManager.validateConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('projectName is required');
      expect(result.errors).toContain('obsidian.vaultPath is required');
      expect(result.errors).toContain('ai.model is required');
    });
  });
});