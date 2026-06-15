import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Environment variable management utilities
 * Supports loading .env from multiple locations
 */

// Load .env files on module import
const loadEnvFiles = (): void => {
  const projectEnv = path.join(process.cwd(), '.env');
  const globalEnv = path.join(os.homedir(), '.session-archiver/.env');

  // Try project .env first, then global .env
  const envPath = fs.existsSync(projectEnv) ? projectEnv : globalEnv;

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
};

// Load environment files on import
loadEnvFiles();

/**
 * Get an environment variable value
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set or empty
 * @returns Environment variable value or default
 */
export function getEnv(key: string, defaultValue?: string): string | undefined {
  const value = process.env[key];

  // If value is undefined, return default
  if (value === undefined) {
    return defaultValue;
  }

  // If value is empty string and we have a default, return default
  // Otherwise return the empty string
  if (value === '' && defaultValue !== undefined) {
    return defaultValue;
  }

  return value;
}

/**
 * Get a required environment variable value
 * Throws an error if the environment variable is not set or is empty/whitespace
 * @param key - Environment variable name
 * @returns Environment variable value
 * @throws Error if environment variable is not set or is empty/whitespace
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];

  if (value === undefined || value.trim() === '') {
    throw new Error(`Required environment variable ${key} is not set`);
  }

  return value;
}

/**
 * Typed environment variable accessors
 */
export const env = {
  /**
   * Get Anthropic authentication token
   * @throws Error if not set
   */
  ANTHROPIC_AUTH_TOKEN: (): string => {
    return getRequiredEnv('ANTHROPIC_AUTH_TOKEN');
  },

  /**
   * Get Anthropic default Haiku model
   * @returns Model name (default: 'glm-4.7-flash')
   */
  ANTHROPIC_DEFAULT_HAIKU_MODEL: (): string => {
    return getEnv('ANTHROPIC_DEFAULT_HAIKU_MODEL', 'glm-4.7-flash')!;
  },

  /**
   * Get maximum daily budget
   * @returns Budget amount (default: 1.0)
   */
  MAX_DAILY_BUDGET: (): number => {
    const value = getEnv('MAX_DAILY_BUDGET', '1.0')!;
    return parseFloat(value);
  },

  /**
   * Get Obsidian vault path (optional)
   * @returns Vault path or undefined if not set/empty
   */
  OBSIDIAN_VAULT_PATH: (): string | undefined => {
    const value = getEnv('OBSIDIAN_VAULT_PATH');
    // Return undefined if empty string, otherwise return the value
    return value === '' ? undefined : value;
  }
};
