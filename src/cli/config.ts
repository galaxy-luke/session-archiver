import { Command } from 'commander';
import { spawn } from 'child_process';
import { ConfigManager } from '../utils/configManager';

/**
 * Show current project configuration as formatted JSON
 */
const showCommand = new Command('show')
  .description('Display current project configuration')
  .action(async () => {
    try {
      const configManager = new ConfigManager();

      if (!configManager.projectConfigExists()) {
        console.log('No configuration found. Run "session-archiver init" first.');
        process.exit(1);
      }

      const config = configManager.loadProjectConfig();
      console.log(JSON.stringify(config, null, 2));
    } catch (error) {
      console.error(`✗ Error: ${errorMessage(error)}`);
      process.exit(1);
    }
  });

/**
 * Open configuration file in user's editor
 */
const editCommand = new Command('edit')
  .description('Open configuration file in your default editor')
  .action(async () => {
    try {
      const configManager = new ConfigManager();

      if (!configManager.projectConfigExists()) {
        console.log('No configuration found. Run "session-archiver init" first.');
        process.exit(1);
      }

      const configPath = configManager.getProjectConfigPath();
      const editor = process.env.EDITOR || getDefaultEditor();

      console.log(`Opening ${configPath} with ${editor}...`);

      // Spawn editor with inherited stdio for interactive use
      const editorProcess = spawn(editor, [configPath], {
        stdio: 'inherit',
        shell: process.platform === 'win32'
      });

      editorProcess.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Editor exited with code ${code}`);
          process.exit(1);
        }
      });

      editorProcess.on('error', (err) => {
        console.error(`✗ Failed to launch editor: ${err.message}`);
        console.error(`Tried to use: ${editor}`);
        console.error('Set the EDITOR environment variable to use a different editor.');
        process.exit(1);
      });
    } catch (error) {
      console.error(`✗ Error: ${errorMessage(error)}`);
      process.exit(1);
    }
  });

/**
 * Validate current configuration and report errors
 */
const validateCommand = new Command('validate')
  .description('Validate configuration and report any errors')
  .action(async () => {
    try {
      const configManager = new ConfigManager();

      if (!configManager.projectConfigExists()) {
        console.log('No configuration found. Run "session-archiver init" first.');
        process.exit(1);
      }

      const config = configManager.loadProjectConfig();
      const result = configManager.validateConfig(config);

      if (result.isValid) {
        console.log('✅ Configuration is valid');
        process.exit(0);
      } else {
        console.error('❌ Configuration errors:');
        result.errors.forEach((error) => {
          console.error(`  - ${error}`);
        });
        process.exit(1);
      }
    } catch (error) {
      console.error(`✗ Error: ${errorMessage(error)}`);
      process.exit(1);
    }
  });

/**
 * Get the default editor based on platform
 */
function getDefaultEditor(): string {
  return process.platform === 'win32' ? 'notepad.exe' : 'vim';
}

/**
 * Safely extract a message from a thrown value of unknown shape
 */
function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export const configCommand = new Command('config')
  .description('Manage session archiver configuration')
  .addCommand(showCommand)
  .addCommand(editCommand)
  .addCommand(validateCommand);
