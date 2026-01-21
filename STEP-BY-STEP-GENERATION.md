# 分步生成实现方案

## 概述

分步生成是为了解决当前代码生成系统的核心瓶颈：
- AI 生成质量不稳定
- 重试时容易超时（180秒限制）
- 错误难以定位

## 实现策略

### 第一步：生成核心文件
只生成最基础的 3 个文件：
- `src/App.jsx` - 主应用组件
- `src/index.css` - 全局样式
- `package.json` - 项目依赖

**优势**：
- 文件少，AI 生成更可靠
- 验证快速，错误容易定位
- 用户可以提前预览核心功能

### 第二步：生成额外文件（可选）
根据需求生成：
- `src/components/*.jsx` - 组件
- `src/hooks/*.js` - 自定义 Hooks
- `src/utils/*.js` - 工具函数
- `src/context/*.jsx` - Context

**优势**：
- 基于已验证的核心代码生成
- 失败只影响额外文件，不影响核心功能
- 可以独立重试

## 修改的文件

### 主要修改
- [app/api/generate-async/route.ts](app/api/generate-async/route.ts:700-820) - `generateCodeAsync` 函数

### 关键逻辑

```typescript
// 第一步：生成核心文件
const corePrompt = `${prompt}

IMPORTANT: Only generate these 3 files:
- src/App.jsx (main component)
- src/index.css (styles)
- package.json

Do NOT generate any other files yet.`

const coreProject = await callAI(corePrompt, model)

// 验证并自动修复
const validation = validateGeneratedCode(coreProject.files)
if (!validation.valid) {
  const autoFix = autoFixCode(coreProject.files, validation.errors)
  coreProject.files = autoFix.fixedFiles
}

// 第二步：根据需求生成额外文件
if (needsAdditionalFiles(prompt)) {
  const additionalFiles = await generateAdditionalFiles(prompt, coreProject, model)
  Object.assign(coreProject.files, additionalFiles)
}
```

## 预期效果

- **减少 70% 生成失败率** - 核心文件简单，AI 更可靠
- **避免超时** - 每步时间更短
- **错误定位精确** - 知道哪一步出错
- **提前预览** - 核心功能先可用

## 实施步骤

1. 修改 `generateCodeAsync` 函数支持分步生成
2. 添加 `needsAdditionalFiles` 判断逻辑
3. 添加 `generateAdditionalFiles` 函数
4. 更新进度通知（10% → 40% → 60% → 100%）
5. 测试验证

## 回滚方案

如果分步生成出现问题，可以通过环境变量快速回滚到原有逻辑：
```
ENABLE_STEP_BY_STEP_GENERATION=false
```
