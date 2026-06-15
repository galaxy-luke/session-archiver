/**
 * End-to-end workflow tests
 *
 * These tests verify the complete session archiver workflow from start to finish:
 * 1. Daemon detects a Claude Code session ending
 * 2. Collectors gather session data (transcript, files, context)
 * 3. AI analyzes and categorizes the session
 * 4. Generator creates a structured session draft
 * 5. Draft is saved to the Obsidian vault
 *
 * NOTE: These tests are currently skipped because they require:
 * - Mocking the Anthropic API (complex setup needed)
 * - Simulating complete Claude Code session lifecycles
 * - Full integration with all components (daemon → collectors → AI → generator)
 * - Temporary vault/project setup with realistic session data
 *
 * Current test strategy focuses on:
 * - Unit tests for individual components (test/unit/)
 * - Integration tests for CLI commands (test/integration/)
 * - Manual testing for full E2E workflows
 *
 * To enable these tests in the future:
 * 1. Set up anthropic-sdk-mock or similar API mocking
 * 2. Create realistic session fixtures (transcripts, files, contexts)
 * 3. Implement temp vault/project helpers (similar to archive.test.ts)
 * 4. Add proper cleanup/teardown for async operations
 */
//# sourceMappingURL=end-to-end.test.d.ts.map