#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './init';
import { generateCommand } from './generate';
import { archiveCommand } from './archive';
import { daemonCommand } from './daemon';
import { configCommand } from './config';
import { setupClaudeCommand } from './setupClaude';

const program = new Command();

program
  .name('session-archiver')
  .description('Automatic session archiver for Claude Code with AI-powered analysis and categorization')
  .version('0.1.0');

// Register all commands
program.addCommand(initCommand);
program.addCommand(generateCommand);
program.addCommand(archiveCommand);
program.addCommand(daemonCommand);
program.addCommand(configCommand);
program.addCommand(setupClaudeCommand);

program.parse();
