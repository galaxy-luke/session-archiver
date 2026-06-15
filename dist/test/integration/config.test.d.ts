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
export {};
//# sourceMappingURL=config.test.d.ts.map