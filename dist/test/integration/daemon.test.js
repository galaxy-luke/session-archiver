"use strict";
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
const isWindows = process.platform === 'win32';
const binPath = path.join(process.cwd(), 'bin', 'session-archiver');
/** Run the CLI as a real subprocess and return its stdout. */
function runCli(args) {
    return (0, child_process_1.execSync)(`node "${binPath}" ${args}`, {
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
            }
            catch {
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
//# sourceMappingURL=daemon.test.js.map