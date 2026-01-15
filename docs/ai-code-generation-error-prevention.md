# AI 代码生成错误预防方案

## 问题背景

在 Vercel 部署的预览功能中，AI 生成的 React 代码出现运行时错误：
- `ReferenceError: right is not defined`
- `ReferenceError: Editor is not defined`

**根本原因**：DeepSeek API 生成的代码使用了未定义的变量和组件。

## 解决方案

### 1. 代码验证机制

位置：[app/api/preview/route.ts:5-62](app/api/preview/route.ts#L5-L62)

```typescript
function validateGeneratedCode(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 检查1: return 语句后不能跟声明
  if (/return\s*\(\s*\n\s*(const|let|var|function)\s+\w+/.test(code)) {
    errors.push('Invalid return statement')
  }

  // 检查2: JSX 标签是否闭合
  const openTags = (code.match(/<[A-Z][a-zA-Z]*/g) || []).length
  const closeTags = (code.match(/<\/[A-Z][a-zA-Z]*/g) || []).length
  if (openTags !== closeTags && openTags > 0) {
    errors.push(`Unmatched JSX tags`)
  }

  // 检查3: 括号是否匹配
  const openParens = (code.match(/\(/g) || []).length
  const closeParens = (code.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    errors.push(`Unmatched parentheses`)
  }

  // 检查4: javascript: 前缀
  if (/^\s*javascript\s+/m.test(code)) {
    errors.push('Invalid "javascript" prefix')
  }

  // 检查5: 常见未定义变量（left, right, top, bottom）
  const commonUndefinedVars = ['\\bright\\b', '\\bleft\\b', '\\btop\\b', '\\bbottom\\b']
  for (const varPattern of commonUndefinedVars) {
    const regex = new RegExp(varPattern, 'g')
    const matches = code.match(regex)
    if (matches && matches.length > 0) {
      const declarePattern = new RegExp(`(const|let|var)\\s+${varPattern.slice(2, -2)}\\s*=`, 'g')
      const declarations = code.match(declarePattern)
      if (!declarations || declarations.length < matches.length) {
        errors.push(`Potentially undefined variable: ${varPattern.slice(2, -2)}`)
      }
    }
  }

  // 检查6: 未定义的组件（大写开头的 JSX 标签）
  const jsxComponents = code.match(/<([A-Z][a-zA-Z0-9]*)/g) || []
  const componentNames = [...new Set(jsxComponents.map(tag => tag.slice(1)))]
  for (const compName of componentNames) {
    const definePattern = new RegExp(`(function\\s+${compName}\\b|const\\s+${compName}\\s*=|class\\s+${compName}\\b)`)
    if (!definePattern.test(code)) {
      errors.push(`Undefined component: ${compName}`)
    }
  }

  return { valid: errors.length === 0, errors }
}
```

### 2. 增强的系统提示词

位置：
- [app/api/preview/route.ts:96-107](app/api/preview/route.ts#L96-L107)
- [cloud-functions/generateCodeTask/index.js:124-135](cloud-functions/generateCodeTask/index.js#L124-L135)

关键规则：
```
1. Return ONLY the React component code without any imports or exports
2. Use modern React hooks (useState, useEffect, etc.) and functional components
3. Include inline styles or Tailwind classes for styling
4. Make it visually appealing and responsive
5. ALWAYS declare variables and hooks BEFORE the return statement
6. The return statement must ONLY contain JSX expressions
7. NEVER use "javascript:" prefix or similar invalid tokens
8. NEVER use undefined variables - all variables must be declared with const/let/var before use
9. Pay special attention to variables like 'left', 'right', 'top', 'bottom' - ensure they are properly declared
10. ONLY use standard HTML elements (div, button, input, etc.) or components you define in the same file
11. NEVER reference external components like Editor, Chart, etc. unless you define them first
```

### 3. 自动重试机制

位置：[app/api/preview/route.ts:118-122](app/api/preview/route.ts#L118-L122)

```typescript
if (!validation.valid && retryCount < maxRetries) {
  console.warn(`⚠️ Generated code has errors, retrying (${retryCount + 1}/${maxRetries}):`, validation.errors)
  return callDeepSeekAPI(prompt, retryCount + 1)
}
```

## 通用方案（可借鉴）

### 适用场景
- 代码预览功能
- 在线代码编辑器
- AI 代码生成平台
- 低代码/无代码平台

### 实施步骤

#### 1. 添加代码验证层
- 语法检查（括号、标签匹配）
- 变量声明检查
- 组件定义检查
- 导入依赖检查

#### 2. 优化 AI 提示词
- 明确禁止使用未定义的变量/组件
- 提供正确和错误的示例
- 强调只使用标准元素或自定义组件

#### 3. 实现重试机制
- 检测到错误时自动重试
- 在重试时提供更详细的错误信息
- 限制重试次数（避免无限循环）

#### 4. 分层防御
- 生成时验证（API 层）
- 运行时错误捕获（浏览器层）
- 用户友好的错误提示

## 关键要点

1. **预防优于修复**：在代码生成阶段就进行验证，而不是等到运行时报错
2. **明确的约束**：通过系统提示词明确告诉 AI 什么能做、什么不能做
3. **自动化修复**：通过重试机制让 AI 自我纠正
4. **渐进式部署**：修复只影响新生成的代码，不会破坏现有功能

## 效果

- 显著降低 AI 生成代码的运行时错误率
- 提高用户体验
- 减少手动修复成本

## 相关提交

- `3cbfe7f` - 修复预览页面未定义变量错误
- `372b898` - 增强代码生成验证，防止未定义变量错误
- `9fcf744` - 更新云函数系统提示词，防止未定义变量错误
- `3359f4f` - 添加未定义组件检测，防止 Editor 等组件错误
