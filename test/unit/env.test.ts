import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Import the functions we need to test
import { getEnv, getRequiredEnv, env } from '../../src/utils/env';

describe('Environment Variable Management', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env to a clean state
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv;
  });

  describe('getEnv', () => {
    it('should return environment variable value when set', () => {
      process.env.TEST_VAR = 'test_value';
      expect(getEnv('TEST_VAR')).toBe('test_value');
    });

    it('should return default value when environment variable is not set', () => {
      expect(getEnv('NON_EXISTENT_VAR', 'default_value')).toBe('default_value');
    });

    it('should return undefined when environment variable is not set and no default provided', () => {
      expect(getEnv('NON_EXISTENT_VAR')).toBeUndefined();
    });

    it('should return default value when environment variable is empty string', () => {
      process.env.EMPTY_VAR = '';
      expect(getEnv('EMPTY_VAR', 'default')).toBe('default');
    });

    it('should handle whitespace values correctly', () => {
      process.env.WHITESPACE_VAR = '   ';
      expect(getEnv('WHITESPACE_VAR', 'default')).toBe('   ');
    });
  });

  describe('getRequiredEnv', () => {
    it('should return environment variable value when set', () => {
      process.env.REQUIRED_VAR = 'required_value';
      expect(getRequiredEnv('REQUIRED_VAR')).toBe('required_value');
    });

    it('should throw error when environment variable is not set', () => {
      expect(() => getRequiredEnv('NON_EXISTENT_REQUIRED_VAR')).toThrow(
        'Required environment variable NON_EXISTENT_REQUIRED_VAR is not set'
      );
    });

    it('should throw error when environment variable is empty string', () => {
      process.env.EMPTY_REQUIRED_VAR = '';
      expect(() => getRequiredEnv('EMPTY_REQUIRED_VAR')).toThrow(
        'Required environment variable EMPTY_REQUIRED_VAR is not set'
      );
    });

    it('should throw error when environment variable is only whitespace', () => {
      process.env.WHITESPACE_VAR = '   ';
      expect(() => getRequiredEnv('WHITESPACE_VAR')).toThrow(
        'Required environment variable WHITESPACE_VAR is not set'
      );
    });
  });

  describe('env object', () => {
    describe('ANTHROPIC_AUTH_TOKEN', () => {
      it('should return token when set', () => {
        process.env.ANTHROPIC_AUTH_TOKEN = 'test_token';
        expect(env.ANTHROPIC_AUTH_TOKEN()).toBe('test_token');
      });

      it('should throw error when token is not set', () => {
        delete process.env.ANTHROPIC_AUTH_TOKEN;
        expect(() => env.ANTHROPIC_AUTH_TOKEN()).toThrow(
          'Required environment variable ANTHROPIC_AUTH_TOKEN is not set'
        );
      });

      it('should throw error when token is empty string', () => {
        process.env.ANTHROPIC_AUTH_TOKEN = '';
        expect(() => env.ANTHROPIC_AUTH_TOKEN()).toThrow(
          'Required environment variable ANTHROPIC_AUTH_TOKEN is not set'
        );
      });
    });

    describe('ANTHROPIC_DEFAULT_HAIKU_MODEL', () => {
      it('should return model when set', () => {
        process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = 'custom-model';
        expect(env.ANTHROPIC_DEFAULT_HAIKU_MODEL()).toBe('custom-model');
      });

      it('should return default model when not set', () => {
        delete process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL;
        expect(env.ANTHROPIC_DEFAULT_HAIKU_MODEL()).toBe('glm-4.7-flash');
      });

      it('should use default when model is empty string', () => {
        process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = '';
        expect(env.ANTHROPIC_DEFAULT_HAIKU_MODEL()).toBe('glm-4.7-flash');
      });
    });

    describe('MAX_DAILY_BUDGET', () => {
      it('should return budget when set', () => {
        process.env.MAX_DAILY_BUDGET = '5.0';
        expect(env.MAX_DAILY_BUDGET()).toBe(5.0);
      });

      it('should return default budget when not set', () => {
        delete process.env.MAX_DAILY_BUDGET;
        expect(env.MAX_DAILY_BUDGET()).toBe(1.0);
      });

      it('should parse string numbers correctly', () => {
        process.env.MAX_DAILY_BUDGET = '2.5';
        expect(env.MAX_DAILY_BUDGET()).toBe(2.5);
      });

      it('should handle integer string values', () => {
        process.env.MAX_DAILY_BUDGET = '3';
        expect(env.MAX_DAILY_BUDGET()).toBe(3.0);
      });

      it('should use default when budget is empty string', () => {
        process.env.MAX_DAILY_BUDGET = '';
        expect(env.MAX_DAILY_BUDGET()).toBe(1.0);
      });
    });

    describe('OBSIDIAN_VAULT_PATH', () => {
      it('should return path when set', () => {
        process.env.OBSIDIAN_VAULT_PATH = '/custom/vault/path';
        expect(env.OBSIDIAN_VAULT_PATH()).toBe('/custom/vault/path');
      });

      it('should return undefined when not set', () => {
        delete process.env.OBSIDIAN_VAULT_PATH;
        expect(env.OBSIDIAN_VAULT_PATH()).toBeUndefined();
      });

      it('should return undefined when set to empty string', () => {
        process.env.OBSIDIAN_VAULT_PATH = '';
        expect(env.OBSIDIAN_VAULT_PATH()).toBeUndefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in environment values', () => {
      process.env.SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      expect(getEnv('SPECIAL_CHARS')).toBe('!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`');
    });

    it('should handle unicode characters', () => {
      process.env.UNICODE = '你好世界 🌍';
      expect(getEnv('UNICODE')).toBe('你好世界 🌍');
    });

    it('should handle very long values', () => {
      const longValue = 'a'.repeat(10000);
      process.env.LONG_VALUE = longValue;
      expect(getEnv('LONG_VALUE')).toBe(longValue);
    });

    it('should handle numbers in required env', () => {
      process.env.NUMBER_VAR = '12345';
      expect(getRequiredEnv('NUMBER_VAR')).toBe('12345');
    });

    it('should handle boolean-like strings', () => {
      process.env.BOOL_VAR = 'true';
      expect(getEnv('BOOL_VAR')).toBe('true');
    });
  });

  describe('Type Safety', () => {
    it('should maintain type consistency for budget values', () => {
      process.env.MAX_DAILY_BUDGET = '10.5';
      const budget = env.MAX_DAILY_BUDGET();
      expect(typeof budget).toBe('number');
      expect(budget).toBeCloseTo(10.5, 1);
    });

    it('should handle invalid budget values gracefully', () => {
      process.env.MAX_DAILY_BUDGET = 'invalid';
      const budget = env.MAX_DAILY_BUDGET();
      expect(isNaN(budget)).toBe(true);
    });
  });
});
