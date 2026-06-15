import { Command } from 'commander';
import { DaemonManager } from '../utils/daemonManager';

export const daemonCommand = new Command('daemon')
  .description('Manage the daemon process for automatic session monitoring');

// Start subcommand
daemonCommand
  .command('start')
  .description('Start the daemon process')
  .action(async () => {
    try {
      console.log('Starting daemon process...');
      const manager = new DaemonManager();
      const result = await manager.start();

      if (result.success) {
        console.log(`✓ Daemon started successfully with PID ${result.pid}`);
      } else {
        console.error(`✗ Failed to start daemon: ${result.error}`);
        process.exit(1);
      }
    } catch (error: any) {
      console.error(`✗ Error starting daemon: ${error.message}`);
      process.exit(1);
    }
  });

// Stop subcommand
daemonCommand
  .command('stop')
  .description('Stop the daemon process')
  .action(async () => {
    try {
      console.log('Stopping daemon process...');
      const manager = new DaemonManager();
      const result = await manager.stop();

      if (result.success) {
        console.log('✓ Daemon stopped successfully');
      } else {
        console.error(`✗ Failed to stop daemon: ${result.error}`);
        process.exit(1);
      }
    } catch (error: any) {
      console.error(`✗ Error stopping daemon: ${error.message}`);
      process.exit(1);
    }
  });

// Restart subcommand
daemonCommand
  .command('restart')
  .description('Restart the daemon process')
  .action(async () => {
    try {
      console.log('Restarting daemon process...');
      const manager = new DaemonManager();
      const result = await manager.restart();

      if (result.success) {
        console.log(`✓ Daemon restarted successfully with PID ${result.pid}`);
      } else {
        console.error(`✗ Failed to restart daemon: ${result.error}`);
        process.exit(1);
      }
    } catch (error: any) {
      console.error(`✗ Error restarting daemon: ${error.message}`);
      process.exit(1);
    }
  });

// Status subcommand
daemonCommand
  .command('status')
  .description('Check daemon process status')
  .action(async () => {
    try {
      const manager = new DaemonManager();
      const status = await manager.status();

      if (status.isRunning) {
        console.log(`✓ Daemon is running (PID ${status.pid})`);
        console.log(`  Uptime: ${Math.floor(status.uptime)} seconds`);
      } else {
        console.log('✗ Daemon is not running');
        if (status.pid) {
          console.log(`  Stale PID file found: ${status.pid}`);
        }
      }
    } catch (error: any) {
      console.error(`✗ Error checking daemon status: ${error.message}`);
      process.exit(1);
    }
  });

// Ensure subcommand (mixed mode)
daemonCommand
  .command('ensure')
  .description('Ensure daemon is running (start if not running)')
  .action(async () => {
    try {
      const manager = new DaemonManager();
      const status = await manager.status();

      if (status.isRunning) {
        console.log(`✓ Daemon is already running (PID ${status.pid})`);
      } else {
        console.log('Daemon not running, starting...');
        await manager.ensureRunning();
        const newStatus = await manager.status();
        console.log(`✓ Daemon started with PID ${newStatus.pid}`);
      }
    } catch (error: any) {
      console.error(`✗ Error ensuring daemon: ${error.message}`);
      process.exit(1);
    }
  });
