import { Command } from 'commander';
import { setupClaudeHooks } from '../utils/claudeSetup';

/**
 * Setup Claude Code hooks command
 * Configures ~/.claude/settings.json with session archiver hooks
 */
export const setupClaudeCommand = new Command('setup-claude')
  .description('Setup Claude Code hooks for session archiver')
  .action(() => {
    try {
      setupClaudeHooks();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`✗ Error: ${message}`);
      process.exit(1);
    }
  });
