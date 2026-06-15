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
exports.archiveCommand = void 0;
const commander_1 = require("commander");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const archiver_1 = require("../core/archiver");
const configManager_1 = require("../utils/configManager");
// Subdirectory inside the Obsidian vault where session drafts are written.
// Matches the convention used by daemonCore.ts and the Generator.
const DRAFTS_DIR_NAME = 'drafts';
exports.archiveCommand = new commander_1.Command('archive')
    .description('Archive session draft(s) into their final Obsidian location')
    .option('--file <path>', 'Archive a specific draft file')
    .option('--all', 'Archive every draft whose frontmatter status is "ready"')
    .option('--preview', 'Dry-run: report what would happen without making changes')
    .action(async (options) => {
    try {
        const configManager = new configManager_1.ConfigManager();
        const archiver = new archiver_1.Archiver(configManager);
        const isPreview = options.preview === true;
        // Mode: --file <path>
        if (options.file) {
            console.log(`Archiving draft: ${options.file}`);
            if (isPreview) {
                console.log('Preview mode - no changes will be made.');
                // Best-effort: report the would-be target if it can be computed
                // cheaply without writing anything. We do not call archiver.archive()
                // here because that would mutate the filesystem.
                try {
                    if (configManager.projectConfigExists()) {
                        const vaultPath = configManager.loadProjectConfig().obsidian.vaultPath;
                        if (vaultPath) {
                            console.log(`Would archive into vault: ${vaultPath}`);
                        }
                    }
                }
                catch {
                    // Target path is "not easily available" without reading the draft;
                    // per spec we simply report preview intent and return.
                }
                return;
            }
            const result = await archiver.archive(options.file);
            console.log(`Archived to: ${result.targetPath}`);
            return;
        }
        // Mode: --all
        if (options.all) {
            // Load merged configuration to resolve the drafts folder location.
            const config = configManager.mergeConfigs(configManager.loadGlobalConfig(), configManager.loadProjectConfig());
            const vaultPath = config.obsidian.vaultPath;
            const draftsDir = path.join(vaultPath, DRAFTS_DIR_NAME);
            console.log(`Scanning drafts folder: ${draftsDir}`);
            const entries = await fs_1.promises.readdir(draftsDir);
            const markdownFiles = entries.filter((name) => name.endsWith('.md'));
            if (markdownFiles.length === 0) {
                console.log('No markdown draft files found.');
                return;
            }
            const readyFiles = [];
            const statusReadyRegex = /^status:\s*ready$/m;
            for (const name of markdownFiles) {
                const filePath = path.join(draftsDir, name);
                let content;
                try {
                    content = await fs_1.promises.readFile(filePath, 'utf-8');
                }
                catch {
                    // Skip files we can't read rather than aborting the whole run.
                    continue;
                }
                if (statusReadyRegex.test(content)) {
                    readyFiles.push(filePath);
                }
            }
            if (readyFiles.length === 0) {
                console.log('No drafts with status "ready" found.');
                return;
            }
            if (isPreview) {
                console.log('Preview mode - no changes will be made.');
                for (const file of readyFiles) {
                    console.log(`Would archive: ${file}`);
                }
                console.log(`Total: ${readyFiles.length} file(s) would be archived.`);
                return;
            }
            let archived = 0;
            let failed = 0;
            for (const file of readyFiles) {
                try {
                    const result = await archiver.archive(file);
                    console.log(`Archived: ${file} -> ${result.targetPath}`);
                    archived++;
                }
                catch (error) {
                    console.error(`Failed to archive ${file}: ${errorMessage(error)}`);
                    failed++;
                }
            }
            console.log(`Done. Archived ${archived} file(s).` + (failed > 0 ? ` ${failed} failed.` : ''));
            return;
        }
        // No mode specified: show usage.
        console.log('Please specify a mode: --file <path> or --all');
        console.log('Use --preview to see what would happen without making changes.');
        exports.archiveCommand.help();
    }
    catch (error) {
        console.error(`✗ Error: ${errorMessage(error)}`);
        process.exit(1);
    }
});
/** Safely extract a message from a thrown value of unknown shape. */
function errorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
//# sourceMappingURL=archive.js.map