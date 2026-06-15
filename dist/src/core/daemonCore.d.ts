/**
 * Daemon Core
 * Handles file watching and auto-archiving of draft files
 */
import { ConfigManager } from '../utils/configManager';
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
export declare class DaemonCore {
    private archiver;
    private configManager;
    private draftsPath;
    private watcher?;
    private checkInterval?;
    private statusFilePath;
    private isRunning;
    private processedCount;
    private errorCount;
    constructor(configManager: ConfigManager);
    /**
     * Start the daemon
     */
    start(): Promise<void>;
    /**
     * Stop the daemon
     */
    stop(): Promise<void>;
    /**
     * Setup file watcher for drafts directory
     */
    private setupWatcher;
    /**
     * Setup periodic checks
     */
    private setupPeriodicChecks;
    /**
     * Setup signal handlers for graceful shutdown
     */
    private setupSignalHandlers;
    /**
     * Handle graceful shutdown
     */
    private shutdown;
    /**
     * Handle file change event
     */
    private handleFileChange;
    /**
     * Scan drafts directory for ready files
     */
    private scanDrafts;
    /**
     * Process a single file
     */
    private processFile;
    /**
     * Extract status from markdown frontmatter
     */
    private extractStatus;
    /**
     * Update last check time in status file
     */
    private updateLastCheck;
    /**
     * Update status file with current counters
     */
    private updateStatus;
    /**
     * Read status file
     */
    private readStatusFile;
    /**
     * Write status file
     */
    private writeStatusFile;
    /**
     * Send desktop notification
     */
    private sendNotification;
    /**
     * Get current daemon statistics
     */
    getStats(): Promise<DaemonStats>;
}
//# sourceMappingURL=daemonCore.d.ts.map