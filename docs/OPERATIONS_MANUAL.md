# 📘 session-archiver 操作手冊

## 📦 目錄

1. [快速開始](#快速開始)
2. [安裝步驟](#安裝步驟)
3. [基本使用](#基本使用)
4. [多專案部署](#多專案部署)
5. [常用命令](#常用命令)
6. [故障排除](#故障排除)

---

## 🚀 快速開始

### 3 分鐘上手

```bash
# 1. 全局安裝
npm install -g session-archiver

# 2. 配置 Claude Code Hooks
session-archiver setup-claude

# 3. 在專案中初始化
cd your-project
session-archiver init

# 4. 啟動守護進程
session-archiver daemon start
```

✨ 完成！現在每次使用 Claude Code 結束會話時，會自動生成會話總結草稿。

---

## 📥 安裝步驟

### 1. 系統需求

- **Node.js**: 18+ 版本
- **npm** 或 **yarn**
- **Claude Code** 桌面應用
- **Obsidian** (可選，用於歸檔)
- **Anthropic API Token**

### 2. 安裝套件

#### 方法一：從 npm 安裝（推薦）

```bash
# 使用 npm
npm install -g session-archiver

# 或使用 yarn
yarn global add session-archiver
```

#### 方法二：從 GitHub 安裝

```bash
# 直接從 GitHub 安裝
npm install -g galaxy-luke/session-archiver
```

#### 方法三：本地開發安裝

```bash
# 從源碼安裝（開發者）
git clone https://github.com/galaxy-luke/session-archiver.git
cd session-archiver
npm install
npm run build
npm link
```

### 3. 驗證安裝

```bash
session-archiver --version
# 輸出: 0.1.0

session-archiver --help
# 查看所有可用命令
```

### 4. 配置 API Token

```bash
# 1. 設置 Claude Code Hooks
session-archiver setup-claude

# 2. 編輯 Claude Code 設定檔案
# macOS/Linux: ~/.claude/settings.json
# Windows: %USERPROFILE%\.claude\settings.json
```

在設定檔中更新 API Token：

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "你的實際 Token"
  }
}
```

---

## 🎯 基本使用

### 初始化專案

```bash
cd your-project
session-archiver init
```

**互動式配置提示：**
1. 專案名稱 (預設: 當前目錄名)
2. Obsidian Vault 路徑 (預設: `G:\我的雲端硬碟\2ndBrain`)
3. 啟用守護進程 (預設: yes)
4. AI 模型選擇 (預設: glm-4.7-flash)

配置檔位置: `.project-config/session-archiver.json`

### 啟動守護進程

```bash
# 啟動守護進程
session-archiver daemon start

# 查看狀態
session-archiver daemon status

# 停止守護進程
session-archiver daemon stop

# 重啟守護進程
session-archiver daemon restart
```

守護進程會：
- 🔍 監聽 Obsidian 草稿資料夾 (`<vault>/drafts/*.md`)
- 📋 檢測狀態為 `ready` 的草稿
- 📦 自動歸檔到對應專案資料夾
- 🔔 發送桌面通知

### 手動操作

```bash
# 手動生成會話總結
session-archiver generate

# 歸檔所有就緒草稿
session-archiver archive --all

# 預覽歸檔（不改變檔案）
session-archiver archive --all --preview

# 歸檔特定檔案
session-archiver archive --file "path/to/draft.md"
```

### 配置管理

```bash
# 查看當前配置
session-archiver config show

# 編輯配置
session-archiver config edit

# 驗證配置
session-archiver config validate
```

---

## 🌍 多專案部署

### 部署策略

**單一全局安裝 + 每專案配置**

優點：
- ✅ 一次安裝，所有專案共用
- ✅ 每個專案獨立配置
- ✅ 節省磁碟空間
- ✅ 統一版本管理

### 在新專案中部署

#### 步驟 1: 進入專案目錄

```bash
cd /path/to/new-project
```

#### 步驟 2: 初始化配置

```bash
session-archiver init
```

**互動式配置示例：**
```
專案名稱: My-Awesome-Project
Obsidian Vault 路徑: G:\我的雲端硬碟\2ndBrain
啟用守護進程: Yes
AI 模型: glm-4.7-flash
```

#### 步驟 3: 驗證配置

```bash
# 查看生成的配置
session-archiver config show

# 驗證配置有效性
session-archiver config validate
```

#### 步驟 4: 啟動守護進程

```bash
session-archiver daemon start
```

### 配置檔結構

每個專案會在專案根目錄生成：

```
your-project/
├── .project-config/
│   └── session-archiver.json    # 專案特定配置
├── node_modules/                 # 專案依賴（如有）
└── ...                           # 其他專案檔案
```

**配置檔內容示例：**

```json
{
  "version": "1.0.0",
  "projectName": "My-Awesome-Project",
  "createdAt": "2026-06-15T10:30:00.000Z",
  "obsidian": {
    "vaultPath": "G:\\我的雲端硬碟\\2ndBrain",
    "projectPath": "01-專案 Projects/My-Awesome-Project",
    "draftsPath": "草稿",
    "dailyNotesPath": "日記/Daily Notes"
  },
  "ai": {
    "enabled": true,
    "model": "glm-4.7-flash",
    "maxTokens": 2000,
    "temperature": 0.3
  },
  "daemon": {
    "autoStart": true,
    "checkInterval": 30000,
    "notifications": true
  }
}
```

### 多專案工作流程

#### 項目 A 工作流程

```bash
cd ~/projects/project-a
session-archiver init
# 配置: projectName = "Project-A"
session-archiver daemon start
# 工作中... Claude Code 會自動生成總結
```

#### 項目 B 工作流程

```bash
cd ~/projects/project-b
session-archiver init
# 配置: projectName = "Project-B"
session-archiver daemon start
# 每個專案獨立的配置和守護進程
```

### 切換專案時

```bash
# 停止當前專案的守護進程
session-archiver daemon stop

# 切換到另一個專案
cd ~/projects/another-project

# 查看配置
session-archiver config show

# 啟動該專案的守護進程
session-archiver daemon start
```

---

## 📚 常用命令

### CLI 命令總覽

| 命令 | 說明 | 常用選項 |
|------|------|----------|
| `init` | 初始化專案配置 | - |
| `generate` | 手動生成會話總結 | `-s, --session-id <id>` |
| `archive` | 歸檔草稿 | `--all`, `--file <path>`, `--preview` |
| `daemon` | 管理守護進程 | `start`, `stop`, `restart`, `status`, `ensure` |
| `config` | 管理配置 | `show`, `edit`, `validate` |
| `setup-claude` | 設置 Claude Code Hooks | - |

### 守護進程管理

```bash
# 確保守護進程運行（混合模式）
# 如果已運行：不做任何事
# 如果未運行：自動啟動
session-archiver daemon ensure

# 查看守護進程詳細狀態
session-archiver daemon status
```

**狀態輸出示例：**
```
✅ 守護進程運行中 (PID: 12345)

📊 統計資訊:
  - 運行時間: 45 分鐘
  - 已處理: 12 次
  - 錯誤數: 0
  - 最後檢查: 2026-06-15 15:30:00
  - 記憶體使用: 128MB
```

### 歸檔操作

```bash
# 預覽模式（推薦先執行）
session-archiver archive --all --preview

# 批量歸檔所有就緒草稿
session-archiver archive --all

# 歸檔特定草稿
session-archiver archive --file "G:\\我的雲端硬碟\\2ndBrain\\草稿\\draft-2026-06-15-1430.md"
```

---

## 🔧 配置說明

### 全域配置

位置: `~/.session-archiver/config.json` (可選)

```json
{
  "defaultAIModel": "glm-4.7-flash",
  "maxDailyBudget": 1.0
}
```

### 專案配置

位置: `<project>/.project-config/session-archiver.json`

**主要配置項：**

| 配置項 | 說明 | 預設值 |
|--------|------|--------|
| `projectName` | 專案名稱 | 當前目錄名 |
| `obsidian.vaultPath` | Obsidian Vault 路徑 | 必填 |
| `obsidian.projectPath` | 專案資料夾路徑 | `01-專案 Projects/<projectName>` |
| `obsidian.draftsPath` | 草稿資料夾 | `草稿` |
| `ai.model` | AI 模型 | `glm-4.7-flash` |
| `ai.enabled` | 啟用 AI | `true` |
| `daemon.autoStart` | 自動啟動守護進程 | `true` |
| `daemon.checkInterval` | 檢查間隔 (ms) | `30000` |

---

## 🎨 完整工作流程示例

### 自動化工作流程

#### 1. 設置階段（一次性）

```bash
# 全局安裝
npm install -g session-archiver

# 配置 Claude Code Hooks
session-archiver setup-claude

# 設置 API Token
# 編輯 ~/.claude/settings.json
```

#### 2. 專案初始化（每個新專案）

```bash
cd ~/projects/my-new-project
session-archiver init
# 回答配置提示
```

#### 3. 日常使用

```bash
# 啟動守護進程
session-archiver daemon start

# 使用 Claude Code 工作
# 守護進程會自動監聽並歸檔

# 查看狀態
session-archiver daemon status

# 結束時
session-archiver daemon stop
```

### 手動工作流程

```bash
# 1. 完成工作後，手動生成總結
session-archiver generate

# 2. 在 Obsidian 中編輯草稿
# - 補充遺漏資訊
# - 添加專案標籤
# - 修正錯誤

# 3. 將狀態改為 ready
# 在草稿 frontmatter 中修改: status: ready

# 4. 歸檔
session-archiver archive --file "path/to/draft.md"
```

---

## 🐛 故障排除

### 問題: npm 安裝失敗

**症狀:**
```
❌ npm ERR! 404 Not Found - session-archiver
```

**解決方案:**

1. **確認套件名稱正確**：
```bash
# 正確的安裝命令
npm install -g session-archiver

# 錯誤的安裝命令（不要使用）
npm install -g @claude-code/session-archiver
```

2. **檢查 npm 版本**：
```bash
npm --version  # 應該是 8.0.0 或更高
node --version # 應該是 18.0.0 或更高
```

3. **清理 npm 快取**：
```bash
npm cache clean --force
npm install -g session-archiver
```

4. **使用 GitHub 作為備選**：
```bash
npm install -g galaxy-luke/session-archiver
```

### 問題: 命令找不到

**症狀:**
```
bash: session-archiver: command not found
```

**解決方案:**

```bash
# 檢查全局安裝路徑
npm config get prefix

# 確保全局路徑在 PATH 中
# macOS/Linux: export PATH=$PATH:$(npm config get prefix)/bin
# Windows: 將 npm prefix 加到系統 PATH

# 或使用 npx（不需要全局安裝）
npx session-archiver --version
```

### 問題: 守護進程無法啟動

**症狀:**
```
❌ Failed to start daemon: Error: bind EADDRINUSE
```

**解決方案:**
```bash
# 檢查是否已有守護進程運行
session-archiver daemon status

# 強制停止
session-archiver daemon stop

# 清理 PID 檔案
rm .daemon-pid

# 重新啟動
session-archiver daemon start
```

### 問題: 配置驗證失敗

**症狀:**
```
❌ Configuration validation failed:
  - obsidian.vaultPath is required
```

**解決方案:**
```bash
# 重新初始化
session-archiver init

# 或手動編輯配置
session-archiver config edit
```

### 問題: API Token 錯誤

**症狀:**
```
❌ AI generation failed: 401 Unauthorized
```

**解決方案:**
```bash
# 檢查 Claude Code 設定
cat ~/.claude/settings.json | grep ANTHROPIC_AUTH_TOKEN

# 更新 Token
# 編輯 ~/.claude/settings.json
```

### 問題: 草稿無法自動歸檔

**檢查清單:**

```bash
# 1. 確認守護進程運行
session-archiver daemon status

# 2. 確認草稿狀態為 ready
# 在 Obsidian 中查看草稿 frontmatter

# 3. 檢查配置
session-archiver config show

# 4. 查看守護進程日誌
# 守護進程會輸出處理日誌
```

### 問題: 找不到草稿資料夾

**症狀:**
```
❌ Failed to archive: ENOENT: no such file or directory
```

**解決方案:**

檢查配置中的 `obsidian.vaultPath` 和 `obsidian.draftsPath`：

```bash
session-archiver config show | grep draftsPath

# 確保路徑正確
# Windows: G:\\我的雲端硬碟\\2ndBrain\\草稿
# macOS/Linux: ~/2ndBrain/草稿
```

---

## 💡 高級技巧

### 1. 自動啟動守護進程

在專案 `.gitignore` 中添加：

```
.daemon-pid
.daemon-status.json
```

在專案 README 中添加：

```markdown
## 快速開始

```bash
# 啟動守護進程
session-archiver daemon start

# 開始工作
```

### 2. 自定義歸檔路徑

編輯 `.project-config/session-archiver.json`：

```json
{
  "obsidian": {
    "projectPath": "自定義路徑/MyProjects"
  }
}
```

### 3. 調整 AI 模型參數

```json
{
  "ai": {
    "maxTokens": 4000,
    "temperature": 0.5
  }
}
```

### 4. 禁用桌面通知

```json
{
  "daemon": {
    "notifications": false
  }
}
```

---

## 📖 相關文檔

- [完整安裝指南](docs/INSTALLATION.md)
- [詳細使用說明](docs/USAGE.md)
- [變更日誌](CHANGELOG.md)

---

## 🆘 需要幫助？

- 查看 [故障排除](#故障排除) 部分
- 閱讀完整文檔: `docs/` 目錄
- 檢查配置: `session-archiver config validate`

**版本**: v0.1.0  
**更新**: 2026-06-15