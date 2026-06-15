/**
 * Git Collector - Collects git repository information
 */

import simpleGit, { SimpleGit, LogResult } from 'simple-git';

export interface GitStatus {
  current: string;
  tracking: string;
  status: string;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface GitData {
  gitStatus: GitStatus;
  gitCommits: GitCommit[] | string[];
}

/**
 * GitCollector collects git repository status and commit history
 */
export class GitCollector {
  private git: SimpleGit;

  constructor(gitInstance?: SimpleGit) {
    this.git = gitInstance || simpleGit();
  }

  /**
   * Get current git status
   */
  async getGitStatus(workDir: string): Promise<GitStatus> {
    try {
      this.git.cwd(workDir);
      const status = await this.git.status();

      return {
        current: status.current || 'unavailable',
        tracking: status.tracking || 'unavailable',
        status: 'unavailable', // Additional status info if needed
      };
    } catch (error) {
      // Handle git errors gracefully (e.g., not a git repository)
      return {
        current: 'unavailable',
        tracking: 'unavailable',
        status: 'unavailable',
      };
    }
  }

  /**
   * Get recent commits from git log
   */
  async getRecentCommits(workDir: string, count: number = 5): Promise<GitCommit[] | string[]> {
    try {
      this.git.cwd(workDir);
      const log: LogResult = await this.git.log({ maxCount: count });

      if (!log.all || log.all.length === 0) {
        return [];
      }

      return log.all.map((commit) => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name || 'Unknown',
        date: commit.date,
      }));
    } catch (error) {
      // Handle git errors gracefully
      return ['unavailable'];
    }
  }

  /**
   * Collect all git data
   */
  async collect(workDir: string): Promise<GitData> {
    const [gitStatus, gitCommits] = await Promise.all([
      this.getGitStatus(workDir),
      this.getRecentCommits(workDir, 5),
    ]);

    return {
      gitStatus,
      gitCommits,
    };
  }
}
