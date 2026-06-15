"use strict";
/**
 * File Collector - Collects file change data using simple-git
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileCollector = void 0;
const simple_git_1 = __importDefault(require("simple-git"));
/**
 * FileCollector collects file change information
 */
class FileCollector {
    constructor(gitInstance) {
        this.git = gitInstance || (0, simple_git_1.default)();
    }
    /**
     * Collect file changes from git status
     */
    async collectFileChanges(workDir) {
        try {
            this.git.cwd(workDir);
            const status = await this.git.status();
            return {
                modified: status.modified || [],
                created: status.created || [],
                deleted: status.deleted || [],
            };
        }
        catch (error) {
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
    async generateDiffSummary(workDir, file) {
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
        }
        catch (error) {
            return 'N/A';
        }
    }
}
exports.FileCollector = FileCollector;
//# sourceMappingURL=fileCollector.js.map