"use strict";
/**
 * Daemon Manager
 * Handles daemon lifecycle, PID file management, and process control
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
exports.DaemonManager = void 0;
const fs_1 = require("fs");
const path = __importStar(require("path"));
class DaemonManager {
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = projectRoot;
        this.pidFilePath = path.join(projectRoot, '.daemon-pid');
    }
    /**
     * Write PID to file
     */
    async writePidFile(pid) {
        await fs_1.promises.writeFile(this.pidFilePath, pid.toString(), 'utf8');
    }
    /**
     * Read PID from file
     */
    async readPidFile() {
        try {
            const content = await fs_1.promises.readFile(this.pidFilePath, 'utf8');
            return parseInt(content.trim(), 10);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }
    /**
     * Delete PID file
     */
    async deletePidFile() {
        try {
            await fs_1.promises.unlink(this.pidFilePath);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    /**
     * Check if a process is running by PID
     * Windows-compatible implementation
     */
    async isProcessRunning(pid) {
        try {
            if (process.platform === 'win32') {
                // Windows: use tasklist command to check process
                const { execSync } = require('child_process');
                const result = execSync(`tasklist /FI "PID eq ${pid}"`, { encoding: 'utf8' });
                return result.includes(`${pid}`) && !result.includes('NOT FOUND');
            }
            else {
                // Unix/Linux: use signal 0 to check process existence
                process.kill(pid, '0');
                return true;
            }
        }
        catch (error) {
            if (error.code === 'ESRCH') {
                // No such process
                return false;
            }
            else if (error.code === 'EPERM') {
                // Permission denied but process exists
                return true;
            }
            // For Windows, command execution failures usually mean process doesn't exist
            return false;
        }
    }
    /**
     * Get daemon status
     */
    async status() {
        const pid = await this.readPidFile();
        if (!pid) {
            return {
                isRunning: false,
                pid: null,
                uptime: 0
            };
        }
        const isRunning = await this.isProcessRunning(pid);
        return {
            isRunning,
            pid,
            uptime: isRunning ? process.uptime() : 0
        };
    }
    /**
     * Start daemon process
     */
    async start() {
        // Check if already running
        const currentStatus = await this.status();
        if (currentStatus.isRunning) {
            return {
                success: false,
                error: `Daemon is already running with PID ${currentStatus.pid}`
            };
        }
        try {
            // Spawn daemon process
            // In a real implementation, this would spawn the actual daemon
            // For now, we'll create a mock implementation
            const daemonProcess = this.spawnDaemonProcess();
            // Wait a bit for process to start
            await new Promise(resolve => setTimeout(resolve, 100));
            if (daemonProcess.pid) {
                await this.writePidFile(daemonProcess.pid);
                return {
                    success: true,
                    pid: daemonProcess.pid
                };
            }
            else {
                return {
                    success: false,
                    error: 'Failed to start daemon process'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Spawn the actual daemon process
     * This is a mock implementation - in production, this would spawn the real daemon
     */
    spawnDaemonProcess() {
        // In production, this would be something like:
        // return spawn('node', ['dist/cli/daemon.js'], {
        //   detached: true,
        //   stdio: 'ignore'
        // });
        // For now, we'll create a minimal mock
        // The actual spawning will be handled by the CLI command
        const mockPid = process.pid + Math.floor(Math.random() * 1000);
        // Create a minimal mock object
        const mockProcess = {
            pid: mockPid,
            on: (event, callback) => {
                // No-op for mock
                return mockProcess;
            }
        };
        return mockProcess;
    }
    /**
     * Stop daemon process
     */
    async stop() {
        const pid = await this.readPidFile();
        if (!pid) {
            return {
                success: false,
                error: 'Daemon is not running (no PID file found)'
            };
        }
        const isRunning = await this.isProcessRunning(pid);
        if (!isRunning) {
            // Clean up stale PID file
            await this.deletePidFile();
            return {
                success: false,
                error: `Daemon is not running (PID ${pid} not found)`
            };
        }
        try {
            // Try graceful shutdown first
            process.kill(pid, 'SIGTERM');
            // Wait for process to terminate
            try {
                await this.waitForProcessTermination(pid, 5000);
            }
            catch (timeoutError) {
                // Timeout - force kill
                process.kill(pid, 'SIGKILL');
            }
            // Clean up PID file
            await this.deletePidFile();
            return {
                success: true
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to stop daemon'
            };
        }
    }
    /**
     * Wait for process to terminate
     */
    async waitForProcessTermination(pid, timeout) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const isRunning = await this.isProcessRunning(pid);
            if (!isRunning) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error('Process termination timeout');
    }
    /**
     * Restart daemon process
     */
    async restart() {
        // Stop if running
        const stopResult = await this.stop();
        // Ignore if not running - that's fine
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 500));
        // Start daemon
        return await this.start();
    }
    /**
     * Ensure daemon is running (mixed mode)
     * Checks if running, starts if not
     */
    async ensureRunning() {
        const status = await this.status();
        if (status.isRunning) {
            // Daemon is running, all good
            return;
        }
        // Check for stale PID file
        if (status.pid && !status.isRunning) {
            // Clean up stale PID file
            await this.deletePidFile();
        }
        // Start daemon
        await this.start();
    }
}
exports.DaemonManager = DaemonManager;
//# sourceMappingURL=daemonManager.js.map