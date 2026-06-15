---
type: session-draft
date: {{date}}
startTime: {{startTime}}
endTime: {{endTime}}
duration: {{duration}}
generatedBy: @claude-code/session-archiver
model: {{model}}
complexity: {{complexity}}
status: draft
tags: [session, draft, project]
project: {{projectPath}}
---

# 會話總結

{{summary}}

## 主要工作項目

{{mainWorkItems}}

## 技術決策與理由

{{techDecisions}}

## 關鍵程式碼片段

{{codeSnippets}}

## 問題與解決

{{problemsSolutions}}

## 下次行動

{{nextActions}}

## 相關檔案

### 檔案變更

{{fileChanges}}

### Git 狀態

```
{{gitStatus}}
```

### Git 提交

{{gitCommits}}

## 相關資源

- 會話ID: {{sessionId}}
- 使用的模型: {{model}}
- 會話時長: {{duration}}
- Token 使用量: {{tokensUsed}}
- 預估成本: ${{cost}}

## 元數據

```json
{
  "generatedAt": "{{generatedAt}}",
  "model": "{{model}}",
  "complexity": {{complexity}},
  "tokensUsed": {{tokensUsed}},
  "cost": {{cost}},
  "sessionId": "{{sessionId}}"
}
```

---

*此草稿由 @claude-code/session-archiver 自動生成，請在審查後編輯和完善內容。*
