/**
 * Configuration types for Session Archiver
 */

/**
 * Obsidian configuration
 */
export interface ObsidianConfig {
  vaultPath: string;
  attachmentFolder?: string;
  dateFormat?: string;
}

/**
 * AI configuration
 */
export interface AIConfig {
  enabled?: boolean;
  provider?: 'anthropic' | 'openai' | 'glm';
  apiKey?: string;
  apiEndpoint?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  fallbackModels?: string[];
}

/**
 * Archiving configuration
 */
export interface ArchivingConfig {
  archiveInterval?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Daemon configuration
 */
export interface DaemonConfig {
  enabled?: boolean;
  checkInterval?: number;
  idleTimeout?: number;
  enableNotifications?: boolean;
}

/**
 * Templates configuration
 */
export interface TemplatesConfig {
  sessionNote?: string;
  summaryTemplate?: string;
  tagsTemplate?: string;
  templatePath?: string;
  templateType?: 'default' | 'simple' | 'tech' | 'custom';
  sharedTemplatesPath?: string;
}

/**
 * Main session archiver configuration
 */
export interface SessionArchiverConfig {
  projectName: string;
  obsidian: ObsidianConfig;
  ai: AIConfig;
  archiving: ArchivingConfig;
  daemon: DaemonConfig;
  templates: TemplatesConfig;
}

/**
 * Global configuration (from ~/.session-archiver/config.json)
 */
export interface GlobalConfig {
  ai?: Partial<AIConfig>;
  daemon?: DaemonConfig;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
}