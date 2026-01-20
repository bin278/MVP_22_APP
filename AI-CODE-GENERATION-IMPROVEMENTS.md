# AI 代码生成改进说明

## 问题
AI 生成的代码经常出现 `ReferenceError: right is not defined` 等未定义变量错误，特别是在图表组件中。

## 解决方案

### 1. 增强 AI 提示词规则
**文件**: [lib/ai-prompts.ts](lib/ai-prompts.ts)

添加了严格的规则（第19-22行）：
- 明确列出常见的图表变量（left, right, top, bottom, width, height, x, y, value, data）
- 要求必须先声明变量才能使用
- 禁止使用未定义的自定义 hooks（useChartData, useWebSocket 等）
- 只允许使用 React 内置 hooks

### 2. 应用到代码生成 API
**文件**: [app/api/generate-async/route.ts](app/api/generate-async/route.ts)

在第763-764行的系统提示词中应用了这些规则。

### 3. 添加代码验证
**文件**: [app/api/generate-async/route.ts:665-678](app/api/generate-async/route.ts#L665-L678)

添加了自动验证逻辑：
- 检测常见的未定义变量（left, right, top, bottom, width, height, x, y, value, data）
- 如果检测到变量被使用但未声明，验证失败
- 自动重试生成（最多2次）

## 重要说明

### 提示词使用情况
目前只有 **3 个 API** 使用了 [lib/ai-prompts.ts](lib/ai-prompts.ts) 中的提示词：
- [app/api/generate-async/route.ts](app/api/generate-async/route.ts) ✓
- [app/api/preview/route.ts](app/api/preview/route.ts)
- [app/api/preview-simple/route.ts](app/api/preview-simple/route.ts)

**其他代码生成 API 使用硬编码的提示词**，包括：
- generate
- generate-code-sync
- generate-stream
- modify-async
- modify-code

### 让改进生效的步骤

1. **重启开发服务器**
   ```bash
   # 停止服务器 (Ctrl+C)
   npm run dev
   ```

2. **清除浏览器缓存**
   - Windows: Ctrl+Shift+R
   - Mac: Cmd+Shift+R

3. **重新生成代码**
   - 输入新的需求让 AI 生成代码
   - 验证逻辑会自动检测并拒绝有错误的代码

## 技术细节

### 验证逻辑工作原理
```typescript
// 检查变量是否被使用但未声明
const usageRegex = new RegExp(`\\b${varName}\\b(?!\\s*[=:])`, 'g')
const declarationRegex = new RegExp(`(?:const|let|var)\\s+${varName}\\b`, 'g')

if (usages.length > 0 && declarations.length === 0) {
  errors.push(`Variable '${varName}' is used but not declared`)
}
```

### 自动重试机制
```typescript
if (!validation.valid && retryCount < maxRetries) {
  return generateCodeAsync(prompt, model, onProgress, retryCount + 1)
}
```

## 相关提交
- `0553cae` - 修复重复变量定义的构建错误
- `5cddc31` - 添加未定义变量检测到代码验证
- `f3feac6` - 应用改进的 AI 提示词规则到代码生成 API
- `76100c5` - 进一步增强 AI 提示词规则
- `298ed35` - 增强 AI 提示词规则，防止未定义变量错误
