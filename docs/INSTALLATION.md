# Installation Guide

This guide will walk you through installing and setting up @claude-code/session-archiver.

## Prerequisites

Before installing, ensure you have the following:

- **Node.js** 18.0.0 or higher
- **npm** or **yarn** package manager
- **Claude Code** CLI tool installed
- **Obsidian** (optional, for viewing archived sessions)
- **Anthropic API key** - Get one from [Anthropic Console](https://console.anthropic.com/)

## Installation

### Global Install

Install the package globally using npm:

```bash
npm install -g @claude-code/session-archiver
```

Or using yarn:

```bash
yarn global add @claude-code/session-archiver
```

### Verify Installation

Check that the installation was successful:

```bash
session-archiver --version
```

You should see the version number displayed (e.g., `0.1.0`).

View available commands:

```bash
session-archiver --help
```

## Configuration

### 1. Configure Claude Code Integration

Set up the hooks that allow session-archiver to work with Claude Code:

```bash
session-archiver setup-claude
```

This command will:
- Create/update Claude Code settings file
- Configure session hooks for automatic archiving
- Set up proper file paths and permissions

### 2. Initialize the Archiver

Run the initialization command to create the configuration file:

```bash
session-archiver init
```

This will prompt you for:
- Archive base path (where sessions will be stored)
- Watch paths (which directories to monitor)
- Optional customization settings

### 3. Configure API Token

Add your Anthropic API key to your environment.

**Option 1: Environment Variable**

```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

Add this to your `~/.bashrc` or `~/.zshrc` to make it persistent.

**Option 2: Claude Code Settings**

Edit `~/.claude/settings.json`:

```json
{
  "apiKeys": {
    "anthropic": "your_api_key_here"
  }
}
```

### 4. Verify Configuration

Check your configuration:

```bash
session-archiver config show
```

Validate that all settings are correct:

```bash
session-archiver config validate
```

## Upgrading

To upgrade to the latest version:

```bash
npm update -g @claude-code/session-archiver
```

Or with yarn:

```bash
yarn global upgrade @claude-code/session-archiver
```

## Uninstallation

To remove the package completely:

```bash
npm uninstall -g @claude-code/session-archiver
```

Remove configuration files:

```bash
rm -rf ~/.session-archiver
```

Note: Claude Code hooks in `~/.claude/settings.json` will need to be removed manually if desired.

## Troubleshooting

### Common Issues

**Daemon won't start**
- Check if another instance is already running: `session-archiver daemon status`
- Verify your configuration: `session-archiver config validate`
- Check logs in `~/.session-archiver/logs/` for detailed error messages

**Configuration errors**
- Ensure project config exists: Run `session-archiver init` if missing
- Validate configuration: `session-archiver config validate`
- Check that required paths exist and are accessible

**API key issues**
- Verify ANTHROPIC_AUTH_TOKEN is set in your environment
- Test the key: Try running `session-archiver generate` to check API connectivity
- Ensure the key has proper permissions in the Anthropic console

**Archive not working**
- Check that Obsidian vault path is configured correctly
- Verify draft files have `status: ready` in their frontmatter
- Use `--preview` flag to test without making changes

## Next Steps

After installation, refer to the [Usage Guide](USAGE.md) for information on:
- Starting the daemon
- Manual operations
- Configuration options