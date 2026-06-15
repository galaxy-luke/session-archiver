/**
 * Git Collector - Collects git repository information
 */
import { SimpleGit } from 'simple-git';
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
export declare class GitCollector {
    private git;
    constructor(gitInstance?: SimpleGit);
    /**
     * Get current git status
     */
    getGitStatus(workDir: string): Promise<GitStatus>;
    /**
     * Get recent commits from git log
     */
    getRecentCommits(workDir: string, count?: number): Promise<GitCommit[] | string[]>;
    /**
     * Collect all git data
     */
    collect(workDir: string): Promise<GitData>;
}
//# sourceMappingURL=gitCollector.d.ts.map