# Usage Guide

This guide covers all commands and usage patterns for @claude-code/session-archiver.

## CLI Commands Overview

```bash
session-archiver [command] [options]
```

Available commands:
- `init` - Initialize configuration
- `daemon` - Manage the background daemon
- `generate` - Generate summary for current session
- `archive` - Archive sessions
- `config` - Manage configuration
- `setup-claude` - Configure Claude Code integration

## Initialization

### Interactive Setup

Initialize the archiver with interactive prompts:

```bash
session-archiver init
```

You'll be prompted for:
- **Archive Base Path** - Where to store archived sessions (default: `~/session-archive`)
- **Watch Paths** - Which directories to monitor for sessions (default: `~/.claude/sessions`)
- **Analysis Settings** - AI analysis preferences

### Re-initialization

Run `init` again to change settings. Your existing configuration will be preserved unless you choose to override it.

## Daemon Management

The daemon monitors for completed sessions and automatically archives them.

### Start Daemon

Start the background daemon:

```bash
session-archiver daemon start
```

The daemon will monitor for completed sessions and automatically archive them.

### Check Status

Check if the daemon is running:

```bash
session-archiver daemon status
```

Output:
- `running` - Daemon is active
- `stopped` - Daemon is not running
- PID and uptime information

### Stop Daemon

Stop the background daemon:

```bash
session-archiver daemon stop
```

### Restart Daemon

Restart the daemon with updated configuration:

```bash
session-archiver daemon restart
```

## Manual Operations

### Generate Summary

Generate an AI-powered summary for the current session:

```bash
session-archiver generate
```

Options:
- `-s, --session-id <id>` - Session ID (default: auto-detect from Claude Code)
- `-p, --project-path <path>` - Project path (default: current working directory)
- `-v, --vault-path <path>` - Obsidian vault path (default: from config)
- `-t, --template-path <path>` - Template path (default: ./templates)

Example:

```bash
session-archiver generate --session-id session-abc123 --project-path ~/my-project
```

### Archive Sessions

Archive a specific draft file:

```bash
session-archiver archive --file <path>
```

Archive all ready drafts:

```bash
session-archiver archive --all
```

Preview what would be archived without actually archiving:

```bash
session-archiver archive --all --preview
```

Options:
- `--file <path>` - Archive a specific draft file
- `--all` - Archive every draft whose frontmatter status is "ready"
- `--preview` - Dry-run: report what would happen without making changes

## Configuration Management

### Show Configuration

Display current configuration:

```bash
session-archiver config show
```

Output includes:
- Archive paths
- Watch paths
- AI settings
- Daemon options

### Edit Configuration

Open configuration file in default editor:

```bash
session-archiver config edit
```

This opens `~/.session-archiver/config.json` in your default editor.

### Validate Configuration

Check configuration for errors:

```bash
session-archiver config validate
```

Checks for:
- Valid paths
- Required fields
- Correct data types
- API key configuration

## Claude Code Integration

### Setup Integration

Configure Claude Code to work with session-archiver:

```bash
session-archiver setup-claude
```

This sets up:
- Session hooks in Claude Code settings
- Automatic archive triggering
- Path configurations

This sets up:
- Session hooks in Claude Code settings
- Automatic archive triggering
- Path configurations

## Common Workflows

### Workflow 1: Fully Automated

```bash
# One-time setup
session-archiver setup-claude
session-archiver init

# Start daemon (runs continuously)
session-archiver daemon start

# Sessions are automatically archived as they complete
```

### Workflow 2: Manual Archiving

```bash
# Initialize without daemon
session-archiver init

# Manually archive sessions as needed
session-archiver archive ~/.claude/sessions/session-abc123
session-archiver archive --all
```

### Workflow 3: Generate Summaries Only

```bash
# Generate summary for review
session-archiver generate ~/.claude/sessions/session-abc123 --output summary.md

# Archive after review
session-archiver archive ~/.claude/sessions/session-abc123
```

## Tips and Tricks

### Batch Operations

Archive multiple specific sessions:

```bash
session-archiver archive session1 session2 session3
```

### Verbose Output

Add `--verbose` flag to any command for detailed logging:

```bash
session-archiver archive --all --verbose
```

### Verbose Output

Add `--verbose` flag to any command for detailed logging:

```bash
session-archiver archive --all --verbose
```

### Troubleshooting

If you encounter issues:

1. Check daemon status: `session-archiver daemon status`
2. Validate configuration: `session-archiver config validate`
3. Check the logs in `~/.session-archiver/logs/` for detailed error messages

## Advanced Usage

### Environment Variables

Override configuration with environment variables:

```bash
export ARCHIVE_BASE_PATH=/custom/archive/path
export WATCH_PATHS=/path1,/path2
export ANTHROPIC_API_KEY=your_key
session-archiver daemon start
```

### Configuration File

Directly edit `~/.session-archiver/config.json` for advanced settings:

```json
{
  "archiveBasePath": "~/session-archive",
  "watchPaths": ["~/.claude/sessions"],
  "analysis": {
    "enabled": true,
    "model": "claude-3-5-sonnet-20241022"
  },
  "daemon": {
    "pollInterval": 60,
    "autoStart": false
  }
}
```

## Getting Help

Get help for any command:

```bash
session-archiver --help
session-archiver <command> --help
```

For additional support, see the main [README](../README.md).