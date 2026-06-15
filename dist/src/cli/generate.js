"use strict";
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
exports.generateCommand = void 0;
const commander_1 = require("commander");
const generator_1 = require("../core/generator");
const sessionCollector_1 = require("../collectors/sessionCollector");
const fileCollector_1 = require("../collectors/fileCollector");
const gitCollector_1 = require("../collectors/gitCollector");
const anthropicClient_1 = require("../ai/anthropicClient");
const configManager_1 = require("../utils/configManager");
const env_1 = require("../utils/env");
const path = __importStar(require("path"));
exports.generateCommand = new commander_1.Command('generate')
    .description('Generate session summary draft from current session')
    .option('-s, --session-id <id>', 'Session ID (default: auto-detect from Claude Code)')
    .option('-p, --project-path <path>', 'Project path (default: current working directory)')
    .option('-v, --vault-path <path>', 'Obsidian vault path (default: from config)')
    .option('-t, --template-path <path>', 'Template path (default: ./templates)')
    .action(async (options) => {
    try {
        console.log('🚀 Starting session draft generation...');
        // Initialize config manager
        const configManager = new configManager_1.ConfigManager();
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
            apiKey = env_1.env.ANTHROPIC_AUTH_TOKEN();
        }
        catch (error) {
            console.error('❌ Error: Anthropic API key not found');
            console.log('Please set ANTHROPIC_AUTH_TOKEN environment variable');
            process.exit(1);
        }
        // Create generator context (for now, use mock values)
        const context = {
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
        const sessionCollector = new sessionCollector_1.SessionCollector();
        const fileCollector = new fileCollector_1.FileCollector();
        const gitCollector = new gitCollector_1.GitCollector();
        const aiClient = new anthropicClient_1.AnthropicClient(apiKey);
        // Create generator
        const generator = new generator_1.Generator(sessionCollector, fileCollector, gitCollector, aiClient, vaultPath, templatePath);
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
    }
    catch (error) {
        console.error('❌ Failed to generate session draft:', error);
        process.exit(1);
    }
});
//# sourceMappingURL=generate.js.map