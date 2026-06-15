"use strict";
/**
 * Session Archiver
 * Handles moving draft files from drafts folder to appropriate archive locations
 */
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
exports.Archiver = void 0;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const date_fns_1 = require("date-fns");
/**
 * Archiver class for moving session drafts to archive locations
 */
class Archiver {
    constructor(configManager) {
        this.configManager = configManager;
    }
    /**
     * Archive a draft file to its appropriate location
     * @param draftPath - Path to the draft file
     * @returns Archive result with target and original paths
     */
    async archive(draftPath) {
        try {
            // Step 1: Read draft file content
            const draft = await this.readDraftFile(draftPath);
            // Step 2: Determine target path based on frontmatter
            const targetPath = this.determineTargetPath(draftPath, draft.frontmatter);
            // Step 3: Create target directory if needed
            await this.ensureDirectoryExists(targetPath);
            // Step 4: Update status to archived
            const updatedContent = this.updateStatus(draft, 'archived');
            // Step 5: Write to temporary location first
            const tempPath = `${targetPath}.tmp`;
            await fs_1.promises.writeFile(tempPath, updatedContent, 'utf-8');
            // Step 6: Move file from drafts to archive location
            await fs_1.promises.rename(tempPath, targetPath);
            // Step 7: Optionally remove original draft file
            // (Commented out - keeping original as backup)
            // await fs.unlink(draftPath);
            return {
                targetPath,
                originalPath: draftPath
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to archive draft: ${error.message}`);
            }
            throw new Error('Failed to archive draft: Unknown error');
        }
    }
    /**
     * Read and parse draft file content
     * @param draftPath - Path to draft file
     * @returns Parsed draft content with frontmatter
     */
    async readDraftFile(draftPath) {
        const content = await fs_1.promises.readFile(draftPath, 'utf-8');
        return this.parseFrontmatter(content);
    }
    /**
     * Parse YAML frontmatter from markdown content
     * @param content - Markdown file content
     * @returns Parsed frontmatter and remaining content
     */
    parseFrontmatter(content) {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        if (!match) {
            throw new Error('Invalid draft format: no frontmatter found');
        }
        const frontmatterText = match[1];
        const bodyContent = match[2];
        try {
            const frontmatter = this.parseYaml(frontmatterText);
            return {
                frontmatter,
                content: bodyContent
            };
        }
        catch (error) {
            throw new Error('Invalid YAML frontmatter');
        }
    }
    /**
     * Simple YAML parser for frontmatter
     * @param yamlText - YAML text to parse
     * @returns Parsed object
     */
    parseYaml(yamlText) {
        const result = {};
        const lines = yamlText.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#'))
                continue;
            const colonIndex = trimmed.indexOf(':');
            if (colonIndex === -1)
                continue;
            const key = trimmed.substring(0, colonIndex).trim();
            const valueStr = trimmed.substring(colonIndex + 1).trim();
            // Handle different value types
            result[key] = this.parseYamlValue(valueStr);
        }
        return result;
    }
    /**
     * Parse a single YAML value
     * @param valueStr - String value to parse
     * @returns Parsed value
     */
    parseYamlValue(valueStr) {
        // Empty string
        if (!valueStr)
            return '';
        // Boolean
        if (valueStr === 'true')
            return true;
        if (valueStr === 'false')
            return false;
        // Number
        if (/^\d+$/.test(valueStr))
            return parseInt(valueStr, 10);
        if (/^\d+\.\d+$/.test(valueStr))
            return parseFloat(valueStr);
        // Array (simple format: [item1, item2])
        if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
            const arrayContent = valueStr.slice(1, -1);
            if (!arrayContent.trim())
                return [];
            return arrayContent.split(',').map(item => this.parseYamlValue(item.trim()));
        }
        // String with quotes
        if ((valueStr.startsWith('"') && valueStr.endsWith('"')) ||
            (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
            return valueStr.slice(1, -1);
        }
        // Plain string
        return valueStr;
    }
    /**
     * Determine target archive path based on frontmatter
     * @param draftPath - Original draft path
     * @param frontmatter - Parsed frontmatter
     * @returns Target archive path
     */
    determineTargetPath(draftPath, frontmatter) {
        const vaultPath = this.configManager.loadProjectConfig().obsidian.vaultPath;
        const type = frontmatter.type || 'session-draft';
        const date = frontmatter.date || (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
        const project = frontmatter.project || 'default';
        let targetPath;
        switch (type) {
            case 'session-draft':
                // Archive to project folder
                const projectName = this.extractProjectName(project);
                targetPath = path.join(vaultPath, '01-專案 Projects', projectName, `${date}-會話記錄.md`);
                break;
            case 'daily-note':
                // Archive to daily notes
                targetPath = path.join(vaultPath, '日記/Daily Notes', `${date}.md`);
                break;
            default:
                // Default to project location
                const defaultProjectName = this.extractProjectName(project);
                targetPath = path.join(vaultPath, '01-專案 Projects', defaultProjectName, `${date}-會話記錄.md`);
        }
        return targetPath;
    }
    /**
     * Extract project name from project path
     * @param projectPath - Full project path
     * @returns Simplified project name
     */
    extractProjectName(projectPath) {
        // If it's a path, extract the last component
        if (projectPath.includes('/') || projectPath.includes('\\')) {
            const parts = projectPath.split(/[\/\\]/);
            const lastPart = parts[parts.length - 1];
            return lastPart || 'default-project';
        }
        // Otherwise use as-is or provide default
        return projectPath || 'default-project';
    }
    /**
     * Ensure target directory exists
     * @param targetPath - Path to target file
     */
    async ensureDirectoryExists(targetPath) {
        const directory = path.dirname(targetPath);
        await fs_1.promises.mkdir(directory, { recursive: true });
    }
    /**
     * Update status in frontmatter
     * @param draft - Draft content
     * @param newStatus - New status value
     * @returns Updated markdown content
     */
    updateStatus(draft, newStatus) {
        const updatedFrontmatter = { ...draft.frontmatter, status: newStatus };
        const frontmatterText = this.stringifyFrontmatter(updatedFrontmatter);
        return `---\n${frontmatterText}\n---\n${draft.content}`;
    }
    /**
     * Convert frontmatter object to YAML string
     * @param frontmatter - Frontmatter object
     * @returns YAML string
     */
    stringifyFrontmatter(frontmatter) {
        const lines = [];
        // Define key order for consistent output
        const keyOrder = [
            'type', 'date', 'startTime', 'endTime', 'duration',
            'generatedBy', 'model', 'complexity', 'status',
            'tags', 'project', 'summary'
        ];
        // Output keys in preferred order
        for (const key of keyOrder) {
            if (key in frontmatter) {
                lines.push(this.stringifyYamlField(key, frontmatter[key]));
            }
        }
        // Output any remaining keys
        for (const key of Object.keys(frontmatter)) {
            if (!keyOrder.includes(key)) {
                lines.push(this.stringifyYamlField(key, frontmatter[key]));
            }
        }
        return lines.join('\n');
    }
    /**
     * Stringify a single YAML field
     * @param key - Field key
     * @param value - Field value
     * @returns YAML field string
     */
    stringifyYamlField(key, value) {
        if (Array.isArray(value)) {
            return `${key}: [${value.map(v => {
                if (typeof v === 'string') {
                    return `"${v}"`;
                }
                return String(v);
            }).join(', ')}]`;
        }
        else if (typeof value === 'object') {
            return `${key}: ${JSON.stringify(value)}`;
        }
        else if (typeof value === 'string') {
            // Check if value needs quotes
            if (value.includes(':') || value.includes('[') || value.includes(']') || value.includes('&')) {
                return `${key}: "${value}"`;
            }
            return `${key}: ${value}`;
        }
        else {
            return `${key}: ${value}`;
        }
    }
}
exports.Archiver = Archiver;
//# sourceMappingURL=archiver.js.map