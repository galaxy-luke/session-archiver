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
exports.setupClaudeHooks = setupClaudeHooks;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Setup Claude Code hooks for session archiver
 * Creates or updates ~/.claude/settings.json with necessary hooks and environment variables
 */
function setupClaudeHooks() {
    const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
    const settingsDir = path.dirname(settingsPath);
    // Ensure .claude directory exists
    if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true });
    }
    let settings = {};
    // Read existing settings if they exist
    if (fs.existsSync(settingsPath)) {
        try {
            const content = fs.readFileSync(settingsPath, 'utf-8');
            settings = JSON.parse(content);
        }
        catch (error) {
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
//# sourceMappingURL=claudeSetup.js.map