#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_1 = require("./init");
const generate_1 = require("./generate");
const archive_1 = require("./archive");
const daemon_1 = require("./daemon");
const config_1 = require("./config");
const setupClaude_1 = require("./setupClaude");
const program = new commander_1.Command();
program
    .name('session-archiver')
    .description('Automatic session archiver for Claude Code with AI-powered analysis and categorization')
    .version('0.1.0');
// Register all commands
program.addCommand(init_1.initCommand);
program.addCommand(generate_1.generateCommand);
program.addCommand(archive_1.archiveCommand);
program.addCommand(daemon_1.daemonCommand);
program.addCommand(config_1.configCommand);
program.addCommand(setupClaude_1.setupClaudeCommand);
program.parse();
//# sourceMappingURL=index.js.map