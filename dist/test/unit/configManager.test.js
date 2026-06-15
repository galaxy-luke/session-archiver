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
const configManager_1 = require("../../src/utils/configManager");
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
// Mock fs module
jest.mock('fs');
const mockFs = fs;
// Mock os module for home directory
jest.mock('os');
const mockOs = os;
describe('ConfigManager', () => {
    let configManager;
    let mockProjectRoot;
    let mockGlobalConfigPath;
    let mockProjectConfigPath;
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
        configManager = new configManager_1.ConfigManager(mockProjectRoot);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('ensureProjectConfigDir', () => {
        it('should create project config directory if it does not exist', () => {
            mockFs.existsSync.mockReturnValue(false);
            configManager.ensureProjectConfigDir();
            expect(mockFs.mkdirSync).toHaveBeenCalledWith(path.join(mockProjectRoot, '.project-config'), { recursive: true });
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
            expect(mockFs.readFileSync).toHaveBeenCalledWith(mockProjectConfigPath, 'utf-8');
        });
        it('should throw error if config file does not exist', () => {
            mockFs.existsSync.mockReturnValue(false);
            expect(() => configManager.loadProjectConfig()).toThrow('Project config file not found');
        });
        it('should throw error if config is invalid JSON', () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue('invalid json');
            expect(() => configManager.loadProjectConfig()).toThrow();
        });
    });
    describe('saveProjectConfig', () => {
        it('should save config to project config file', () => {
            const mockConfig = {
                projectName: 'test-project',
                obsidian: { vaultPath: '/vault' },
                ai: { model: 'claude-3-5-sonnet-20241022' },
                archiving: {},
                daemon: {},
                templates: {}
            };
            configManager.saveProjectConfig(mockConfig);
            expect(mockFs.mkdirSync).toHaveBeenCalledWith(path.join(mockProjectRoot, '.project-config'), { recursive: true });
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(mockProjectConfigPath, JSON.stringify(mockConfig, null, 2), 'utf-8');
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
            expect(mockFs.readFileSync).toHaveBeenCalledWith(mockGlobalConfigPath, 'utf-8');
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
            const projectConfig = {
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
            const projectConfig = {
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
            const validConfig = {
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
            };
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
            };
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
            };
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
            };
            const result = configManager.validateConfig(invalidConfig);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
            expect(result.errors).toContain('projectName is required');
            expect(result.errors).toContain('obsidian.vaultPath is required');
            expect(result.errors).toContain('ai.model is required');
        });
    });
});
//# sourceMappingURL=configManager.test.js.map