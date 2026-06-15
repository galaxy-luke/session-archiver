"use strict";
/**
 * Integration tests for the config CLI command
 *
 * These tests exercise the real `bin/session-archiver` executable end-to-end
 * (binary -> dist -> commander -> ConfigManager) to confirm the `config` command
 * is wired up correctly and that each subcommand (show, edit, validate) behaves
 * as specified.
 *
 * The `config --help` smoke test is cross-platform and confirms command
 * registration. The behavioral tests build a throwaway project config in the
 * system temp directory so they run identically on Windows and POSIX.
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
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs_1 = require("fs");
const binPath = path.join(process.cwd(), 'bin', 'session-archiver');
/** Run the CLI as a real subprocess and return its stdout. */
function runCli(args, options = {}) {
    return (0, child_process_1.execFileSync)('node', [binPath, ...args], {
        encoding: 'utf-8',
        cwd: options.cwd,
        env: { ...process.env },
        // Capture stderr separately
        stdio: ['pipe', 'pipe', 'pipe']
    });
}
/** Run the CLI and expect it to fail, returning the error message. */
function runCliExpectError(args, options = {}) {
    try {
        const result = (0, child_process_1.execFileSync)('node', [binPath, ...args], {
            encoding: 'utf-8',
            cwd: options.cwd,
            env: { ...process.env },
            stdio: ['pipe', 'pipe', 'pipe']
        });
        throw new Error('Expected command to fail but it succeeded');
    }
    catch (error) {
        // On Windows, error.stderr might be a Buffer
        const stderr = error.stderr ? error.stderr.toString() : '';
        const stdout = error.stdout ? error.stdout.toString() : '';
        return stderr || stdout || error.message;
    }
}
/**
 * Create a throwaway project with valid config in a unique temp directory.
 * Returns the paths the test needs.
 */
function setupTempProject() {
    const tmpDir = (0, fs_1.mkdtempSync)(path.join(os.tmpdir(), 'sa-config-'));
    const projectDir = path.join(tmpDir, 'project');
    (0, fs_1.mkdirSync)(projectDir, { recursive: true });
    // Project config (looks up cwd for .project-config/session-archiver.json)
    const configDir = path.join(projectDir, '.project-config');
    (0, fs_1.mkdirSync)(configDir, { recursive: true });
    (0, fs_1.writeFileSync)(path.join(configDir, 'session-archiver.json'), JSON.stringify({
        projectName: 'test-project',
        obsidian: { vaultPath: '/tmp/vault' },
        ai: { model: 'claude-3-5-sonnet-20241022' },
        archiving: {},
        daemon: {},
        templates: {}
    }, null, 2), 'utf-8');
    return { tmpDir, projectDir };
}
describe('config CLI integration', () => {
    describe('command registration (cross-platform)', () => {
        it('registers the config command with show/edit/validate subcommands in the built binary', () => {
            const output = runCli(['config', '--help']);
            expect(output).toContain('config');
            expect(output).toContain('show');
            expect(output).toContain('edit');
            expect(output).toContain('validate');
        });
    });
    describe('show subcommand', () => {
        let ctx;
        beforeEach(() => {
            ctx = setupTempProject();
        });
        afterEach(() => {
            (0, fs_1.rmSync)(ctx.tmpDir, { recursive: true, force: true });
        });
        it('displays current configuration as formatted JSON', () => {
            const output = runCli(['config', 'show'], { cwd: ctx.projectDir });
            expect(output).toContain('"projectName":');
            expect(output).toContain('test-project');
            expect(output).toContain('"obsidian":');
            expect(output).toContain('"ai":');
        });
        it('fails with helpful message when config does not exist', () => {
            const emptyDir = path.join(ctx.tmpDir, 'empty');
            (0, fs_1.mkdirSync)(emptyDir, { recursive: true });
            const errorOutput = runCliExpectError(['config', 'show'], { cwd: emptyDir });
            expect(errorOutput).toContain('No configuration found');
            expect(errorOutput).toContain('session-archiver init');
        });
    });
    describe('validate subcommand', () => {
        let ctx;
        beforeEach(() => {
            ctx = setupTempProject();
        });
        afterEach(() => {
            (0, fs_1.rmSync)(ctx.tmpDir, { recursive: true, force: true });
        });
        it('validates correct configuration and reports success', () => {
            const output = runCli(['config', 'validate'], { cwd: ctx.projectDir });
            expect(output).toContain('✅');
            expect(output).toContain('valid');
        });
        it('reports validation errors for invalid configuration', () => {
            const configDir = path.join(ctx.projectDir, '.project-config');
            (0, fs_1.writeFileSync)(path.join(configDir, 'session-archiver.json'), JSON.stringify({
                projectName: '', // Invalid: empty project name
                obsidian: { vaultPath: '' }, // Invalid: empty vault path
                ai: { model: '' }, // Invalid: empty model
                archiving: {},
                daemon: {},
                templates: {}
            }), 'utf-8');
            expect(() => {
                runCli(['config', 'validate'], { cwd: ctx.projectDir });
            }).toThrow();
        });
        it('fails with helpful message when config does not exist', () => {
            const emptyDir = path.join(ctx.tmpDir, 'empty');
            (0, fs_1.mkdirSync)(emptyDir, { recursive: true });
            const errorOutput = runCliExpectError(['config', 'validate'], { cwd: emptyDir });
            expect(errorOutput).toContain('No configuration found');
            expect(errorOutput).toContain('session-archiver init');
        });
    });
    describe('edit subcommand', () => {
        let ctx;
        beforeEach(() => {
            ctx = setupTempProject();
        });
        afterEach(() => {
            (0, fs_1.rmSync)(ctx.tmpDir, { recursive: true, force: true });
        });
        it('fails with helpful message when config does not exist', () => {
            const emptyDir = path.join(ctx.tmpDir, 'empty');
            (0, fs_1.mkdirSync)(emptyDir, { recursive: true });
            const errorOutput = runCliExpectError(['config', 'edit'], { cwd: emptyDir });
            expect(errorOutput).toContain('No configuration found');
            expect(errorOutput).toContain('session-archiver init');
        });
    });
});
//# sourceMappingURL=config.test.js.map