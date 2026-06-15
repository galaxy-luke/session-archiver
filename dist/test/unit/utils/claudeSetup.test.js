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
const globals_1 = require("@jest/globals");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const claudeSetup_1 = require("../../../src/utils/claudeSetup");
// Mock fs module
jest.mock('fs');
const mockFs = fs;
// Mock os module for home directory
jest.mock('os');
const mockOs = os;
(0, globals_1.describe)('Claude Code Setup Utilities', () => {
    const mockHomeDir = '/mock/home/dir';
    const mockSettingsPath = path.join(mockHomeDir, '.claude', 'settings.json');
    const mockSettingsDir = path.dirname(mockSettingsPath);
    // Store original console methods
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    (0, globals_1.beforeEach)(() => {
        // Set up mocks
        mockOs.homedir.mockReturnValue(mockHomeDir);
        mockFs.existsSync.mockReturnValue(false);
        mockFs.mkdirSync.mockImplementation();
        mockFs.readFileSync.mockReturnValue('{}');
        mockFs.writeFileSync.mockImplementation();
        // Mock console methods to avoid cluttering test output
        console.log = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();
    });
    (0, globals_1.afterEach)(() => {
        // Restore original console methods
        console.log = originalConsoleLog;
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
        // Clear all mocks
        jest.clearAllMocks();
    });
    (0, globals_1.describe)('setupClaudeHooks', () => {
        (0, globals_1.it)('should create .claude directory if it does not exist', () => {
            // Mock directory does not exist
            mockFs.existsSync.mockImplementation((path) => {
                return path !== mockSettingsDir && path !== mockSettingsPath;
            });
            (0, claudeSetup_1.setupClaudeHooks)();
            (0, globals_1.expect)(mockFs.mkdirSync).toHaveBeenCalledWith(mockSettingsDir, { recursive: true });
            (0, globals_1.expect)(mockFs.writeFileSync).toHaveBeenCalled();
        });
        (0, globals_1.it)('should create new settings file with defaults when none exists', () => {
            // Mock no existing file or directory
            mockFs.existsSync.mockReturnValue(false);
            (0, claudeSetup_1.setupClaudeHooks)();
            (0, globals_1.expect)(mockFs.mkdirSync).toHaveBeenCalledWith(mockSettingsDir, { recursive: true });
            (0, globals_1.expect)(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
            const writtenData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1]);
            (0, globals_1.expect)(writtenData.hooks.sessionEnd).toEqual({
                command: 'session-archiver',
                args: ['generate'],
                enabled: true
            });
            (0, globals_1.expect)(writtenData.hooks.sessionStart).toEqual({
                command: 'session-archiver',
                args: ['daemon', 'ensure'],
                enabled: true
            });
            (0, globals_1.expect)(writtenData.env.ANTHROPIC_AUTH_TOKEN).toBe('your_token_here');
            (0, globals_1.expect)(writtenData.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe('glm-4.7-flash');
        });
        (0, globals_1.it)('should preserve existing settings when updating', () => {
            const existingSettings = {
                hooks: {
                    sessionEnd: {
                        command: 'other-command',
                        args: ['other', 'args'],
                        enabled: false
                    }
                },
                env: {
                    ANTHROPIC_AUTH_TOKEN: 'existing_token',
                    CUSTOM_VAR: 'custom_value'
                }
            };
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(existingSettings));
            (0, claudeSetup_1.setupClaudeHooks)();
            const writtenData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1]);
            // Should update hooks
            (0, globals_1.expect)(writtenData.hooks.sessionEnd).toEqual({
                command: 'session-archiver',
                args: ['generate'],
                enabled: true
            });
            (0, globals_1.expect)(writtenData.hooks.sessionStart).toEqual({
                command: 'session-archiver',
                args: ['daemon', 'ensure'],
                enabled: true
            });
            // Should preserve existing token
            (0, globals_1.expect)(writtenData.env.ANTHROPIC_AUTH_TOKEN).toBe('existing_token');
            // Should preserve custom variables
            (0, globals_1.expect)(writtenData.env.CUSTOM_VAR).toBe('custom_value');
            // Should add missing model
            (0, globals_1.expect)(writtenData.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe('glm-4.7-flash');
        });
        (0, globals_1.it)('should add ANTHROPIC_AUTH_TOKEN placeholder if not exists', () => {
            const existingSettings = {
                env: {
                    ANTHROPIC_DEFAULT_HAIKU_MODEL: 'existing-model'
                }
            };
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(existingSettings));
            (0, claudeSetup_1.setupClaudeHooks)();
            const writtenData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1]);
            (0, globals_1.expect)(writtenData.env.ANTHROPIC_AUTH_TOKEN).toBe('your_token_here');
            (0, globals_1.expect)(writtenData.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe('existing-model');
        });
        (0, globals_1.it)('should add ANTHROPIC_DEFAULT_HAIKU_MODEL if not exists', () => {
            const existingSettings = {
                env: {
                    ANTHROPIC_AUTH_TOKEN: 'my_token'
                }
            };
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(existingSettings));
            (0, claudeSetup_1.setupClaudeHooks)();
            const writtenData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1]);
            (0, globals_1.expect)(writtenData.env.ANTHROPIC_AUTH_TOKEN).toBe('my_token');
            (0, globals_1.expect)(writtenData.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe('glm-4.7-flash');
        });
        (0, globals_1.it)('should write settings with proper formatting', () => {
            mockFs.existsSync.mockReturnValue(false);
            (0, claudeSetup_1.setupClaudeHooks)();
            (0, globals_1.expect)(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
            const writeCall = mockFs.writeFileSync.mock.calls[0];
            (0, globals_1.expect)(writeCall[0]).toBe(mockSettingsPath);
            (0, globals_1.expect)(writeCall[2]).toBe('utf-8');
            // Verify JSON is formatted with 2-space indentation
            const writtenString = writeCall[1];
            (0, globals_1.expect)(writtenString).toContain('  "command"'); // Should have 2-space indentation
            (0, globals_1.expect)(writtenString).toContain('\n'); // Should have newlines for formatting
        });
        (0, globals_1.it)('should handle corrupted existing settings file gracefully', () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue('invalid json {{{');
            (0, claudeSetup_1.setupClaudeHooks)();
            // Should create fresh settings
            const writtenData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1]);
            (0, globals_1.expect)(writtenData.hooks.sessionEnd).toBeDefined();
            (0, globals_1.expect)(writtenData.hooks.sessionStart).toBeDefined();
            (0, globals_1.expect)(writtenData.env).toBeDefined();
            // Should have warned about parse error
            (0, globals_1.expect)(console.warn).toHaveBeenCalledWith(globals_1.expect.stringContaining('Could not parse existing settings.json'));
        });
        (0, globals_1.it)('should print success message and settings path', () => {
            mockFs.existsSync.mockReturnValue(false);
            (0, claudeSetup_1.setupClaudeHooks)();
            (0, globals_1.expect)(console.log).toHaveBeenCalledWith('✅ Claude Code hooks configured');
            (0, globals_1.expect)(console.log).toHaveBeenCalledWith(`   Settings file: ${mockSettingsPath}`);
        });
        (0, globals_1.it)('should print warning when token needs to be updated', () => {
            mockFs.existsSync.mockReturnValue(false);
            (0, claudeSetup_1.setupClaudeHooks)();
            const logCalls = console.log;
            const warningCalls = logCalls.mock.calls.filter(call => call[0] && typeof call[0] === 'string' && call[0].includes('WARNING'));
            (0, globals_1.expect)(warningCalls.length).toBeGreaterThan(0);
            (0, globals_1.expect)(logCalls).toHaveBeenCalledWith(globals_1.expect.stringContaining('Please update ANTHROPIC_AUTH_TOKEN'));
        });
        (0, globals_1.it)('should not print token warning when token is already set', () => {
            const existingSettings = {
                env: {
                    ANTHROPIC_AUTH_TOKEN: 'actual_token_12345'
                }
            };
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(existingSettings));
            (0, claudeSetup_1.setupClaudeHooks)();
            const logCalls = console.log;
            const warningCalls = logCalls.mock.calls.filter(call => call[0] && typeof call[0] === 'string' && call[0].includes('WARNING'));
            (0, globals_1.expect)(warningCalls.length).toBe(0);
        });
        (0, globals_1.it)('should print hooks information', () => {
            mockFs.existsSync.mockReturnValue(false);
            (0, claudeSetup_1.setupClaudeHooks)();
            (0, globals_1.expect)(console.log).toHaveBeenCalledWith(globals_1.expect.stringContaining('sessionEnd: Runs "session-archiver generate"'));
            (0, globals_1.expect)(console.log).toHaveBeenCalledWith(globals_1.expect.stringContaining('sessionStart: Runs "session-archiver daemon ensure"'));
        });
        (0, globals_1.it)('should initialize hooks and env objects if missing', () => {
            const existingSettings = {
                customField: 'value'
            };
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(existingSettings));
            (0, claudeSetup_1.setupClaudeHooks)();
            const writtenData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1]);
            (0, globals_1.expect)(writtenData.hooks).toBeDefined();
            (0, globals_1.expect)(writtenData.env).toBeDefined();
            (0, globals_1.expect)(writtenData.customField).toBe('value');
        });
        (0, globals_1.it)('should handle empty existing settings object', () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue('{}');
            (0, claudeSetup_1.setupClaudeHooks)();
            const writtenData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1]);
            (0, globals_1.expect)(writtenData.hooks.sessionEnd).toBeDefined();
            (0, globals_1.expect)(writtenData.hooks.sessionStart).toBeDefined();
            (0, globals_1.expect)(writtenData.env.ANTHROPIC_AUTH_TOKEN).toBeDefined();
            (0, globals_1.expect)(writtenData.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBeDefined();
        });
    });
});
//# sourceMappingURL=claudeSetup.test.js.map