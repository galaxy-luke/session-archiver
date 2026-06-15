/**
 * Integration tests for Daemon CLI commands
 *
 * These tests spawn the real `bin/session-archiver` executable to verify the
 * daemon CLI is wired up end-to-end (binary → dist → commander → subcommands).
 * Unit-level behavior of DaemonManager is covered separately in
 * `test/unit/daemonManager.test.ts` and is NOT duplicated here.
 *
 * The `daemon start`/`stop` lifecycle spawns a long-lived background process
 * and has known path/permission quirks on Windows, so it is skipped there.
 */

import { execSync } from 'child_process';
import * as path from 'path';

const isWindows = process.platform === 'win32';

const binPath = path.join(process.cwd(), 'bin', 'session-archiver');

/** Run the CLI as a real subprocess and return its stdout. */
function runCli(args: string): string {
  return execSync(`node "${binPath}" ${args}`, {
    encoding: 'utf-8'
  });
}

describe('daemon CLI integration', () => {
  it('registers the daemon command with its subcommands in the built binary', () => {
    // Exercises the real CLI entrypoint through the built dist/ bundle and
    // confirms commander routes the `daemon` command without depending on any
    // ambient daemon/runtime state.
    const output = runCli('daemon --help');

    expect(output).toContain('daemon');
    expect(output).toContain('start');
    expect(output).toContain('stop');
    expect(output).toContain('restart');
    expect(output).toContain('status');
    expect(output).toContain('ensure');
  });

  // The start/stop lifecycle spawns a long-lived background process and has
  // known path/permission issues on Windows, so it is skipped there.
  (isWindows ? describe.skip : describe)('daemon start/stop lifecycle', () => {
    afterEach(() => {
      // Best-effort teardown so a failed test doesn't leave a daemon running.
      try {
        runCli('daemon stop');
      } catch {
        // Ignore — daemon may not have started.
      }
    });

    it('starts the daemon and reports a PID', () => {
      const output = runCli('daemon start');

      expect(output).toContain('✓ Daemon started successfully');
      expect(output).toMatch(/PID \d+/);
    });
  });
});
