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

import { execFileSync } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync
} from 'fs';

const binPath = path.join(process.cwd(), 'bin', 'session-archiver');

/** Run the CLI as a real subprocess and return its stdout. */
function runCli(args: string[], options: { cwd?: string } = {}): string {
  return execFileSync('node', [binPath, ...args], {
    encoding: 'utf-8',
    cwd: options.cwd,
    env: { ...process.env },
    // Capture stderr separately
    stdio: ['pipe', 'pipe', 'pipe']
  });
}

/** Run the CLI and expect it to fail, returning the error message. */
function runCliExpectError(args: string[], options: { cwd?: string } = {}): string {
  try {
    const result = execFileSync('node', [binPath, ...args], {
      encoding: 'utf-8',
      cwd: options.cwd,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    throw new Error('Expected command to fail but it succeeded');
  } catch (error: any) {
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
function setupTempProject(): {
  tmpDir: string;
  projectDir: string;
} {
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'sa-config-'));
  const projectDir = path.join(tmpDir, 'project');

  mkdirSync(projectDir, { recursive: true });

  // Project config (looks up cwd for .project-config/session-archiver.json)
  const configDir = path.join(projectDir, '.project-config');
  mkdirSync(configDir, { recursive: true });
  writeFileSync(
    path.join(configDir, 'session-archiver.json'),
    JSON.stringify(
      {
        projectName: 'test-project',
        obsidian: { vaultPath: '/tmp/vault' },
        ai: { model: 'claude-3-5-sonnet-20241022' },
        archiving: {},
        daemon: {},
        templates: {}
      },
      null,
      2
    ),
    'utf-8'
  );

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
    let ctx: ReturnType<typeof setupTempProject>;

    beforeEach(() => {
      ctx = setupTempProject();
    });

    afterEach(() => {
      rmSync(ctx.tmpDir, { recursive: true, force: true });
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
      mkdirSync(emptyDir, { recursive: true });

      const errorOutput = runCliExpectError(['config', 'show'], { cwd: emptyDir });
      expect(errorOutput).toContain('No configuration found');
      expect(errorOutput).toContain('session-archiver init');
    });
  });

  describe('validate subcommand', () => {
    let ctx: ReturnType<typeof setupTempProject>;

    beforeEach(() => {
      ctx = setupTempProject();
    });

    afterEach(() => {
      rmSync(ctx.tmpDir, { recursive: true, force: true });
    });

    it('validates correct configuration and reports success', () => {
      const output = runCli(['config', 'validate'], { cwd: ctx.projectDir });

      expect(output).toContain('✅');
      expect(output).toContain('valid');
    });

    it('reports validation errors for invalid configuration', () => {
      const configDir = path.join(ctx.projectDir, '.project-config');
      writeFileSync(
        path.join(configDir, 'session-archiver.json'),
        JSON.stringify({
          projectName: '', // Invalid: empty project name
          obsidian: { vaultPath: '' }, // Invalid: empty vault path
          ai: { model: '' }, // Invalid: empty model
          archiving: {},
          daemon: {},
          templates: {}
        }),
        'utf-8'
      );

      expect(() => {
        runCli(['config', 'validate'], { cwd: ctx.projectDir });
      }).toThrow();
    });

    it('fails with helpful message when config does not exist', () => {
      const emptyDir = path.join(ctx.tmpDir, 'empty');
      mkdirSync(emptyDir, { recursive: true });

      const errorOutput = runCliExpectError(['config', 'validate'], { cwd: emptyDir });
      expect(errorOutput).toContain('No configuration found');
      expect(errorOutput).toContain('session-archiver init');
    });
  });

  describe('edit subcommand', () => {
    let ctx: ReturnType<typeof setupTempProject>;

    beforeEach(() => {
      ctx = setupTempProject();
    });

    afterEach(() => {
      rmSync(ctx.tmpDir, { recursive: true, force: true });
    });

    it('fails with helpful message when config does not exist', () => {
      const emptyDir = path.join(ctx.tmpDir, 'empty');
      mkdirSync(emptyDir, { recursive: true });

      const errorOutput = runCliExpectError(['config', 'edit'], { cwd: emptyDir });
      expect(errorOutput).toContain('No configuration found');
      expect(errorOutput).toContain('session-archiver init');
    });
  });
});
