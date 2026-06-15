/**
 * Configuration Manager for Session Archiver
 * Handles loading, saving, and validating configuration files
 */
import { SessionArchiverConfig, GlobalConfig, ConfigValidationResult } from '../types/config';
export declare class ConfigManager {
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Ensure the project configuration directory exists
     */
    ensureProjectConfigDir(): void;
    /**
     * Get the path to the project configuration file
     */
    getProjectConfigPath(): string;
    /**
     * Check if project configuration file exists
     */
    projectConfigExists(): boolean;
    /**
     * Load project configuration
     */
    loadProjectConfig(): SessionArchiverConfig;
    /**
     * Save project configuration
     */
    saveProjectConfig(config: SessionArchiverConfig): void;
    /**
     * Load global configuration from user's home directory
     */
    loadGlobalConfig(): GlobalConfig;
    /**
     * Merge global and project configurations
     * Project config takes precedence, but global config provides defaults
     */
    mergeConfigs(globalConfig: GlobalConfig, projectConfig: SessionArchiverConfig): SessionArchiverConfig;
    /**
     * Validate configuration object
     */
    validateConfig(config: any): ConfigValidationResult;
}
//# sourceMappingURL=configManager.d.ts.map