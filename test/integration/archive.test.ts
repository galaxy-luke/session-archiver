/**
 * Integration tests for the archive CLI command
 *
 * These tests exercise the real `bin/session-archiver` executable end-to-end
 * (binary -> dist -> commander -> Archiver) to confirm the `archive` command
 * is wired up correctly and that each mode (--file, --all, --preview) behaves
 * as specified.
 *
 * The `archive --help` smoke test is cross-platform and confirms command
 * registration. The behavioral tests build a throwaway vault + project config
 * in the system temp directory so they run identically on Windows and POSIX.
 */

import { execFileSync } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  readFileSync,
  statSync,
  existsSync,
  rmSync
} from 'fs';

const binPath = path.join(process.cwd(), 'bin', 'session-archiver');

/** Run the CLI as a real subprocess and return its stdout. */
function runCli(args: string[], options: { cwd?: string } = {}): string {
  return execFileSync('node', [binPath, ...args], {
    encoding: 'utf-8',
    cwd: options.cwd,
    // Help commander write --help to stdout, and avoid inheriting an ambient
    // project config from the host repo's working tree.
    env: { ...process.env }
  });
}

/**
 * Create a throwaway vault + drafts folder + project config in a unique temp
 * directory. Returns the paths the test needs.
 */
function setupTempProject(): {
  tmpDir: string;
  vaultPath: string;
  draftsPath: string;
  projectDir: string;
} {
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'sa-archive-'));
  const vaultPath = path.join(tmpDir, 'vault');
  const draftsPath = path.join(vaultPath, 'drafts');
  const projectDir = path.join(tmpDir, 'project');

  mkdirSync(vaultPath, { recursive: true });
  mkdirSync(draftsPath, { recursive: true });
  mkdirSync(projectDir, { recursive: true });

  // Project config (looks up cwd for .project-config/session-archiver.json)
  const configDir = path.join(projectDir, '.project-config');
  mkdirSync(configDir, { recursive: true });
  writeFileSync(
    path.join(configDir, 'session-archiver.json'),
    JSON.stringify(
      {
        projectName: 'test-project',
        obsidian: { vaultPath },
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

  return { tmpDir, vaultPath, draftsPath, projectDir };
}

/** Standard ready-status draft fixture. */
function readyDraft(): string {
  return [
    '---',
    'type: session-draft',
    'date: 2026-06-14',
    'status: ready',
    'project: test-project',
    '---',
    '',
    '# Session summary'
  ].join('\n');
}

/** Recursively collect the contents of every file under `dir`. */
function collectVaultFileContents(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectVaultFileContents(full));
    } else {
      out.push(readFileSync(full, 'utf-8'));
    }
  }
  return out;
}

describe('archive CLI integration', () => {
  describe('command registration (cross-platform)', () => {
    it('registers the archive command with --file/--all/--preview in the built binary', () => {
      const output = runCli(['archive', '--help']);

      expect(output).toContain('archive');
      expect(output).toContain('--file');
      expect(output).toContain('--all');
      expect(output).toContain('--preview');
    });
  });

  describe('--preview mode makes no changes', () => {
    let ctx: ReturnType<typeof setupTempProject>;

    beforeEach(() => {
      ctx = setupTempProject();
      writeFileSync(path.join(ctx.draftsPath, 'a.md'), readyDraft(), 'utf-8');
    });

    afterEach(() => {
      rmSync(ctx.tmpDir, { recursive: true, force: true });
    });

    it('--all --preview lists ready drafts but leaves them in place', () => {
      const output = runCli(['archive', '--all', '--preview'], { cwd: ctx.projectDir });

      // Reports preview intent and the candidate file.
      expect(output).toMatch(/Preview mode/i);
      expect(output).toContain('Would archive');
      expect(output).toContain('a.md');

      // The draft file must still exist untouched in the drafts folder.
      const remaining = readdirSync(ctx.draftsPath);
      expect(remaining).toContain('a.md');
      expect(remaining.length).toBe(1);
    });

    it('--file --preview does not move the file', () => {
      const draftFile = path.join(ctx.draftsPath, 'a.md');
      const output = runCli(['archive', '--file', draftFile, '--preview'], {
        cwd: ctx.projectDir
      });

      expect(output).toMatch(/Preview mode/i);
      expect(existsSync(draftFile)).toBe(true);
    });
  });

  describe('--all archives only status: ready drafts', () => {
    let ctx: ReturnType<typeof setupTempProject>;

    beforeEach(() => {
      ctx = setupTempProject();
      // ready draft -> should be archived
      writeFileSync(path.join(ctx.draftsPath, 'ready.md'), readyDraft(), 'utf-8');
      // non-ready draft -> must be left alone (not reported as archived)
      writeFileSync(
        path.join(ctx.draftsPath, 'wip.md'),
        readyDraft().replace('status: ready', 'status: draft'),
        'utf-8'
      );
    });

    afterEach(() => {
      rmSync(ctx.tmpDir, { recursive: true, force: true });
    });

    it('reports archiving only the ready draft, never the wip draft', () => {
      const output = runCli(['archive', '--all'], { cwd: ctx.projectDir });

      // Only the ready draft is reported as archived.
      expect(output).toContain('Archived:');
      expect(output).toContain('ready.md');
      expect(output).not.toContain('wip.md');

      // A target file with status: archived must now exist somewhere in the vault.
      const archivedContents = collectVaultFileContents(ctx.vaultPath);
      expect(
        archivedContents.some((c) => /^status:\s*archived$/m.test(c))
      ).toBe(true);
    });
  });

  describe('--file archives a specific draft', () => {
    let ctx: ReturnType<typeof setupTempProject>;

    beforeEach(() => {
      ctx = setupTempProject();
      writeFileSync(path.join(ctx.draftsPath, 'target.md'), readyDraft(), 'utf-8');
    });

    afterEach(() => {
      rmSync(ctx.tmpDir, { recursive: true, force: true });
    });

    it('archives the named file and prints the target path', () => {
      const draftFile = path.join(ctx.draftsPath, 'target.md');
      const output = runCli(['archive', '--file', draftFile], { cwd: ctx.projectDir });

      expect(output).toMatch(/Archived to:/);

      // Somewhere in the vault there must now be a file whose frontmatter
      // status was flipped to "archived".
      const archivedContents = collectVaultFileContents(ctx.vaultPath);
      expect(
        archivedContents.some((c) => /^status:\s*archived$/m.test(c))
      ).toBe(true);
    });
  });
});
