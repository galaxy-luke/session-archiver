"use strict";
/**
 * Daemon Core
 * Handles file watching and auto-archiving of draft files
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DaemonCore = void 0;
const archiver_1 = require("./archiver");
const chokidar = __importStar(require("chokidar"));
const path = __importStar(require("path"));
const fs_1 = require("fs");
const node_notifier_1 = __importDefault(require("node-notifier"));
class DaemonCore {
    constructor(configManager) {
        this.isRunning = false;
        this.processedCount = 0;
        this.errorCount = 0;
        this.configManager = configManager;
        this.archiver = new archiver_1.Archiver(configManager);
        const config = configManager.loadProjectConfig();
        this.draftsPath = path.join(config.obsidian.vaultPath, 'drafts');
        this.statusFilePath = path.join(config.obsidian.vaultPath, '.daemon-status.json');
    }
    /**
     * Start the daemon
     */
    async start() {
        if (this.isRunning) {
            throw new Error('Daemon is already running');
        }
        this.isRunning = true;
        // Initialize status file
        await this.writeStatusFile({
            pid: process.pid,
            processedCount: 0,
            errorCount: 0,
            lastCheck: null
        });
        // Setup file watcher
        this.setupWatcher();
        // Setup periodic checks
        this.setupPeriodicChecks();
        // Run initial scan
        await this.scanDrafts();
        // Setup signal handlers for graceful shutdown
        this.setupSignalHandlers();
    }
    /**
     * Stop the daemon
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        // Close file watcher
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = undefined;
        }
        // Clear periodic checks
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = undefined;
        }
        // Update status file
        await this.writeStatusFile({
            pid: process.pid,
            processedCount: this.processedCount,
            errorCount: this.errorCount,
            lastCheck: new Date().toISOString()
        });
    }
    /**
     * Setup file watcher for drafts directory
     */
    setupWatcher() {
        this.watcher = chokidar.watch(this.draftsPath, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true,
            ignoreInitial: false // Also watch initial files
        });
        this.watcher
            .on('add', (filePath) => this.handleFileChange(filePath))
            .on('change', (filePath) => this.handleFileChange(filePath))
            .on('error', (error) => {
            console.error('Watcher error:', error);
            this.errorCount++;
        });
    }
    /**
     * Setup periodic checks
     */
    setupPeriodicChecks() {
        const config = this.configManager.loadProjectConfig();
        const interval = config.daemon?.checkInterval || 30000; // Default 30 seconds
        this.checkInterval = setInterval(() => {
            this.scanDrafts();
        }, interval);
    }
    /**
     * Setup signal handlers for graceful shutdown
     */
    setupSignalHandlers() {
        process.on('SIGINT', () => this.shutdown('SIGINT'));
        process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    }
    /**
     * Handle graceful shutdown
     */
    async shutdown(signal) {
        console.log(`Received ${signal}, shutting down gracefully...`);
        await this.stop();
        // Don't call process.exit in tests
        if (process.env.NODE_ENV !== 'test') {
            process.exit(0);
        }
    }
    /**
     * Handle file change event
     */
    async handleFileChange(filePath) {
        if (!this.isRunning) {
            return;
        }
        // Only process .md files
        if (!filePath.endsWith('.md')) {
            return;
        }
        await this.processFile(filePath);
    }
    /**
     * Scan drafts directory for ready files
     */
    async scanDrafts() {
        if (!this.isRunning) {
            return;
        }
        try {
            const files = await fs_1.promises.readdir(this.draftsPath);
            const mdFiles = files.filter(file => file.endsWith('.md'));
            for (const file of mdFiles) {
                const filePath = path.join(this.draftsPath, file);
                await this.processFile(filePath);
            }
            // Update last check time
            await this.updateLastCheck();
        }
        catch (error) {
            console.error('Error scanning drafts:', error);
            this.errorCount++;
        }
    }
    /**
     * Process a single file
     */
    async processFile(filePath) {
        try {
            const content = await fs_1.promises.readFile(filePath, 'utf-8');
            const status = this.extractStatus(content);
            if (status === 'ready') {
                // Archive the file
                await this.archiver.archive(filePath);
                // Update counters
                this.processedCount++;
                // Send notification
                await this.sendNotification('Session Archived', `Successfully archived: ${path.basename(filePath)}`);
                // Update status file
                await this.updateStatus();
            }
        }
        catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
            this.errorCount++;
            // Send error notification
            await this.sendNotification('Archive Error', `Failed to archive: ${path.basename(filePath)}`);
            // Update status file
            await this.updateStatus();
        }
    }
    /**
     * Extract status from markdown frontmatter
     */
    extractStatus(content) {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
        const match = content.match(frontmatterRegex);
        if (!match) {
            return null;
        }
        const frontmatterText = match[1];
        const statusMatch = frontmatterText.match(/status:\s*(\w+)/);
        if (statusMatch) {
            return statusMatch[1];
        }
        return null;
    }
    /**
     * Update last check time in status file
     */
    async updateLastCheck() {
        try {
            const status = await this.readStatusFile();
            status.lastCheck = new Date().toISOString();
            await this.writeStatusFile(status);
        }
        catch (error) {
            console.error('Error updating last check time:', error);
        }
    }
    /**
     * Update status file with current counters
     */
    async updateStatus() {
        try {
            await this.writeStatusFile({
                pid: process.pid,
                processedCount: this.processedCount,
                errorCount: this.errorCount,
                lastCheck: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Error updating status file:', error);
        }
    }
    /**
     * Read status file
     */
    async readStatusFile() {
        try {
            const content = await fs_1.promises.readFile(this.statusFilePath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                // Return default status if file doesn't exist
                return {
                    pid: process.pid,
                    processedCount: 0,
                    errorCount: 0,
                    lastCheck: null
                };
            }
            throw error;
        }
    }
    /**
     * Write status file
     */
    async writeStatusFile(status) {
        try {
            await fs_1.promises.writeFile(this.statusFilePath, JSON.stringify(status, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('Error writing status file:', error);
        }
    }
    /**
     * Send desktop notification
     */
    async sendNotification(title, message) {
        const config = this.configManager.loadProjectConfig();
        if (config.daemon?.enableNotifications !== false) {
            node_notifier_1.default.notify({
                title,
                message
            });
        }
    }
    /**
     * Get current daemon statistics
     */
    async getStats() {
        try {
            const status = await this.readStatusFile();
            return {
                isRunning: this.isRunning,
                pid: status.pid,
                processedCount: status.processedCount,
                errorCount: status.errorCount,
                lastCheck: status.lastCheck
            };
        }
        catch (error) {
            return {
                isRunning: this.isRunning,
                processedCount: this.processedCount,
                errorCount: this.errorCount,
                lastCheck: null
            };
        }
    }
}
exports.DaemonCore = DaemonCore;
//# sourceMappingURL=daemonCore.js.map