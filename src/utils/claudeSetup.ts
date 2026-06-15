import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Claude Code settings structure
 */
interface ClaudeSettings {
  hooks?: {
    sessionEnd?: {
      command: string;
      args: string[];
      enabled: boolean;
    };
    sessionStart?: {
      command: string;
      args: string[];
      enabled: boolean;
    };
  };
  env?: {
    ANTHROPIC_AUTH_TOKEN?: string;
    ANTHROPIC_DEFAULT_HAIKU_MODEL?: string;
  };
}

/**
 * Setup Claude Code hooks for session archiver
 * Creates or updates ~/.claude/settings.json with necessary hooks and environment variables
 */
export function setupClaudeHooks(): void {
  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  const settingsDir = path.dirname(settingsPath);

  // Ensure .claude directory exists
  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true });
  }

  let settings: ClaudeSettings = {};

  // Read existing settings if they exist
  if (fs.existsSync(settingsPath)) {
    try {
      const content = fs.readFileSync(settingsPath, 'utf-8');
      settings = JSON.parse(content);
    } catch (error) {
      console.warn(`⚠️  Warning: Could not parse existing settings.json, creating fresh file`);
      settings = {};
    }
  }

  // Initialize hooks and env if they don't exist
  if (!settings.hooks) {
    settings.hooks = {};
  }

  if (!settings.env) {
    settings.env = {};
  }

  // Configure sessionEnd hook
  settings.hooks.sessionEnd = {
    command: 'session-archiver',
    args: ['generate'],
    enabled: true
  };

  // Configure sessionStart hook
  settings.hooks.sessionStart = {
    command: 'session-archiver',
    args: ['daemon', 'ensure'],
    enabled: true
  };

  // Add ANTHROPIC_AUTH_TOKEN if not exists
  if (!settings.env.ANTHROPIC_AUTH_TOKEN) {
    settings.env.ANTHROPIC_AUTH_TOKEN = 'your_token_here';
  }

  // Add ANTHROPIC_DEFAULT_HAIKU_MODEL if not exists
  if (!settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL) {
    settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = 'glm-4.7-flash';
  }

  // Write settings back to file
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');

  // Print success message
  console.log('✅ Claude Code hooks configured');
  console.log(`   Settings file: ${settingsPath}`);
  console.log('');
  console.log('Hooks configured:');
  console.log('  • sessionEnd: Runs "session-archiver generate" when session ends');
  console.log('  • sessionStart: Runs "session-archiver daemon ensure" when session starts');
  console.log('');

  // Check if token needs to be updated
  if (settings.env.ANTHROPIC_AUTH_TOKEN === 'your_token_here') {
    console.log('⚠️  WARNING: Please update ANTHROPIC_AUTH_TOKEN in your settings');
    console.log('   Your actual Anthropic API token is required for AI analysis features.');
  }
}
