/**
 * Daemon Manager
 * Handles daemon lifecycle, PID file management, and process control
 */
export interface DaemonStatus {
    isRunning: boolean;
    pid: number | null;
    uptime: number;
}
export interface DaemonOperationResult {
    success: boolean;
    pid?: number;
    error?: string;
}
export declare class DaemonManager {
    private projectRoot;
    private pidFilePath;
    constructor(projectRoot?: string);
    /**
     * Write PID to file
     */
    private writePidFile;
    /**
     * Read PID from file
     */
    private readPidFile;
    /**
     * Delete PID file
     */
    private deletePidFile;
    /**
     * Check if a process is running by PID
     */
    isProcessRunning(pid: number): Promise<boolean>;
    /**
     * Get daemon status
     */
    status(): Promise<DaemonStatus>;
    /**
     * Start daemon process
     */
    start(): Promise<DaemonOperationResult>;
    /**
     * Spawn the actual daemon process
     * This is a mock implementation - in production, this would spawn the real daemon
     */
    private spawnDaemonProcess;
    /**
     * Stop daemon process
     */
    stop(): Promise<DaemonOperationResult>;
    /**
     * Wait for process to terminate
     */
    private waitForProcessTermination;
    /**
     * Restart daemon process
     */
    restart(): Promise<DaemonOperationResult>;
    /**
     * Ensure daemon is running (mixed mode)
     * Checks if running, starts if not
     */
    ensureRunning(): Promise<void>;
}
//# sourceMappingURL=daemonManager.d.ts.map