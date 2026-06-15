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
export {};
//# sourceMappingURL=daemon.test.d.ts.map