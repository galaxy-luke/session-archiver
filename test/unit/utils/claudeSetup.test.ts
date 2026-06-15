import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { setupClaudeHooks } from '../../../src/utils/claudeSetup';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock os module for home directory
jest.mock('os');
const mockOs = os as jest.Mocked<typeof os>;

describe('Claude Code Setup Utilities', () => {
  const mockHomeDir = '/mock/home/dir';
  const mockSettingsPath = path.join(mockHomeDir, '.claude', 'settings.json');
  const mockSettingsDir = path.dirname(mockSettingsPath);

  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Set up mocks
    mockOs.homedir.mockReturnValue(mockHomeDir);
    mockFs.existsSync.mockReturnValue(false);
    mockFs.mkdirSync.mockImplementation();
    mockFs.readFileSync.mockReturnValue('{}');
    mockFs.writeFileSync.mockImplementation();

    // Mock console methods to avoid cluttering test output
    console.log = jest.fn() as any;
    console.warn = jest.fn() as any;
    console.error = jest.fn() as any;
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('setupClaudeHooks', () => {
    it('should create .claude directory if it does not exist', () => {
      // Mock directory does not exist
      mockFs.existsSync.mockImplementation((path) => {
        return path !== mockSettingsDir && path !== mockSettingsPath;
      });

      setupClaudeHooks();

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(mockSettingsDir, { recursive: true });
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should create new settings file with defaults when none exists', () => {
      // Mock no existing file or directory
      mockFs.existsSync.mockReturnValue(false);

      setupClaudeHooks();

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(mockSettingsDir, { recursive: true });
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);

      const writtenData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1] as string);
      expect(writtenData.hooks.sessionEnd).toEqual({
        command: 'session-archiver',
        args: ['generate'],
        enabled: true
      });
      expect(writtenData.hooks.sessionStart).toEqual({
        command: 'session-archiver',
        args: ['daemon', 'ensure'],
        enabled: true
      });
      expect(writtenData.env.ANTHROPIC_AUTH_TOKEN).toBe('your_token_here');
      expect(writtenData.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe('glm-4.7-flash');
    });

    it('should preserve existing settings when updating', () => {
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

      setupClaudeHooks();

      const writtenData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1] as string);

      // Should update hooks
      expect(writtenData.hooks.sessionEnd).toEqual({
        command: 'session-archiver',
        args: ['generate'],
        enabled: true
      });
      expect(writtenData.hooks.sessionStart).toEqual({
        command: 'session-archiver',
        args: ['daemon', 'ensure'],
        enabled: true
      });

      // Should preserve existing token
      expect(writtenData.env.ANTHROPIC_AUTH_TOKEN).toBe('existing_token');

      // Should preserve custom variables
      expect(writtenData.env.CUSTOM_VAR).toBe('custom_value');

      // Should add missing model
      expect(writtenData.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe('glm-4.7-flash');
    });

    it('should add ANTHROPIC_AUTH_TOKEN placeholder if not exists', () => {
      const existingSettings = {
        env: {
          ANTHROPIC_DEFAULT_HAIKU_MODEL: 'existing-model'
        }
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingSettings));

      setupClaudeHooks();

      const writtenData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1] as string);
      expect(writtenData.env.ANTHROPIC_AUTH_TOKEN).toBe('your_token_here');
      expect(writtenData.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe('existing-model');
    });

    it('should add ANTHROPIC_DEFAULT_HAIKU_MODEL if not exists', () => {
      const existingSettings = {
        env: {
          ANTHROPIC_AUTH_TOKEN: 'my_token'
        }
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingSettings));

      setupClaudeHooks();

      const writtenData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1] as string);
      expect(writtenData.env.ANTHROPIC_AUTH_TOKEN).toBe('my_token');
      expect(writtenData.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe('glm-4.7-flash');
    });

    it('should write settings with proper formatting', () => {
      mockFs.existsSync.mockReturnValue(false);

      setupClaudeHooks();

      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
      const writeCall = mockFs.writeFileSync.mock.calls[0];
      expect(writeCall[0]).toBe(mockSettingsPath);
      expect(writeCall[2]).toBe('utf-8');

      // Verify JSON is formatted with 2-space indentation
      const writtenString = writeCall[1] as string;
      expect(writtenString).toContain('  "command"'); // Should have 2-space indentation
      expect(writtenString).toContain('\n'); // Should have newlines for formatting
    });

    it('should handle corrupted existing settings file gracefully', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json {{{');

      setupClaudeHooks();

      // Should create fresh settings
      const writtenData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1] as string);
      expect(writtenData.hooks.sessionEnd).toBeDefined();
      expect(writtenData.hooks.sessionStart).toBeDefined();
      expect(writtenData.env).toBeDefined();

      // Should have warned about parse error
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Could not parse existing settings.json')
      );
    });

    it('should print success message and settings path', () => {
      mockFs.existsSync.mockReturnValue(false);

      setupClaudeHooks();

      expect(console.log).toHaveBeenCalledWith('✅ Claude Code hooks configured');
      expect(console.log).toHaveBeenCalledWith(`   Settings file: ${mockSettingsPath}`);
    });

    it('should print warning when token needs to be updated', () => {
      mockFs.existsSync.mockReturnValue(false);

      setupClaudeHooks();

      const logCalls = console.log as jest.MockedFunction<typeof console.log>;
      const warningCalls = logCalls.mock.calls.filter(call =>
        call[0] && typeof call[0] === 'string' && call[0].includes('WARNING')
      );

      expect(warningCalls.length).toBeGreaterThan(0);
      expect(logCalls).toHaveBeenCalledWith(
        expect.stringContaining('Please update ANTHROPIC_AUTH_TOKEN')
      );
    });

    it('should not print token warning when token is already set', () => {
      const existingSettings = {
        env: {
          ANTHROPIC_AUTH_TOKEN: 'actual_token_12345'
        }
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingSettings));

      setupClaudeHooks();

      const logCalls = console.log as jest.MockedFunction<typeof console.log>;
      const warningCalls = logCalls.mock.calls.filter(call =>
        call[0] && typeof call[0] === 'string' && call[0].includes('WARNING')
      );

      expect(warningCalls.length).toBe(0);
    });

    it('should print hooks information', () => {
      mockFs.existsSync.mockReturnValue(false);

      setupClaudeHooks();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('sessionEnd: Runs "session-archiver generate"')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('sessionStart: Runs "session-archiver daemon ensure"')
      );
    });

    it('should initialize hooks and env objects if missing', () => {
      const existingSettings = {
        customField: 'value'
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingSettings));

      setupClaudeHooks();

      const writtenData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1] as string);
      expect(writtenData.hooks).toBeDefined();
      expect(writtenData.env).toBeDefined();
      expect(writtenData.customField).toBe('value');
    });

    it('should handle empty existing settings object', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{}');

      setupClaudeHooks();

      const writtenData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1] as string);
      expect(writtenData.hooks.sessionEnd).toBeDefined();
      expect(writtenData.hooks.sessionStart).toBeDefined();
      expect(writtenData.env.ANTHROPIC_AUTH_TOKEN).toBeDefined();
      expect(writtenData.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBeDefined();
    });
  });
});
