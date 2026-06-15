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
export {};
//# sourceMappingURL=archive.test.d.ts.map