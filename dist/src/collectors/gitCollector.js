"use strict";
/**
 * Git Collector - Collects git repository information
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitCollector = void 0;
const simple_git_1 = __importDefault(require("simple-git"));
/**
 * GitCollector collects git repository status and commit history
 */
class GitCollector {
    constructor(gitInstance) {
        this.git = gitInstance || (0, simple_git_1.default)();
    }
    /**
     * Get current git status
     */
    async getGitStatus(workDir) {
        try {
            this.git.cwd(workDir);
            const status = await this.git.status();
            return {
                current: status.current || 'unavailable',
                tracking: status.tracking || 'unavailable',
                status: 'unavailable', // Additional status info if needed
            };
        }
        catch (error) {
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
    async getRecentCommits(workDir, count = 5) {
        try {
            this.git.cwd(workDir);
            const log = await this.git.log({ maxCount: count });
            if (!log.all || log.all.length === 0) {
                return [];
            }
            return log.all.map((commit) => ({
                hash: commit.hash,
                message: commit.message,
                author: commit.author_name || 'Unknown',
                date: commit.date,
            }));
        }
        catch (error) {
            // Handle git errors gracefully
            return ['unavailable'];
        }
    }
    /**
     * Collect all git data
     */
    async collect(workDir) {
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
exports.GitCollector = GitCollector;
//# sourceMappingURL=gitCollector.js.map