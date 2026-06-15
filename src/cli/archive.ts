import { Command } from 'commander';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Archiver } from '../core/archiver';
import { ConfigManager } from '../utils/configManager';

// Subdirectory inside the Obsidian vault where session drafts are written.
// Matches the convention used by daemonCore.ts and the Generator.
const DRAFTS_DIR_NAME = 'drafts';

export const archiveCommand = new Command('archive')
  .description('Archive session draft(s) into their final Obsidian location')
  .option('--file <path>', 'Archive a specific draft file')
  .option('--all', 'Archive every draft whose frontmatter status is "ready"')
  .option('--preview', 'Dry-run: report what would happen without making changes')
  .action(async (options) => {
    try {
      const configManager = new ConfigManager();
      const archiver = new Archiver(configManager);
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
          } catch {
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
        const config = configManager.mergeConfigs(
          configManager.loadGlobalConfig(),
          configManager.loadProjectConfig()
        );
        const vaultPath = config.obsidian.vaultPath;
        const draftsDir = path.join(vaultPath, DRAFTS_DIR_NAME);

        console.log(`Scanning drafts folder: ${draftsDir}`);

        const entries = await fs.readdir(draftsDir);
        const markdownFiles = entries.filter((name) => name.endsWith('.md'));

        if (markdownFiles.length === 0) {
          console.log('No markdown draft files found.');
          return;
        }

        const readyFiles: string[] = [];
        const statusReadyRegex = /^status:\s*ready$/m;

        for (const name of markdownFiles) {
          const filePath = path.join(draftsDir, name);
          let content: string;
          try {
            content = await fs.readFile(filePath, 'utf-8');
          } catch {
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
          } catch (error) {
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
      archiveCommand.help();
    } catch (error) {
      console.error(`✗ Error: ${errorMessage(error)}`);
      process.exit(1);
    }
  });

/** Safely extract a message from a thrown value of unknown shape. */
function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
