# session-archiver

AI-powered session summary and archiving system for AI coding assistants (Claude Code, Copilot CLI, etc.).

## Features

- 🔄 **Automatic Session Detection** - Monitors AI coding assistant session directories and detects completed sessions
- 🤖 **AI-Powered Analysis** - Uses Claude AI to generate intelligent summaries and categorize sessions
- 📁 **Organized Archive Structure** - Stores sessions in a structured format with rich metadata
- 🔍 **Searchable Archive** - Full-text search across all archived sessions with advanced filtering
- ⚙️ **Flexible Configuration** - Customizable watch paths, archive locations, and AI analysis settings

## Installation

```bash
npm install -g session-archiver
```

## Quick Start

```bash
# 1. Configure hooks for your AI coding assistant
session-archiver setup-claude  # For Claude Code
# or
session-archiver setup-copilot  # For GitHub Copilot CLI (coming soon)

# 2. Initialize the archiver
session-archiver init

# 3. Start the daemon
session-archiver daemon start
```

## Documentation

- [Installation Guide](docs/INSTALLATION.md) - Detailed installation and setup instructions
- [Usage Guide](docs/USAGE.md) - Complete CLI reference and usage examples

## License

MIT

## Support

For issues, questions, or contributions, please visit the [project repository](https://github.com/galaxy-luke/session-archiver).
