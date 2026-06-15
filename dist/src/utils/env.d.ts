/**
 * Get an environment variable value
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set or empty
 * @returns Environment variable value or default
 */
export declare function getEnv(key: string, defaultValue?: string): string | undefined;
/**
 * Get a required environment variable value
 * Throws an error if the environment variable is not set or is empty/whitespace
 * @param key - Environment variable name
 * @returns Environment variable value
 * @throws Error if environment variable is not set or is empty/whitespace
 */
export declare function getRequiredEnv(key: string): string;
/**
 * Typed environment variable accessors
 */
export declare const env: {
    /**
     * Get Anthropic authentication token
     * @throws Error if not set
     */
    ANTHROPIC_AUTH_TOKEN: () => string;
    /**
     * Get Anthropic default Haiku model
     * @returns Model name (default: 'glm-4.7-flash')
     */
    ANTHROPIC_DEFAULT_HAIKU_MODEL: () => string;
    /**
     * Get maximum daily budget
     * @returns Budget amount (default: 1.0)
     */
    MAX_DAILY_BUDGET: () => number;
    /**
     * Get Obsidian vault path (optional)
     * @returns Vault path or undefined if not set/empty
     */
    OBSIDIAN_VAULT_PATH: () => string | undefined;
};
//# sourceMappingURL=env.d.ts.map