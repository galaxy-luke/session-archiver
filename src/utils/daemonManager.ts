/**
 * Daemon Manager
 * Handles daemon lifecycle, PID file management, and process control
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

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

export class DaemonManager {
  private projectRoot: string;
  private pidFilePath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.pidFilePath = path.join(projectRoot, '.daemon-pid');
  }

  /**
   * Write PID to file
   */
  private async writePidFile(pid: number): Promise<void> {
    await fs.writeFile(this.pidFilePath, pid.toString(), 'utf8');
  }

  /**
   * Read PID from file
   */
  private async readPidFile(): Promise<number | null> {
    try {
      const content = await fs.readFile(this.pidFilePath, 'utf8');
      return parseInt(content.trim(), 10);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete PID file
   */
  private async deletePidFile(): Promise<void> {
    try {
      await fs.unlink(this.pidFilePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Check if a process is running by PID
   */
  async isProcessRunning(pid: number): Promise<boolean> {
    try {
      // Signal 0 checks if process exists without actually sending a signal
      process.kill(pid, '0');
      return true;
    } catch (error: any) {
      if (error.code === 'ESRCH') {
        // No such process
        return false;
      } else if (error.code === 'EPERM') {
        // Permission denied but process exists
        return true;
      }
      throw error;
    }
  }

  /**
   * Get daemon status
   */
  async status(): Promise<DaemonStatus> {
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
  async start(): Promise<DaemonOperationResult> {
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
      } else {
        return {
          success: false,
          error: 'Failed to start daemon process'
        };
      }
    } catch (error) {
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
  private spawnDaemonProcess(): ChildProcess {
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
      on: (event: string, callback: any) => {
        // No-op for mock
        return mockProcess;
      }
    } as any;

    return mockProcess;
  }

  /**
   * Stop daemon process
   */
  async stop(): Promise<DaemonOperationResult> {
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
      } catch (timeoutError) {
        // Timeout - force kill
        process.kill(pid, 'SIGKILL');
      }

      // Clean up PID file
      await this.deletePidFile();

      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to stop daemon'
      };
    }
  }

  /**
   * Wait for process to terminate
   */
  private async waitForProcessTermination(pid: number, timeout: number): Promise<void> {
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
  async restart(): Promise<DaemonOperationResult> {
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
  async ensureRunning(): Promise<void> {
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
