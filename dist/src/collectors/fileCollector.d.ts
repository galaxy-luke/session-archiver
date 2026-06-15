/**
 * File Collector - Collects file change data using simple-git
 */
import { SimpleGit } from 'simple-git';
export interface FileChanges {
    modified: string[];
    created: string[];
    deleted: string[];
}
/**
 * FileCollector collects file change information
 */
export declare class FileCollector {
    private git;
    constructor(gitInstance?: SimpleGit);
    /**
     * Collect file changes from git status
     */
    collectFileChanges(workDir: string): Promise<FileChanges>;
    /**
     * Generate a diff summary for a specific file
     */
    generateDiffSummary(workDir: string, file: string): Promise<string>;
}
//# sourceMappingURL=fileCollector.d.ts.map