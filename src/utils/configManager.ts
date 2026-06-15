/**
 * Configuration Manager for Session Archiver
 * Handles loading, saving, and validating configuration files
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  SessionArchiverConfig,
  GlobalConfig,
  ConfigValidationResult
} from '../types/config';

const PROJECT_CONFIG_DIR = '.project-config';
const CONFIG_FILENAME = 'session-archiver.json';
const GLOBAL_CONFIG_DIR = '.session-archiver';

export class ConfigManager {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Ensure the project configuration directory exists
   */
  ensureProjectConfigDir(): void {
    const configDir = path.join(this.projectRoot, PROJECT_CONFIG_DIR);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  /**
   * Get the path to the project configuration file
   */
  getProjectConfigPath(): string {
    return path.join(this.projectRoot, PROJECT_CONFIG_DIR, CONFIG_FILENAME);
  }

  /**
   * Check if project configuration file exists
   */
  projectConfigExists(): boolean {
    return fs.existsSync(this.getProjectConfigPath());
  }

  /**
   * Load project configuration
   */
  loadProjectConfig(): SessionArchiverConfig {
    const configPath = this.getProjectConfigPath();

    if (!fs.existsSync(configPath)) {
      throw new Error('Project config file not found');
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent) as SessionArchiverConfig;
  }

  /**
   * Save project configuration
   */
  saveProjectConfig(config: SessionArchiverConfig): void {
    this.ensureProjectConfigDir();

    const configPath = this.getProjectConfigPath();
    fs.writeFileSync(
      configPath,
      JSON.stringify(config, null, 2),
      'utf-8'
    );
  }

  /**
   * Load global configuration from user's home directory
   */
  loadGlobalConfig(): GlobalConfig {
    const globalConfigPath = path.join(
      os.homedir(),
      GLOBAL_CONFIG_DIR,
      'config.json'
    );

    if (!fs.existsSync(globalConfigPath)) {
      return {};
    }

    const configContent = fs.readFileSync(globalConfigPath, 'utf-8');
    return JSON.parse(configContent) as GlobalConfig;
  }

  /**
   * Merge global and project configurations
   * Project config takes precedence, but global config provides defaults
   */
  mergeConfigs(
    globalConfig: GlobalConfig,
    projectConfig: SessionArchiverConfig
  ): SessionArchiverConfig {
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
  validateConfig(config: any): ConfigValidationResult {
    const errors: string[] = [];

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