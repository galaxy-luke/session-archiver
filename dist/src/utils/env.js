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
exports.env = void 0;
exports.getEnv = getEnv;
exports.getRequiredEnv = getRequiredEnv;
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Environment variable management utilities
 * Supports loading .env from multiple locations
 */
// Load .env files on module import
const loadEnvFiles = () => {
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
function getEnv(key, defaultValue) {
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
function getRequiredEnv(key) {
    const value = process.env[key];
    if (value === undefined || value.trim() === '') {
        throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
}
/**
 * Typed environment variable accessors
 */
exports.env = {
    /**
     * Get Anthropic authentication token
     * @throws Error if not set
     */
    ANTHROPIC_AUTH_TOKEN: () => {
        return getRequiredEnv('ANTHROPIC_AUTH_TOKEN');
    },
    /**
     * Get Anthropic default Haiku model
     * @returns Model name (default: 'glm-4.7-flash')
     */
    ANTHROPIC_DEFAULT_HAIKU_MODEL: () => {
        return getEnv('ANTHROPIC_DEFAULT_HAIKU_MODEL', 'glm-4.7-flash');
    },
    /**
     * Get maximum daily budget
     * @returns Budget amount (default: 1.0)
     */
    MAX_DAILY_BUDGET: () => {
        const value = getEnv('MAX_DAILY_BUDGET', '1.0');
        return parseFloat(value);
    },
    /**
     * Get Obsidian vault path (optional)
     * @returns Vault path or undefined if not set/empty
     */
    OBSIDIAN_VAULT_PATH: () => {
        const value = getEnv('OBSIDIAN_VAULT_PATH');
        // Return undefined if empty string, otherwise return the value
        return value === '' ? undefined : value;
    }
};
//# sourceMappingURL=env.js.map