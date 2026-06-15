# session-archiver

🤖 AI-powered session summary and archiving system for AI coding assistants with multi-model support.

## ✨ Features

- 🤖 **Multi-AI Provider Support** - Works with OpenAI (GPT-4), Google Gemini, GLM (智譒AI), and Ollama
- 🔄 **Smart Template System** - Configurable templates with default, simple, and tech-focused options
- 📁 **Organized Archive Structure** - Stores sessions in Obsidian vault with rich metadata
- 🔍 **Intelligent Search** - Full-text search across all archived sessions
- ⚙️ **Flexible Configuration** - YAML/JSON config support with shared template directories
- 🎯 **Smart Model Switching** - Easy model switching with built-in tools

## 🚀 Installation

```bash
npm install -g session-archiver@latest
```

## 📖 Quick Start

```bash
# 1. Initialize the archiver
session-archiver init

# 2. Configure AI provider (optional - uses GLM by default)
node scripts/model-switcher.js switch glm glm-4.5-air

# 3. Generate session summary
session-archiver generate
```

## 🎨 Configuration

### AI Provider Selection

```bash
# List available models
node scripts/model-switcher.js list

# Switch models
node scripts/model-switcher.js switch glm glm-4.5-air    # GLM (推薦)
node scripts/model-switcher.js switch openai gpt-4-turbo  # OpenAI
node scripts/model-switcher.js switch google gemini-1.5-pro # Google
node scripts/model-switcher.js switch ollama mistral       # Local
```

### Template Configuration

Configure in `.project-config/session-archiver.json`:

```json
{
  "templates": {
    "templateType": "default",
    "sharedTemplatesPath": "G:\\我的雲端硬碟\\2ndBrain\\範本 Templates"
  }
}
```

Available template types:
- `default` - Full comprehensive template
- `simple` - Minimalist format  
- `tech` - Tech-focused template
- `custom` - Your own template

## 📚 Documentation

- [AI Model Switching Guide](docs/ai-model-switching-guide.md) - Complete model selection guide
- [Installation Guide](docs/INSTALLATION.md) - Setup instructions
- [Configuration Reference](docs/CONFIGURATION.md) - All options explained

## 🔧 Supported AI Providers

| Provider | Models | Cost | Best For |
|----------|--------|------|----------|
| **GLM** | glm-4.5-air, glm-4.7-flash | Low | Daily development ⭐ |
| **OpenAI** | gpt-4-turbo, gpt-4 | High | Complex analysis |
| **Google** | gemini-1.5-pro, gemini-1.5-flash | Medium | Multimodal tasks |
| **Ollama** | mistral, llama2, codellama | Free | Local testing |

## 📦 Project Structure

```
your-project/
├── .project-config/
│   └── session-archiver.json    # Project configuration
├── templates/
│   └── session-draft.md          # Custom template (optional)
└── scripts/
    ├── model-switcher.js         # Model switching tool
    └── edit-config.js           # Configuration editor
```

## 🎯 Usage Examples

```bash
# Generate session draft with current model
session-archiver generate

# Switch to faster model for quick drafts
node scripts/model-switcher.js switch glm glm-4.7-flash
session-archiver generate

# Use high-quality model for important sessions
node scripts/model-switcher.js switch openai gpt-4-turbo
session-archiver generate

# Edit configuration directly
node scripts/edit-config.js set ai.temperature 0.8
node scripts/edit-config.js show
```

## 🌐 Shared Templates

Place templates in your shared directory for use across projects:

```bash
G:\我的雲端硬碟\2ndBrain\範本 Templates\
├── session-draft.md           # Default template
├── session-draft-simple.md    # Simple template  
└── session-draft-tech.md      # Tech template
```

## 📄 License

MIT

## 🤝 Support

- **Issues**: https://github.com/galaxy-luke/session-archiver/issues
- **Documentation**: https://github.com/galaxy-luke/session-archiver/wiki
- **NPM**: https://www.npmjs.com/package/session-archiver

---

**🎉 Perfect for developers using AI coding assistants who want intelligent session tracking with flexible AI provider options!**
