"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupClaudeCommand = void 0;
const commander_1 = require("commander");
const claudeSetup_1 = require("../utils/claudeSetup");
/**
 * Setup Claude Code hooks command
 * Configures ~/.claude/settings.json with session archiver hooks
 */
exports.setupClaudeCommand = new commander_1.Command('setup-claude')
    .description('Setup Claude Code hooks for session archiver')
    .action(() => {
    try {
        (0, claudeSetup_1.setupClaudeHooks)();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`✗ Error: ${message}`);
        process.exit(1);
    }
});
//# sourceMappingURL=setupClaude.js.map