"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Import the functions we need to test
const env_1 = require("../../src/utils/env");
(0, globals_1.describe)('Environment Variable Management', () => {
    const originalEnv = process.env;
    (0, globals_1.beforeEach)(() => {
        // Reset process.env to a clean state
        process.env = { ...originalEnv };
    });
    (0, globals_1.afterEach)(() => {
        // Restore original process.env
        process.env = originalEnv;
    });
    (0, globals_1.describe)('getEnv', () => {
        (0, globals_1.it)('should return environment variable value when set', () => {
            process.env.TEST_VAR = 'test_value';
            (0, globals_1.expect)((0, env_1.getEnv)('TEST_VAR')).toBe('test_value');
        });
        (0, globals_1.it)('should return default value when environment variable is not set', () => {
            (0, globals_1.expect)((0, env_1.getEnv)('NON_EXISTENT_VAR', 'default_value')).toBe('default_value');
        });
        (0, globals_1.it)('should return undefined when environment variable is not set and no default provided', () => {
            (0, globals_1.expect)((0, env_1.getEnv)('NON_EXISTENT_VAR')).toBeUndefined();
        });
        (0, globals_1.it)('should return default value when environment variable is empty string', () => {
            process.env.EMPTY_VAR = '';
            (0, globals_1.expect)((0, env_1.getEnv)('EMPTY_VAR', 'default')).toBe('default');
        });
        (0, globals_1.it)('should handle whitespace values correctly', () => {
            process.env.WHITESPACE_VAR = '   ';
            (0, globals_1.expect)((0, env_1.getEnv)('WHITESPACE_VAR', 'default')).toBe('   ');
        });
    });
    (0, globals_1.describe)('getRequiredEnv', () => {
        (0, globals_1.it)('should return environment variable value when set', () => {
            process.env.REQUIRED_VAR = 'required_value';
            (0, globals_1.expect)((0, env_1.getRequiredEnv)('REQUIRED_VAR')).toBe('required_value');
        });
        (0, globals_1.it)('should throw error when environment variable is not set', () => {
            (0, globals_1.expect)(() => (0, env_1.getRequiredEnv)('NON_EXISTENT_REQUIRED_VAR')).toThrow('Required environment variable NON_EXISTENT_REQUIRED_VAR is not set');
        });
        (0, globals_1.it)('should throw error when environment variable is empty string', () => {
            process.env.EMPTY_REQUIRED_VAR = '';
            (0, globals_1.expect)(() => (0, env_1.getRequiredEnv)('EMPTY_REQUIRED_VAR')).toThrow('Required environment variable EMPTY_REQUIRED_VAR is not set');
        });
        (0, globals_1.it)('should throw error when environment variable is only whitespace', () => {
            process.env.WHITESPACE_VAR = '   ';
            (0, globals_1.expect)(() => (0, env_1.getRequiredEnv)('WHITESPACE_VAR')).toThrow('Required environment variable WHITESPACE_VAR is not set');
        });
    });
    (0, globals_1.describe)('env object', () => {
        (0, globals_1.describe)('ANTHROPIC_AUTH_TOKEN', () => {
            (0, globals_1.it)('should return token when set', () => {
                process.env.ANTHROPIC_AUTH_TOKEN = 'test_token';
                (0, globals_1.expect)(env_1.env.ANTHROPIC_AUTH_TOKEN()).toBe('test_token');
            });
            (0, globals_1.it)('should throw error when token is not set', () => {
                delete process.env.ANTHROPIC_AUTH_TOKEN;
                (0, globals_1.expect)(() => env_1.env.ANTHROPIC_AUTH_TOKEN()).toThrow('Required environment variable ANTHROPIC_AUTH_TOKEN is not set');
            });
            (0, globals_1.it)('should throw error when token is empty string', () => {
                process.env.ANTHROPIC_AUTH_TOKEN = '';
                (0, globals_1.expect)(() => env_1.env.ANTHROPIC_AUTH_TOKEN()).toThrow('Required environment variable ANTHROPIC_AUTH_TOKEN is not set');
            });
        });
        (0, globals_1.describe)('ANTHROPIC_DEFAULT_HAIKU_MODEL', () => {
            (0, globals_1.it)('should return model when set', () => {
                process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = 'custom-model';
                (0, globals_1.expect)(env_1.env.ANTHROPIC_DEFAULT_HAIKU_MODEL()).toBe('custom-model');
            });
            (0, globals_1.it)('should return default model when not set', () => {
                delete process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL;
                (0, globals_1.expect)(env_1.env.ANTHROPIC_DEFAULT_HAIKU_MODEL()).toBe('glm-4.7-flash');
            });
            (0, globals_1.it)('should use default when model is empty string', () => {
                process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = '';
                (0, globals_1.expect)(env_1.env.ANTHROPIC_DEFAULT_HAIKU_MODEL()).toBe('glm-4.7-flash');
            });
        });
        (0, globals_1.describe)('MAX_DAILY_BUDGET', () => {
            (0, globals_1.it)('should return budget when set', () => {
                process.env.MAX_DAILY_BUDGET = '5.0';
                (0, globals_1.expect)(env_1.env.MAX_DAILY_BUDGET()).toBe(5.0);
            });
            (0, globals_1.it)('should return default budget when not set', () => {
                delete process.env.MAX_DAILY_BUDGET;
                (0, globals_1.expect)(env_1.env.MAX_DAILY_BUDGET()).toBe(1.0);
            });
            (0, globals_1.it)('should parse string numbers correctly', () => {
                process.env.MAX_DAILY_BUDGET = '2.5';
                (0, globals_1.expect)(env_1.env.MAX_DAILY_BUDGET()).toBe(2.5);
            });
            (0, globals_1.it)('should handle integer string values', () => {
                process.env.MAX_DAILY_BUDGET = '3';
                (0, globals_1.expect)(env_1.env.MAX_DAILY_BUDGET()).toBe(3.0);
            });
            (0, globals_1.it)('should use default when budget is empty string', () => {
                process.env.MAX_DAILY_BUDGET = '';
                (0, globals_1.expect)(env_1.env.MAX_DAILY_BUDGET()).toBe(1.0);
            });
        });
        (0, globals_1.describe)('OBSIDIAN_VAULT_PATH', () => {
            (0, globals_1.it)('should return path when set', () => {
                process.env.OBSIDIAN_VAULT_PATH = '/custom/vault/path';
                (0, globals_1.expect)(env_1.env.OBSIDIAN_VAULT_PATH()).toBe('/custom/vault/path');
            });
            (0, globals_1.it)('should return undefined when not set', () => {
                delete process.env.OBSIDIAN_VAULT_PATH;
                (0, globals_1.expect)(env_1.env.OBSIDIAN_VAULT_PATH()).toBeUndefined();
            });
            (0, globals_1.it)('should return undefined when set to empty string', () => {
                process.env.OBSIDIAN_VAULT_PATH = '';
                (0, globals_1.expect)(env_1.env.OBSIDIAN_VAULT_PATH()).toBeUndefined();
            });
        });
    });
    (0, globals_1.describe)('Edge Cases', () => {
        (0, globals_1.it)('should handle special characters in environment values', () => {
            process.env.SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
            (0, globals_1.expect)((0, env_1.getEnv)('SPECIAL_CHARS')).toBe('!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`');
        });
        (0, globals_1.it)('should handle unicode characters', () => {
            process.env.UNICODE = '你好世界 🌍';
            (0, globals_1.expect)((0, env_1.getEnv)('UNICODE')).toBe('你好世界 🌍');
        });
        (0, globals_1.it)('should handle very long values', () => {
            const longValue = 'a'.repeat(10000);
            process.env.LONG_VALUE = longValue;
            (0, globals_1.expect)((0, env_1.getEnv)('LONG_VALUE')).toBe(longValue);
        });
        (0, globals_1.it)('should handle numbers in required env', () => {
            process.env.NUMBER_VAR = '12345';
            (0, globals_1.expect)((0, env_1.getRequiredEnv)('NUMBER_VAR')).toBe('12345');
        });
        (0, globals_1.it)('should handle boolean-like strings', () => {
            process.env.BOOL_VAR = 'true';
            (0, globals_1.expect)((0, env_1.getEnv)('BOOL_VAR')).toBe('true');
        });
    });
    (0, globals_1.describe)('Type Safety', () => {
        (0, globals_1.it)('should maintain type consistency for budget values', () => {
            process.env.MAX_DAILY_BUDGET = '10.5';
            const budget = env_1.env.MAX_DAILY_BUDGET();
            (0, globals_1.expect)(typeof budget).toBe('number');
            (0, globals_1.expect)(budget).toBeCloseTo(10.5, 1);
        });
        (0, globals_1.it)('should handle invalid budget values gracefully', () => {
            process.env.MAX_DAILY_BUDGET = 'invalid';
            const budget = env_1.env.MAX_DAILY_BUDGET();
            (0, globals_1.expect)(isNaN(budget)).toBe(true);
        });
    });
});
//# sourceMappingURL=env.test.js.map