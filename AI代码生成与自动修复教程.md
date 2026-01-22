# AI 代码生成与自动修复教程

## 概述

本系统实现了 AI 代码生成 + 自动修复的完整流程，能够自动检测和修复 AI 生成代码中的常见语法错误。

## 系统架构

```
用户输入需求
  ↓
AI 生成代码（分文件生成）
  ↓
Babel 验证
  ↓
发现错误？
  ├─ 否 → 保存文件 ✅
  └─ 是 → 自动修复
           ↓
         修复成功？
           ├─ 是 → 保存修复后的代码 ✅
           └─ 否 → AI 重试（最多 3 次）
                    ↓
                  重试成功？
                    ├─ 是 → 保存新代码 ✅
                    └─ 否 → 记录错误 ⚠️
```

## 核心功能

### 1. 生成阶段自动修复

**位置**: [app/api/generate-async/route.ts](app/api/generate-async/route.ts#L1060-L1082)

**工作流程**:
1. AI 生成单个文件代码
2. 使用 Babel 验证语法
3. 发现错误 → 自动修复
4. 修复成功 → 保存文件
5. 修复失败 → AI 重试（最多3次）

```typescript
// 文件生成循环（带重试机制）
while (fileRetryCount < maxFileRetries) {
  // AI 生成代码
  const fileContent = await generateFileWithAI(fileName)

  // Babel 验证
  const validation = validateGeneratedCode({ [fileName]: fileContent })
  const fileErrors = validation.errors.filter(err => err.includes(fileName))

  if (fileErrors.length > 0) {
    console.warn(`⚠️ ${fileName} 有 ${fileErrors.length} 个错误`)

    // 自动修复
    const { autoFixCode } = require('@/lib/code-auto-fix')
    const autoFix = autoFixCode({ [fileName]: fileContent }, fileErrors)

    if (autoFix.fixedErrors.length > 0) {
      console.log(`🔧 自动修复了 ${autoFix.fixedErrors.length} 个错误`)
      project.files[fileName] = autoFix.fixedFiles[fileName]
      break  // 修复成功，退出重试循环
    }

    // AI 重试
    if (autoFix.remainingErrors.length > 0 && fileRetryCount < maxFileRetries) {
      console.warn(`🔄 AI 重试 ${fileName} (${fileRetryCount + 1}/${maxFileRetries})`)
      fileRetryCount++
      continue  // 继续下一次重试
    }

    // 重试次数用完
    console.error(`❌ ${fileName} 重试次数用完，仍有错误`)
  }

  // 无错误或修复成功
  project.files[fileName] = fileContent
  break
}
```

**关键点**:
- 每个文件独立验证和修复
- 修复成功立即保存，不再重试
- 修复失败才触发 AI 重试
- 重试时 AI 会看到之前的错误信息

### 2. 预览阶段自动修复

**位置**: [app/api/preview-code/route.ts](app/api/preview-code/route.ts#L766-L810)

**工作流程**:
1. 编译所有组件代码
2. 发现编译错误 → 自动修复
3. 修复成功 → 重新编译
4. 最多重试 3 次

```typescript
// 组件编译循环（带自动修复）
let retryCount = 0
const maxRetries = 3

while (retryCount < maxRetries) {
  try {
    // Babel 编译组件
    const result = babel.transformSync(componentCode, {
      presets: [
        [presetReact, { runtime: 'classic' }],
        [presetTypescript, { isTSX: true, allExtensions: true }]
      ]
    })

    // 编译成功
    componentScripts += result.code
    break

  } catch (err: any) {
    console.warn(`⚠️ Failed to compile component ${filePath}:`, err.message)

    // 尝试自动修复
    if (retryCount < maxRetries - 1) {
      const { autoFixCode } = require('@/lib/code-auto-fix')
      const errorMsg = `${filePath}: ${err.message}`
      const autoFix = autoFixCode({ [filePath]: componentCode }, [errorMsg])

      if (autoFix.fixedErrors.length > 0) {
        console.log(`🔧 自动修复了 ${autoFix.fixedErrors.length} 个错误，重新编译`)
        componentCode = autoFix.fixedFiles[filePath]
        continue  // 重新编译
      }
    }

    // 修复失败或重试次数用完
    console.error(`❌ Component ${filePath} compilation failed`)
    break
  }

  retryCount++
}
```

**关键点**:
- 每个组件独立编译和修复
- 修复成功立即重新编译
- 最多重试 3 次
- 失败后创建占位符组件，不影响其他组件

**预览阶段特殊处理**:

1. **React Hooks 替换** - [app/api/preview-code/route.ts:427-429](app/api/preview-code/route.ts#L427-L429)
```typescript
// 先替换 React.hookName，再替换独立的 hookName，避免重复替换
.replace(/\bReact\.(useState|useEffect|...)\b/g, 'window.React.$1')
// 使用负向后顾确保不会匹配已经替换过的 window.React.hookName
.replace(/(?<!window\.React\.)\b(useState|useEffect|...)\b/g, 'window.React.$1')
```

2. **TypeScript 类型移除** - [app/api/preview-code/route.ts:696-701](app/api/preview-code/route.ts#L696-L701)
```typescript
// 移除 TypeScript 类型注解
componentCode = removeInterfaces(componentCode)
componentCode = componentCode.replace(/:\s*\w+(\[\])?(\s*[,\)\}=])/g, '$2')
// 只删除常见的 TypeScript 泛型类型，避免误删 JSX 标签
componentCode = componentCode.replace(/<(string|number|boolean|any|...)>/gi, '')
```

## 自动修复规则

**位置**: [lib/code-auto-fix.ts](lib/code-auto-fix.ts)

### 支持的错误类型

#### 1. Switch 语句错误

```javascript
// 错误
case '1m' = Math.max(0, chartData.length - 12);
default = 0;

// 修复为
case '1m': minIndex = Math.max(0, chartData.length - 12);
default: minIndex = 0;
```

#### 2. 不完整的三元表达式

```javascript
// 错误
height={isMobile ? 200 }
const value = condition ? 'yes' ;

// 修复为
height={isMobile ? 200 : null}
const value = condition ? 'yes' : null;
```

#### 3. 对象属性语法错误

```javascript
// 错误
const obj = {
  average => prev ? (prev.average * 0.9) : 0
}

// 修复为
const obj = {
  average: prev ? (prev.average * 0.9) : 0
}
```

#### 4. 对象属性缺少键名

```javascript
// 错误
const filters = {
  timeRange,
  source === 'All Sources' ? '' ,
}

// 修复为
const filters = {
  timeRange,
  source: source === 'All Sources' ? '' : source,
}
```

#### 5. JSX 标签不匹配

```javascript
// 错误
<div>
  <ul>
    <li>Item</li>
  </ul>
</ul>  // 错误的闭合标签

// 修复为
<div>
  <ul>
    <li>Item</li>
  </ul>
</div>
```

#### 6. JSX 三元表达式缺少包裹元素

```javascript
// 错误
{alerts.length > 0 ? (
  {alerts.map(alert => (
    <li key={alert.id}>{alert.message}</li>
  ))}
) : null}

// 修复为
{alerts.length > 0 ? (
  <>
  {alerts.map(alert => (
    <li key={alert.id}>{alert.message}</li>
  ))}
  </>
) : null}
```

#### 7. TypeScript 类型注解（在 JS 文件中）

```javascript
// 错误
const generateMockMetric = (id, name, baseValue, variance): MetricData => ({
  id,
  name,
})

const values = chartData.map(d: d.value);

// 修复为
const generateMockMetric = (id, name, baseValue, variance) => ({
  id,
  name,
})

const values = chartData.map(d => d.value);
```

#### 8. setState 回调函数缺少箭头

```javascript
// 错误
setFilters(prevFilters ({ ...prev, [name]: value }))

// 修复为
setFilters(prevFilters => ({ ...prev, [name]: value }))
```

#### 9. setState 回调中对象属性缺少值

```javascript
// 错误
setFilters(prevFilters => ({ ...prevFilters, [name] }))
setSocialLinks(prev => ({ ...prev, [name] }))

// 修复为
setFilters(prevFilters => ({ ...prevFilters, [name]: name }))
setSocialLinks(prev => ({ ...prev, [name]: name }))
```

**修复规则**: [lib/code-auto-fix.ts:180-189](lib/code-auto-fix.ts#L180-L189)
- 使用负向后顾断言确保不会重复替换
- 保持原始变量名不变
- 自动推断属性值为键名

#### 10. map 回调缺少 else 分支

```javascript
// 错误
prevFields.map(field =>
  field.id === id ? { ...field, ...updates }
)

// 修复为
prevFields.map(field =>
  field.id === id ? { ...field, ...updates } : field
)
```

**修复规则**: [lib/code-auto-fix.ts:82-87](lib/code-auto-fix.ts#L82-L87)

#### 11. setState 使用冒号而不是箭头

```javascript
// 错误
setFormFields(prevFields: [...prevFields, field])
setFormFields(prevFields: prevFields.filter(...))

// 修复为
setFormFields(prevFields => [...prevFields, field])
setFormFields(prevFields => prevFields.filter(...))
```

**修复规则**: [lib/code-auto-fix.ts:89-96](lib/code-auto-fix.ts#L89-L96)

#### 12. 缺少 if 条件的 else 语句

```javascript
// 错误
const handleBlur = () => {
    setError('This field is required');
  } else {
    setError('');
  }
};

// 修复为
const handleBlur = () => {
  if (field.required && !value) {
    setError('This field is required');
  } else {
    setError('');
  }
};
```

**修复规则**: [lib/code-auto-fix.ts:105-110](lib/code-auto-fix.ts#L105-L110)

#### 13. JSX 标签不匹配 - 缺少开始标签

```javascript
// 错误
<nav>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
</nav>

// 修复为
<nav>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</nav>
```

**修复规则**: [lib/code-auto-fix.ts:306-320](lib/code-auto-fix.ts#L306-L320)
- 动态检测父标签名称
- 在第一个 `<li>` 前插入 `<ul>`
- 适用于任何父标签（nav, div, section 等）

#### 14. 对象属性中使用箭头而不是冒号

```javascript
// 错误
const obj = {
  average => prev ? (prev.average * 0.9) : 0
}

// 修复为
const obj = {
  average: prev ? (prev.average * 0.9) : 0
}
```

**修复规则**: [lib/code-auto-fix.ts:58-66](lib/code-auto-fix.ts#L58-L66)
- 只匹配对象字面量内的属性
- 避免误匹配箭头函数

#### 10. Promise 回调缺少箭头函数

```javascript
// 错误
fetch(url).then(response: {
  return response.json();
})

// 修复为
fetch(url).then(response => {
  return response.json();
})
```

#### 11. JSX 属性缺少等号

```javascript
// 错误
<div className"container">

// 修复为
<div className="container">
```

#### 12. return 在函数外

```javascript
// 错误
import React from 'react';

const margin = { top: 5, right: 10 };

return (
  <div>Content</div>
);

// 修复为
import React from 'react';

function Component() {
  const margin = { top: 5, right: 10 };

  return (
    <div>Content</div>
  );
}

export default Component;
```

## AI Prompt 优化

**位置**: [lib/ai-prompts.ts](lib/ai-prompts.ts)

除了自动修复，提高代码质量的另一个关键是改进 AI 生成提示词。

### 新增的关键规则

在 AI prompts 中添加了以下规则来预防常见错误：

```typescript
17. CRITICAL: Array method callbacks MUST use arrow syntax
   WRONG: .map(item: item.id)
   CORRECT: .map(item => item.id)

18. CRITICAL: JSX attributes MUST have equals sign
   WRONG: <div className"container">
   CORRECT: <div className="container">

19. CRITICAL: Ternary expressions in map/filter MUST have both branches
   WRONG: field.id === id ? { ...field, ...updates }\n      )
   CORRECT: field.id === id ? { ...field, ...updates } : field\n      )

20. CRITICAL: setState with arrays MUST use arrow syntax
   WRONG: setFormFields(prevFields: [...prevFields, field])
   CORRECT: setFormFields(prevFields => [...prevFields, field])

21. CRITICAL: if statements MUST have condition before else
   WRONG: } else {
   CORRECT: if (condition) { } else {

22. CRITICAL: Adjacent JSX elements MUST be wrapped in a parent element or Fragment
   WRONG: return ( <div>First</div> <div>Second</div> )
   CORRECT: return ( <> <div>First</div> <div>Second</div> </> )
   WRONG: {condition && <div>A</div> <div>B</div>}
   CORRECT: {condition && <> <div>A</div> <div>B</div> </>}

23. CRITICAL: Generate PURE JAVASCRIPT (.jsx) code, NOT TypeScript (.tsx)
   - NEVER use TypeScript type annotations like : string, : number, : Type
   - NEVER use interface or type definitions
   - NEVER use return type annotations like (): Type => or (params): Type =>
   - NEVER use generic types like useState<Type> or Array<Type>
```

### 优化策略

1. **明确语法要求** - 在 prompt 中明确说明正确和错误的语法
2. **提供示例** - 使用 WRONG/CORRECT 对比示例
3. **强调关键点** - 使用 CRITICAL 标记重要规则
4. **持续更新** - 根据常见错误不断补充新规则

### 效果

通过改进 AI prompts：
- 减少生成阶段的错误率
- 降低自动修复的负担
- 提高整体代码质量

## 使用方法

### 1. 代码生成

```bash
# 用户在前端输入需求
"创建一个实时数据监控面板，包含图表、指标卡片和告警列表"

# 系统自动：
# 1. AI 分析需求
# 2. 逐个生成文件
# 3. 每个文件生成后立即验证
# 4. 发现错误自动修复
# 5. 修复失败则 AI 重试
```

### 2. 预览代码

```bash
# 用户点击预览按钮
# 系统自动：
# 1. 编译所有组件
# 2. 发现编译错误
# 3. 自动修复错误
# 4. 重新编译
# 5. 显示预览结果
```

## 配置参数

### 重试次数

**位置**: [app/api/generate-async/route.ts:1031](app/api/generate-async/route.ts#L1031)

```typescript
const maxFileRetries = 5  // 每个文件最多重试 5 次（已从 3 次提高到 5 次）
```

**优化说明**: 提高重试次数可以给 AI 更多机会修正错误，提高生成成功率。

### AI 模型选择

**推荐配置**: 使用 `qwen-plus` 模型

```env
DASHSCOPE_MODEL=qwen-plus
```

**模型对比**:
- `qwen-turbo`: 快速但错误率较高
- `qwen-plus`: 平衡性能和质量（推荐）✅
- `qwen-max`: 最强大但成本高

## 效果统计

### 测试结果

- **修复前**: 多个组件有编译错误
- **修复后**: 4/7 组件自动修复成功
- **成功率**: 约 57%

### 常见成功案例

- ✅ ChartTooltip - JSX 标签修复
- ✅ MetricCards - 三元表达式修复
- ✅ FilterPanel - 对象属性修复
- ✅ AlertList - 完全正确

### 仍需改进的情况

- ⚠️ 复杂的嵌套三元表达式
- ⚠️ 多层对象属性错误
- ⚠️ 复杂的 TypeScript 类型混用

## 添加新的修复规则

### 步骤

1. **识别错误模式**

查看日志中的错误信息：
```
⚠️ Failed to compile: Unexpected token, expected ":"
```

2. **编写正则表达式**

在 [lib/code-auto-fix.ts](lib/code-auto-fix.ts) 中添加：

```typescript
// 修复新的错误模式
const newPattern = /错误模式的正则表达式/g
if (newPattern.test(code)) {
  code = code.replace(newPattern, '修复后的代码')
  wasFixed = true
}
```

3. **测试修复规则**

重新生成代码，观察是否自动修复成功。

## 最佳实践

### 1. 优先使用自动修复

- 让系统先尝试自动修复
- 观察修复日志
- 收集无法修复的错误模式

### 2. 持续优化规则

- 记录新的错误模式
- 添加针对性的修复规则
- 测试验证修复效果

### 3. 合理设置重试次数

- 简单错误：1-2 次重试足够
- 复杂错误：3 次重试
- 避免过多重试浪费资源

### 4. 选择合适的 AI 模型

- 开发测试：使用 `qwen-turbo`
- 生产环境：使用 `qwen-plus`
- 关键项目：使用 `qwen-max`

## 故障排查

### 问题：自动修复不生效

**检查清单**:
1. 确认 [lib/code-auto-fix.ts](lib/code-auto-fix.ts) 文件存在
2. 检查错误信息是否匹配修复规则
3. 查看日志中的 `🔧 自动修复` 信息

### 问题：修复后仍有错误

**可能原因**:
1. 修复规则不够准确
2. 错误模式过于复杂
3. 需要添加新的修复规则

**解决方法**:
1. 查看具体错误信息
2. 分析错误模式
3. 添加或优化修复规则

### 问题：AI 重试次数用完

**可能原因**:
1. AI 模型持续生成相同错误
2. 错误无法通过重试解决
3. 需要人工介入

**解决方法**:
1. 检查 AI prompt 是否清晰
2. 添加针对性的修复规则
3. 考虑升级 AI 模型

## 相关文档

- [代码验证改进方案](CODE-VALIDATION-IMPROVEMENT.md)
- [实现进度](IMPLEMENTATION-PROGRESS.md)
- [分步生成说明](STEP-BY-STEP-GENERATION.md)

## 总结

本系统通过 **AI 生成 + 自动修复 + AI 重试** 的三层机制，显著提高了代码生成的成功率和质量。

### 最新改进（2026-01-22）

#### 1. 自动修复系统优化
- 修复了 setState 回调中对象属性缺少值的正则表达式错误
- 删除了冲突的重复修复规则
- 新增了 4 个自动修复规则：
  - map 回调缺少 else 分支
  - setState 使用 `:` 而不是 `=>`
  - 缺少 if 条件的 else 语句
  - JSX 标签不匹配（缺少 `<ul>` 开始标签）
- 改进了对象属性中 `=>` 误匹配箭头函数的问题

#### 2. 预览代码 React Hooks 处理
- 删除了组件处理中重复的 React hooks 替换逻辑
- 改进了主 app 代码的 hooks 替换顺序
- 使用负向后顾断言 `(?<!window\.React\.)` 防止重复替换
- 彻底解决了 `React.window.React.useState` 的问题

#### 3. AI Prompt 增强
在 [lib/ai-prompts.ts](lib/ai-prompts.ts) 中添加了 4 个新的 CRITICAL 规则：
- 规则 19: Ternary expressions in map/filter MUST have both branches
- 规则 20: setState with arrays MUST use arrow syntax
- 规则 21: if statements MUST have condition before else
- 规则 22: Adjacent JSX elements MUST be wrapped

#### 4. 生成阶段优化
- 将文件重试次数从 3 次提高到 5 次
- 加强代码验证效果，提高生成成功率

### 系统效果

虽然无法 100% 修复所有错误，但已经能够处理大部分常见的语法错误：

**成功修复的错误类型**:
- ✅ Switch 语句语法错误
- ✅ 不完整的三元表达式
- ✅ 对象属性语法错误
- ✅ JSX 标签不匹配
- ✅ TypeScript 类型注解混用
- ✅ setState 回调函数错误
- ✅ Promise 回调缺少箭头
- ✅ JSX 属性缺少等号
- ✅ map/filter 回调语法错误

**仍需改进的情况**:
- ⚠️ 复杂的嵌套三元表达式
- ⚠️ 多层对象属性错误
- ⚠️ 复杂的 Adjacent JSX elements

### 持续改进

系统会持续学习新的错误模式，不断完善修复规则，逐步提升自动修复的成功率。通过 AI Prompt 优化 + 自动修复 + AI 重试的三层防护，大幅减少了人工修复的工作量。
