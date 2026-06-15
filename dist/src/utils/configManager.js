"use strict";
/**
 * Configuration Manager for Session Archiver
 * Handles loading, saving, and validating configuration files
 */
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
exports.ConfigManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const PROJECT_CONFIG_DIR = '.project-config';
const CONFIG_FILENAME = 'session-archiver.json';
const GLOBAL_CONFIG_DIR = '.session-archiver';
class ConfigManager {
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = projectRoot;
    }
    /**
     * Ensure the project configuration directory exists
     */
    ensureProjectConfigDir() {
        const configDir = path.join(this.projectRoot, PROJECT_CONFIG_DIR);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
    }
    /**
     * Get the path to the project configuration file
     */
    getProjectConfigPath() {
        return path.join(this.projectRoot, PROJECT_CONFIG_DIR, CONFIG_FILENAME);
    }
    /**
     * Check if project configuration file exists
     */
    projectConfigExists() {
        return fs.existsSync(this.getProjectConfigPath());
    }
    /**
     * Load project configuration
     */
    loadProjectConfig() {
        const configPath = this.getProjectConfigPath();
        if (!fs.existsSync(configPath)) {
            throw new Error('Project config file not found');
        }
        const configContent = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(configContent);
    }
    /**
     * Save project configuration
     */
    saveProjectConfig(config) {
        this.ensureProjectConfigDir();
        const configPath = this.getProjectConfigPath();
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    }
    /**
     * Load global configuration from user's home directory
     */
    loadGlobalConfig() {
        const globalConfigPath = path.join(os.homedir(), GLOBAL_CONFIG_DIR, 'config.json');
        if (!fs.existsSync(globalConfigPath)) {
            return {};
        }
        const configContent = fs.readFileSync(globalConfigPath, 'utf-8');
        return JSON.parse(configContent);
    }
    /**
     * Merge global and project configurations
     * Project config takes precedence, but global config provides defaults
     */
    mergeConfigs(globalConfig, projectConfig) {
        return {
            ...projectConfig,
            ai: {
                ...globalConfig.ai,
                ...projectConfig.ai
            },
            daemon: {
                ...globalConfig.daemon,
                ...projectConfig.daemon
            }
        };
    }
    /**
     * Validate configuration object
     */
    validateConfig(config) {
        const errors = [];
        // Check projectName
        if (!config.projectName || typeof config.projectName !== 'string' || config.projectName.trim() === '') {
            errors.push('projectName is required');
        }
        // Check obsidian.vaultPath
        if (!config.obsidian || !config.obsidian.vaultPath || typeof config.obsidian.vaultPath !== 'string' || config.obsidian.vaultPath.trim() === '') {
            errors.push('obsidian.vaultPath is required');
        }
        // Check ai.model
        if (!config.ai || !config.ai.model || typeof config.ai.model !== 'string' || config.ai.model.trim() === '') {
            errors.push('ai.model is required');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=configManager.js.map