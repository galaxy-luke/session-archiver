/**
 * File Collector - Collects file change data using simple-git
 */

import simpleGit, { SimpleGit } from 'simple-git';

export interface FileChanges {
  modified: string[];
  created: string[];
  deleted: string[];
}

/**
 * FileCollector collects file change information
 */
export class FileCollector {
  private git: SimpleGit;

  constructor(gitInstance?: SimpleGit) {
    this.git = gitInstance || simpleGit();
  }

  /**
   * Collect file changes from git status
   */
  async collectFileChanges(workDir: string): Promise<FileChanges> {
    try {
      this.git.cwd(workDir);
      const status = await this.git.status();

      return {
        modified: status.modified || [],
        created: status.created || [],
        deleted: status.deleted || [],
      };
    } catch (error) {
      // Handle git errors gracefully
      return {
        modified: [],
        created: [],
        deleted: [],
      };
    }
  }

  /**
   * Generate a diff summary for a specific file
   */
  async generateDiffSummary(workDir: string, file: string): Promise<string> {
    try {
      this.git.cwd(workDir);
      const summary = await this.git.diffSummary([file]);

      if (!summary.files || summary.files.length === 0) {
        return 'N/A';
      }

      const fileStats = summary.files[0];

      // Check if file has insertions/deletions properties (DiffResultTextFile)
      if ('insertions' in fileStats && 'deletions' in fileStats) {
        const insertions = fileStats.insertions || 0;
        const deletions = fileStats.deletions || 0;
        return `+${insertions} -${deletions} lines`;
      }

      // For binary files or status-only changes, return changes count
      if ('changes' in fileStats) {
        return `${fileStats.changes} changes`;
      }

      return 'N/A';
    } catch (error) {
      return 'N/A';
    }
  }
}
