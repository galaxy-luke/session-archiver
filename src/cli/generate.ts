import { Command } from 'commander';
import { Generator } from '../core/generator';
import { SessionCollector } from '../collectors/sessionCollector';
import { FileCollector } from '../collectors/fileCollector';
import { GitCollector } from '../collectors/gitCollector';
import { AnthropicClient } from '../ai/anthropicClient';
import { GeneratorContext } from '../core/generator';
import { ConfigManager } from '../utils/configManager';
import { env } from '../utils/env';
import * as path from 'path';

export const generateCommand = new Command('generate')
  .description('Generate session summary draft from current session')
  .option('-s, --session-id <id>', 'Session ID (default: auto-detect from Claude Code)')
  .option('-p, --project-path <path>', 'Project path (default: current working directory)')
  .option('-v, --vault-path <path>', 'Obsidian vault path (default: from config)')
  .option('-t, --template-path <path>', 'Template path (default: ./templates)')
  .action(async (options) => {
    try {
      console.log('🚀 Starting session draft generation...');

      // Initialize config manager
      const configManager = new ConfigManager();

      // Check if project config exists
      if (!configManager.projectConfigExists()) {
        console.error('❌ Error: Project configuration not found');
        console.log('Please run: session-archiver init');
        process.exit(1);
      }

      // Load configuration
      const config = configManager.loadProjectConfig();

      // Determine paths
      const projectPath = options.projectPath || process.cwd();
      const vaultPath = options.vaultPath || config.obsidian.vaultPath;
      const templatePath = options.templatePath || path.join(process.cwd(), 'templates');

      if (!vaultPath) {
        console.error('❌ Error: Obsidian vault path not configured');
        console.log('Please run: session-archiver init');
        process.exit(1);
      }

      // Get API key
      let apiKey;
      try {
        apiKey = env.ANTHROPIC_AUTH_TOKEN();
      } catch (error) {
        console.error('❌ Error: Anthropic API key not found');
        console.log('Please set ANTHROPIC_AUTH_TOKEN environment variable');
        process.exit(1);
      }

      // Create generator context (for now, use mock values)
      const context: GeneratorContext = {
        sessionId: options.sessionId || `session-${Date.now()}`,
        projectPath,
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        endTime: new Date(),
        model: config.ai.model
      };

      console.log(`📊 Session ID: ${context.sessionId}`);
      console.log(`📁 Project: ${projectPath}`);
      console.log(`📝 Vault: ${vaultPath}`);
      console.log(`🤖 Model: ${context.model}`);

      // Create collectors
      const sessionCollector = new SessionCollector();
      const fileCollector = new FileCollector();
      const gitCollector = new GitCollector();
      const aiClient = new AnthropicClient(apiKey);

      // Create generator
      const generator = new Generator(
        sessionCollector,
        fileCollector,
        gitCollector,
        aiClient,
        vaultPath,
        templatePath
      );

      console.log('⏳ Generating session summary...');

      // Generate draft
      const result = await generator.generate(context);

      console.log('✅ Session draft generated successfully!');
      console.log(`📄 Draft saved to: ${result.draftPath}`);
      console.log(`📊 Summary: ${result.summary.摘要.substring(0, 100)}...`);
      console.log(`\n📋 Next steps:`);
      console.log(`   1. Review the draft in Obsidian: ${result.draftPath}`);
      console.log(`   2. Edit and refine the content`);
      console.log(`   3. Move to final location when ready`);

    } catch (error) {
      console.error('❌ Failed to generate session draft:', error);
      process.exit(1);
    }
  });
