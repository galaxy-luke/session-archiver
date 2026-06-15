/**
 * Daemon Core
 * Handles file watching and auto-archiving of draft files
 */

import { Archiver } from './archiver';
import { ConfigManager } from '../utils/configManager';
import * as chokidar from 'chokidar';
import * as path from 'path';
import { promises as fs } from 'fs';
import notifier from 'node-notifier';

export interface DaemonStatus {
  pid: number;
  processedCount: number;
  errorCount: number;
  lastCheck: string | null;
}

export interface DaemonStats {
  isRunning: boolean;
  pid?: number;
  processedCount: number;
  errorCount: number;
  lastCheck: string | null;
}

export class DaemonCore {
  private archiver: Archiver;
  private configManager: ConfigManager;
  private draftsPath: string;
  private watcher?: chokidar.FSWatcher;
  private checkInterval?: NodeJS.Timeout;
  private statusFilePath: string;
  private isRunning: boolean = false;
  private processedCount: number = 0;
  private errorCount: number = 0;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.archiver = new Archiver(configManager);

    const config = configManager.loadProjectConfig();
    this.draftsPath = path.join(config.obsidian.vaultPath, 'drafts');
    this.statusFilePath = path.join(config.obsidian.vaultPath, '.daemon-status.json');
  }

  /**
   * Start the daemon
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Daemon is already running');
    }

    this.isRunning = true;

    // Initialize status file
    await this.writeStatusFile({
      pid: process.pid,
      processedCount: 0,
      errorCount: 0,
      lastCheck: null
    });

    // Setup file watcher
    this.setupWatcher();

    // Setup periodic checks
    this.setupPeriodicChecks();

    // Run initial scan
    await this.scanDrafts();

    // Setup signal handlers for graceful shutdown
    this.setupSignalHandlers();
  }

  /**
   * Stop the daemon
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Close file watcher
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
    }

    // Clear periodic checks
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }

    // Update status file
    await this.writeStatusFile({
      pid: process.pid,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      lastCheck: new Date().toISOString()
    });
  }

  /**
   * Setup file watcher for drafts directory
   */
  private setupWatcher(): void {
    this.watcher = chokidar.watch(this.draftsPath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: false // Also watch initial files
    });

    this.watcher
      .on('add', (filePath) => this.handleFileChange(filePath))
      .on('change', (filePath) => this.handleFileChange(filePath))
      .on('error', (error) => {
        console.error('Watcher error:', error);
        this.errorCount++;
      });
  }

  /**
   * Setup periodic checks
   */
  private setupPeriodicChecks(): void {
    const config = this.configManager.loadProjectConfig();
    const interval = config.daemon?.checkInterval || 30000; // Default 30 seconds

    this.checkInterval = setInterval(() => {
      this.scanDrafts();
    }, interval);
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
  }

  /**
   * Handle graceful shutdown
   */
  private async shutdown(signal: string): Promise<void> {
    console.log(`Received ${signal}, shutting down gracefully...`);
    await this.stop();
    // Don't call process.exit in tests
    if (process.env.NODE_ENV !== 'test') {
      process.exit(0);
    }
  }

  /**
   * Handle file change event
   */
  private async handleFileChange(filePath: string): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    // Only process .md files
    if (!filePath.endsWith('.md')) {
      return;
    }

    await this.processFile(filePath);
  }

  /**
   * Scan drafts directory for ready files
   */
  private async scanDrafts(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      const files = await fs.readdir(this.draftsPath);
      const mdFiles = files.filter(file => file.endsWith('.md'));

      for (const file of mdFiles) {
        const filePath = path.join(this.draftsPath, file);
        await this.processFile(filePath);
      }

      // Update last check time
      await this.updateLastCheck();
    } catch (error) {
      console.error('Error scanning drafts:', error);
      this.errorCount++;
    }
  }

  /**
   * Process a single file
   */
  private async processFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const status = this.extractStatus(content);

      if (status === 'ready') {
        // Archive the file
        await this.archiver.archive(filePath);

        // Update counters
        this.processedCount++;

        // Send notification
        await this.sendNotification('Session Archived', `Successfully archived: ${path.basename(filePath)}`);

        // Update status file
        await this.updateStatus();
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      this.errorCount++;

      // Send error notification
      await this.sendNotification('Archive Error', `Failed to archive: ${path.basename(filePath)}`);

      // Update status file
      await this.updateStatus();
    }
  }

  /**
   * Extract status from markdown frontmatter
   */
  private extractStatus(content: string): string | null {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return null;
    }

    const frontmatterText = match[1];
    const statusMatch = frontmatterText.match(/status:\s*(\w+)/);

    if (statusMatch) {
      return statusMatch[1];
    }

    return null;
  }

  /**
   * Update last check time in status file
   */
  private async updateLastCheck(): Promise<void> {
    try {
      const status = await this.readStatusFile();
      status.lastCheck = new Date().toISOString();
      await this.writeStatusFile(status);
    } catch (error) {
      console.error('Error updating last check time:', error);
    }
  }

  /**
   * Update status file with current counters
   */
  private async updateStatus(): Promise<void> {
    try {
      await this.writeStatusFile({
        pid: process.pid,
        processedCount: this.processedCount,
        errorCount: this.errorCount,
        lastCheck: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating status file:', error);
    }
  }

  /**
   * Read status file
   */
  private async readStatusFile(): Promise<DaemonStatus> {
    try {
      const content = await fs.readFile(this.statusFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Return default status if file doesn't exist
        return {
          pid: process.pid,
          processedCount: 0,
          errorCount: 0,
          lastCheck: null
        };
      }
      throw error;
    }
  }

  /**
   * Write status file
   */
  private async writeStatusFile(status: DaemonStatus): Promise<void> {
    try {
      await fs.writeFile(this.statusFilePath, JSON.stringify(status, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing status file:', error);
    }
  }

  /**
   * Send desktop notification
   */
  private async sendNotification(title: string, message: string): Promise<void> {
    const config = this.configManager.loadProjectConfig();

    if (config.daemon?.enableNotifications !== false) {
      notifier.notify({
        title,
        message
      });
    }
  }

  /**
   * Get current daemon statistics
   */
  async getStats(): Promise<DaemonStats> {
    try {
      const status = await this.readStatusFile();
      return {
        isRunning: this.isRunning,
        pid: status.pid,
        processedCount: status.processedCount,
        errorCount: status.errorCount,
        lastCheck: status.lastCheck
      };
    } catch (error) {
      return {
        isRunning: this.isRunning,
        processedCount: this.processedCount,
        errorCount: this.errorCount,
        lastCheck: null
      };
    }
  }
}
