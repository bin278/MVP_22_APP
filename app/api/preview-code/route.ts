import { NextRequest, NextResponse } from 'next/server'
import * as babel from '@babel/core'
import presetReact from '@babel/preset-react'
import presetTypescript from '@babel/preset-typescript'

// 验证生成的代码是否有明显错误
function validateGeneratedCode(code: string, allFiles: Record<string, string>): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  // 获取所有已定义的组件名
  const definedComponents = new Set<string>()
  definedComponents.add('App')
  for (const filePath of Object.keys(allFiles)) {
    const name = filePath.split('/').pop()?.replace(/\.(jsx|tsx|js|ts)$/, '') || ''
    if (name) definedComponents.add(name)
  }

  // 检查未定义的组件（大写开头的标签）
  const jsxComponents = code.match(/<([A-Z][a-zA-Z0-9]*)/g) || []
  const componentNames = [...new Set(jsxComponents.map(tag => tag.slice(1)))]
  const builtinComponents = ['React', 'Fragment', 'Suspense', 'StrictMode', 'Provider']

  for (const compName of componentNames) {
    if (!definedComponents.has(compName) && !builtinComponents.includes(compName)) {
      // 检查组件是否在代码中被定义
      const definePattern = new RegExp(`(function\\s+${compName}\\b|const\\s+${compName}\\s*=|class\\s+${compName}\\b)`)
      if (!definePattern.test(code)) {
        warnings.push(`Component "${compName}" may not be defined`)
      }
    }
  }

  // 检查未定义的自定义 hooks（use 开头的函数调用）
  const customHooks = code.match(/\b(use[A-Z][a-zA-Z0-9]*)\s*\(/g) || []
  const hookNames = [...new Set(customHooks.map(hook => hook.replace(/\s*\($/, '')))]
  const builtinHooks = ['useState', 'useEffect', 'useContext', 'useReducer', 'useCallback', 'useMemo', 'useRef', 'useImperativeHandle', 'useLayoutEffect', 'useDebugValue', 'useId', 'useTransition', 'useDeferredValue', 'useSyncExternalStore', 'useInsertionEffect']

  for (const hookName of hookNames) {
    if (!builtinHooks.includes(hookName)) {
      // 检查 hook 是否在代码中被定义
      const definePattern = new RegExp(`(function\\s+${hookName}\\b|const\\s+${hookName}\\s*=)`)
      if (!definePattern.test(code)) {
        errors.push(`Undefined custom hook: ${hookName}`)
      }
    }
  }

  // 检查常见未定义变量（left, right, top, bottom）
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

  return { valid: errors.length === 0, errors, warnings }
}

// Calculate code complexity to prevent preview crashes
// Optimized algorithm to better reflect actual complexity
function calculateComplexity(code: string): number {
  let score = 0

  // Length factor (reduced weight)
  score += Math.log10(code.length + 1) * 5

  // Line count factor (reduced weight)
  const lines = code.split('\n').length
  score += Math.log10(lines + 1) * 3

  // Component nesting (reduced weight - braces are common in JSX)
  const openBraces = (code.match(/\{/g) || []).length
  score += openBraces * 0.1

  // JSX complexity (reduced weight - JSX elements are normal in React)
  const jsxElements = (code.match(/<[A-Z][a-zA-Z]*/g) || []).length
  score += jsxElements * 0.5

  // Hooks usage (reduced weight - hooks are essential in React)
  const hooks = (code.match(/use(State|Effect|Callback|Memo|Ref|Context|Reducer)/g) || []).length
  score += hooks * 2

  // Event handlers (reduced weight)
  const handlers = (code.match(/on[A-Z][a-zA-Z]+/g) || []).length
  score += handlers * 1

  // Nested functions (reduced weight)
  const functions = (code.match(/function\s+\w+/g) || []).length
  score += functions * 2

  // Ternary operators (reduced weight)
  const ternaries = (code.match(/\?[^:]+:/g) || []).length
  score += ternaries * 1

  return Math.round(score)
}

export async function POST(request: NextRequest) {
  try {
    const { code, files, device = 'desktop' } = await request.json()

    // 调试：打印接收到的代码的前 500 个字符
    console.log('🔍 Received code type:', typeof code)
    console.log('🔍 Received code (first 500 chars):', typeof code === 'string' ? code?.substring(0, 500) : JSON.stringify(code)?.substring(0, 500))
    console.log('🔍 Code includes actual newlines:', typeof code === 'string' ? code?.includes('\n') : 'N/A')
    console.log('🔍 Code includes literal \\n:', typeof code === 'string' ? code?.includes('\\n') : 'N/A')

    // 确保 code 是字符串
    let codeStr = code
    if (typeof code !== 'string') {
      if (code && typeof code === 'object') {
        // 如果是对象，尝试获取其内容
        codeStr = code.content || code.code || JSON.stringify(code)
      } else {
        return NextResponse.json(
          { error: 'Code must be a string' },
          { status: 400 }
        )
      }
    }

    if (!codeStr || typeof codeStr !== 'string') {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    // Check code complexity to prevent crashes
    const codeLength = codeStr.length
    const lineCount = codeStr.split('\n').length
    const complexityScore = calculateComplexity(codeStr)

    console.log('🔍 Code complexity analysis:', {
      length: codeLength,
      lines: lineCount,
      complexity: complexityScore
    })

    // Reject if code is too complex (limits increased 3x for better support)
    if (codeLength > 300000) { // 300KB limit (increased from 100KB)
      return NextResponse.json(
        {
          error: 'Generated code is too large for preview',
          details: `Code size: ${Math.round(codeLength / 1024)}KB (max: 300KB). Please try generating a simpler component.`
        },
        { status: 400 }
      )
    }

    if (lineCount > 5000) { // 5000 lines limit (increased from 2000)
      return NextResponse.json(
        {
          error: 'Generated code is too long for preview',
          details: `Code lines: ${lineCount} (max: 5000). Please try generating a simpler component.`
        },
        { status: 400 }
      )
    }

    if (complexityScore > 1500) { // High complexity threshold (increased from 500)
      return NextResponse.json(
        {
          error: 'Generated code is too complex for browser preview',
          details: `Complexity score: ${complexityScore}. The preview uses in-browser compilation which has limits. Please try generating a simpler component or use the code directly.`
        },
        { status: 400 }
      )
    }

    // Get all files for multi-file support
    const allFiles = files || {}
    let appCode = codeStr.trim()

    // 验证代码
    const validation = validateGeneratedCode(appCode, allFiles)
    if (validation.warnings.length > 0) {
      console.log('⚠️ Code validation warnings:', validation.warnings)
    }

    // 修复：将字面 \n 转换为实际换行符
    if (appCode.includes('\\n') && !appCode.includes('\n')) {
      console.log('🔧 Converting literal \\n to actual newlines')
      // 只转换换行符和制表符，不要转换引号（引号可能是代码中的字符串）
      appCode = appCode.replace(/\\n/g, '\n').replace(/\\t/g, '  ')
    }

    // 修复：替换 AI 生成的占位符 [...] 为空数组
    if (appCode.includes('[...]')) {
      console.log('🔧 Replacing [...] placeholders with empty arrays')
      appCode = appCode.replace(/\[\.\.\.\]/g, '[]')
    }

    // 修复：替换 AI 生成的占位符 {...} 为空对象
    if (appCode.includes('{...}')) {
      console.log('🔧 Replacing {...} placeholders with empty objects')
      appCode = appCode.replace(/\{\.\.\.\}/g, '{}')
    }

    // Clean up the component code before embedding
    let cleanCode = appCode

    // Helper function to remove TypeScript interface definitions with nested braces
    const removeInterfaces = (code: string): string => {
      let result = code
      let hasChanges = true

      while (hasChanges) {
        hasChanges = false
        // Find interface declarations
        const interfaceRegex = /interface\s+\w+\s*(?:<[^>]+>)?\s*\{/g
        let match: RegExpExecArray | null

        while ((match = interfaceRegex.exec(result)) !== null) {
          const startIndex = match.index
          // The opening brace is at the end of the match
          let braceCount = 1
          let endIndex = match.index + match[0].length

          // Count braces starting from after the opening brace
          for (let i = endIndex; i < result.length; i++) {
            if (result[i] === '{') braceCount++
            else if (result[i] === '}') {
              braceCount--
              if (braceCount === 0) {
                endIndex = i + 1
                break
              }
            }
          }

          // Remove the entire interface definition
          const before = result.substring(0, startIndex)
          const after = result.substring(endIndex)
          result = before + after
          hasChanges = true
          break // Start over after each removal
        }
      }

      return result
    }

    // Helper function to remove generic type parameters from React hooks
    // Handles window.React.useState<T> and React.useState<T> patterns
    const removeGenericsFromHooks = (code: string): string => {
      let result = code

      // Remove generics from window.React.HookName<...> patterns
      const windowReactHookRegex = /window\.React\.(useState|useEffect|useCallback|useMemo|useRef|useContext|useReducer|useLayoutEffect)</g
      let match: RegExpExecArray | null

      // First, handle window.React.HookName<...> patterns
      while ((match = windowReactHookRegex.exec(result)) !== null) {
        const hookName = match[1]
        const fullMatch = 'window.React.' + hookName
        const startIndex = match.index
        const afterHook = result.substring(startIndex + fullMatch.length)

        // Check if followed by < with optional whitespace
        const nextCharMatch = afterHook.match(/^\s*</)

        if (nextCharMatch) {
          let bracketCount = 1
          let endIndex = startIndex + fullMatch.length + nextCharMatch[0].length

          // Count brackets to find matching >
          for (let i = endIndex; i < result.length; i++) {
            if (result[i] === '<') bracketCount++
            else if (result[i] === '>') {
              bracketCount--
              if (bracketCount === 0) {
                endIndex = i + 1
                break
              }
            }
          }

          // Remove <...>
          result = result.substring(0, startIndex + fullMatch.length) + result.substring(endIndex)
          // Reset regex to search again
          windowReactHookRegex.lastIndex = 0
        }
      }

      // Then, handle standalone HookName<...> patterns (without window.React.)
      const standaloneHookRegex = /\b(useState|useEffect|useCallback|useMemo|useRef|useContext|useReducer|useLayoutEffect)</g

      while ((match = standaloneHookRegex.exec(result)) !== null) {
        const hookName = match[1]
        const startIndex = match.index
        const afterHook = result.substring(startIndex + hookName.length)

        // Check if followed by < with optional whitespace
        const nextCharMatch = afterHook.match(/^\s*</)

        if (nextCharMatch) {
          let bracketCount = 1
          let endIndex = startIndex + hookName.length + nextCharMatch[0].length

          // Count brackets to find matching >
          for (let i = endIndex; i < result.length; i++) {
            if (result[i] === '<') bracketCount++
            else if (result[i] === '>') {
              bracketCount--
              if (bracketCount === 0) {
                endIndex = i + 1
                break
              }
            }
          }

          // Remove <...>
          result = result.substring(0, startIndex + hookName.length) + result.substring(endIndex)
          // Reset regex to search again
          standaloneHookRegex.lastIndex = 0
        }
      }

      return result
    }

    // Remove TypeScript type annotations - MUST DO THIS FIRST
    console.log('🔧 Before interface removal, code sample:', cleanCode.substring(0, 500))

    // Remove interface definitions
    cleanCode = removeInterfaces(cleanCode)

    // Remove type definitions - handle multi-line object types
    const removeTypes = (code: string): string => {
      let result = code
      let hasChanges = true

      while (hasChanges) {
        hasChanges = false
        // Find type declarations: type Name = {
        const typeRegex = /type\s+\w+\s*(?:<[^>]+>)?\s*=\s*\{/g
        let match: RegExpExecArray | null

        while ((match = typeRegex.exec(result)) !== null) {
          const startIndex = match.index
          let braceCount = 1
          let endIndex = match.index + match[0].length

          // Count braces starting from after the opening brace
          for (let i = endIndex; i < result.length; i++) {
            if (result[i] === '{') braceCount++
            else if (result[i] === '}') {
              braceCount--
              if (braceCount === 0) {
                endIndex = i + 1
                break
              }
            }
          }

          // Remove the entire type definition including the semicolon if present
          if (endIndex < result.length && result[endIndex] === ';') {
            endIndex++
          }

          const before = result.substring(0, startIndex)
          const after = result.substring(endIndex)
          result = before + after
          hasChanges = true
          break // Start over after each removal
        }
      }

      return result
    }

    cleanCode = removeTypes(cleanCode)

    console.log('🔧 After interface/type removal, code sample:', cleanCode.substring(0, 500))

    cleanCode = cleanCode
      // Remove HTML comments (like <!-- src/App.tsx -->)
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove TypeScript type annotations from const declarations with generics (e.g., const App: React.FC<Props> = -> const App =)
      .replace(/const\s+(\w+)\s*:\s*[^=]+=\s*(?=\(|function)/g, (_, name) => `const ${name} = `)
      // Remove TypeScript type annotations from array destructuring (e.g., const [a, b]: Type = -> const [a, b] =)
      .replace(/(\])\s*:\s*[^=]+=/g, '$1 =')
      // Remove TypeScript type annotations from arrow function parameters (e.g., (param: string) => -> (param) =>)
      // 只处理包含 TypeScript 类型注解的箭头函数参数
      .replace(/\(([^)]*)\)\s*=>/g, (match, params) => {
        // 只有当参数包含 TypeScript 类型关键字时才处理
        if (/:\s*(string|number|boolean|any|void|never|unknown|null|undefined|React\.\w+|Array<|Promise<)/.test(params)) {
          const cleanParams = params.replace(/:\s*(string|number|boolean|any|void|never|unknown|null|undefined|React\.\w+|Array<[^>]+>|Promise<[^>]+>|\w+\[\])/g, '')
          return `(${cleanParams}) =>`
        }
        return match
      })
      // Remove export statements
      .replace(/export\s+default\s+/g, '')
      .replace(/export\s+/g, '')
      // Transform React imports BEFORE removing them
      // Convert: import React, { useState, useEffect } from 'react'
      .replace(/import\s+React\s*,\s*{[^}]+}\s+from\s+['"\`]react['"\`];?\s*\n/g, () => {
        // Remove this import completely, hooks will use React.namespace
        return ''
      })
      .replace(/import\s+React\s+from\s+['"\`]react['"\`];?\s*\n/g, '')
      .replace(/import\s+{[^}]+}\s+from\s+['"\`]react['"\`];?\s*\n/g, () => {
        // Remove hooks-only imports, they'll use React.namespace
        return ''
      })
      // Remove other import statements
      // Handle multi-line imports first (like { LineChart, Line, ... } from 'recharts')
      .replace(/import\s*{\s*[\s\S]*?\s*}\s*from\s+['"`][^'"`]*['"`];?/g, '')
      .replace(/import\s+.*?\s+from\s+['"\`]lucide-react['"\`];?\s*\n/g, '')
      // Remove react-dom imports
      .replace(/import\s+.*?\s+from\s+['"\`]react-dom['"\`];?\s*\n/g, '')
      // Remove other imports from third-party packages (excluding react, already handled)
      .replace(/import\s+.*?\s+from\s+['"\`](?!react['"])[^'"`]*['"\`];?\s*\n/g, '')
      .replace(/import\s*\(\s*['"\`].*?['"\`]\s*\);?\s*\n/g, '')
      .replace(/const\s+\w+\s*=\s*require\s*\(['"\`].*?['"\`]\);?\s*\n/g, '')
      // Replace hooks with window.React.namespace to ensure they work in Babel-compiled scope
      // 先替换 React.hookName，再替换独立的 hookName，避免重复替换
      .replace(/\bReact\.(useState|useEffect|useCallback|useMemo|useRef|useContext|useReducer|useLayoutEffect)\b/g, 'window.React.$1')
      // 使用负向后顾确保不会匹配已经替换过的 window.React.hookName
      .replace(/(?<!window\.React\.)\b(useState|useEffect|useCallback|useMemo|useRef|useContext|useReducer|useLayoutEffect)\b/g, 'window.React.$1')
      .trim()

    // Remove generic type parameters from hooks (e.g., useState<Todo[]> -> useState)
    // Pattern: Match hooks with <...> type parameters
    console.log('🔧 Before removeGenericsFromHooks, checking for hooks with generics:')
    console.log('Contains useState<', cleanCode.includes('useState<'))
    console.log('Contains window.React.useState<', cleanCode.includes('window.React.useState<'))

    // Find a sample to debug
    const useStateMatch = cleanCode.match(/window\.React\.useState<[^>]+>/)
    if (useStateMatch) {
      console.log('Found useState with generics:', useStateMatch[0])
    }

    cleanCode = removeGenericsFromHooks(cleanCode)

    console.log('🔧 After removeGenericsFromHooks:')
    console.log('Contains useState<', cleanCode.includes('useState<'))
    console.log('Contains window.React.useState<', cleanCode.includes('window.React.useState<'))

    // Remove type annotations in function parameters (only for TypeScript code)
    // 只在检测到 TypeScript 特征时才移除类型注解
    const hasTypeScriptFeatures = /:\s*(string|number|boolean|any|void|never|unknown|null|undefined|React\.\w+|Array<|Promise<|Record<|Partial<|Required<)/.test(cleanCode)
    if (hasTypeScriptFeatures) {
      // 只移除函数参数中的类型注解，格式: (param: Type)
      cleanCode = cleanCode.replace(/\(([^)]*)\)/g, (match, params) => {
        // 只处理包含类型注解的参数
        if (/:\s*(string|number|boolean|any|void|never|unknown|null|undefined|React\.\w+|Array<|Promise<)/.test(params)) {
          const cleanParams = params.replace(/:\s*(string|number|boolean|any|void|never|unknown|null|undefined|React\.\w+|Array<[^>]+>|Promise<[^>]+>|\w+\[\])/g, '')
          return `(${cleanParams})`
        }
        return match
      })
      // Remove return type annotations: ): Type {  or ): Type =>
      cleanCode = cleanCode.replace(/\)\s*:\s*(string|number|boolean|any|void|never|unknown|null|undefined|React\.\w+|JSX\.Element|Array<[^>]+>|Promise<[^>]+>|\w+\[\])(\s*[{=])/g, ')$2')
    }

    // Remove TypeScript 'as' type assertions (e.g., value as Category, value as any)
    cleanCode = cleanCode.replace(/\s+as\s+\w+/g, '')
    cleanCode = cleanCode.replace(/\s+as\s+\{[^}]+\}/g, '') // Remove as { ... }
    cleanCode = cleanCode.replace(/\s+as\s+\([^)]+\)/g, '') // Remove as ( ... )
    cleanCode = cleanCode.replace(/\s+as\s+<[^>]+>/g, '') // Remove as < ... >

    cleanCode = cleanCode
      // Fix broken template strings in JSX attributes (e.g., title={${...}} -> title={`${...}`})
      .replace(/=\{(\$\{[^}]+\}[^}]*)\}/g, '={`$1`}')
      // Handle javascript: protocol in links (ONLY replace javascript: protocol, not the word itself)
      // Only replace javascript: protocol, not standalone javascript word to avoid breaking code
      .replace(/javascript:\s*[^;]*;?/gi, 'void(0);')
      .replace(/javascript:/gi, 'void(0);')
      .trim()
    
    // Remove any standalone "javascript" word that appears at the start of lines or after return statements
    // This can happen if code cleaning left behind invalid tokens
    cleanCode = cleanCode
      .replace(/^\s*javascript\s*$/gm, '')  // Remove standalone "javascript" on its own line
      .replace(/\breturn\s*\(\s*javascript\s*/g, 'return (')  // Remove "javascript" after "return ("
      .replace(/\(\s*javascript\s+/g, '(')  // Remove "javascript" after opening parenthesis
      .replace(/\s+javascript\s*$/gm, '')  // Remove "javascript" at end of lines
      .replace(/\n\s*javascript\s*\n/g, '\n')  // Remove "javascript" on its own line between other lines
      .trim()

    console.log('Original code:', appCode.substring(0, 300) + '...')
    console.log('Clean code:', cleanCode.substring(0, 300) + '...')
    console.log('Contains Recharts import:', cleanCode.includes('recharts') || appCode.includes('recharts'))
    console.log('Contains ResponsiveContainer:', cleanCode.includes('ResponsiveContainer'))
    console.log('Clean code full length:', cleanCode.length)

    // Fix malformed return statements like "return (\nconst X = 1;"
    // This happens when AI generates code with return followed by constants/variables
    const fixMalformedReturn = (code: string): string => {
      // Pattern: return ( followed by const/let/var/function on next lines
      // This is invalid JS - we need to remove the "return (" and wrap everything in a proper function
      const returnWithConstPattern = /return\s*\(\s*\n\s*(const|let|var|function)\s+\w+/g;

      if (returnWithConstPattern.test(code)) {
        console.log('⚠️ Detected malformed return statement - return followed by const/function');

        // Remove the "return (" part and any closing parenthesis that might be at the end
        let fixed = code
          .replace(/return\s*\(\s*\n/g, '\n')  // Remove "return (" at the start
          .replace(/\n\s*\)\s*$/g, '\n')      // Remove closing ")" at the end
          .replace(/;\s*\)\s*$/g, ';')         // Remove ");" at end of lines
          .trim();

        console.log('Fixed malformed return - removed dangling return statement');
        return fixed;
      }

      return code;
    };

    // Apply the fix before processing
    cleanCode = fixMalformedReturn(cleanCode);

    // Ensure the code has a proper App component declaration
    // First check if code already has App function (avoid double wrapping)
    const hasAppDeclaration = cleanCode.includes('function App') ||
                              cleanCode.includes('const App =') ||
                              cleanCode.includes('const App:') ||
                              cleanCode.includes('App = ')
    if (!hasAppDeclaration) {
      console.log('Code does not have App function, will wrap it')

      // Clean up any remaining invalid tokens before processing
      cleanCode = cleanCode
        .replace(/^\s*javascript\s*$/gm, '')
        .replace(/\breturn\s*\(\s*javascript\s*/g, 'return (')
        .replace(/\(\s*javascript\s+/g, '(')
        .replace(/\s+javascript\s*$/gm, '')
        .replace(/\n\s*javascript\s*\n/g, '\n')
        .trim()

      const trimmedCode = cleanCode.trim()

      // Check if the code is a JSX return statement (most common case)
      // BUT NOT if it starts with 'function' (that's a component function, not a return statement)
      if (trimmedCode.startsWith('return') || (trimmedCode.startsWith('(') && !trimmedCode.startsWith('function') && !trimmedCode.match(/^\(\s*function/))) {
        // It's already a return statement, wrap it in App function
        cleanCode = 'function App() {\n' + cleanCode + '\n}'
        console.log('Wrapped return statement in App function')
      }
      // Check if it's a component function definition (function ComponentName or const ComponentName =)
      // This MUST come after checking for return statements
      // Also check if code starts with function/const after removing leading invalid tokens
      else if (/^(function\s+\w+|const\s+\w+\s*=\s*(function|\(|=>))/.test(trimmedCode) ||
               /^\s*(javascript\s+)?(function\s+\w+|const\s+\w+\s*=\s*(function|\(|=>))/.test(trimmedCode)) {
        // Remove any leading "javascript" word if present
        cleanCode = cleanCode.replace(/^\s*javascript\s+/m, '').trim()
        const finalTrimmedCode = cleanCode.trim()
        // It's a component function, extract the component name
        const functionMatch = finalTrimmedCode.match(/^function\s+(\w+)/)
        const constMatch = finalTrimmedCode.match(/^const\s+(\w+)\s*=/)

        let componentName = null
        if (functionMatch) {
          componentName = functionMatch[1]
          console.log('Found function component:', componentName)
        } else if (constMatch) {
          componentName = constMatch[1]
          console.log('Found const component:', componentName)
        } else {
          // Fallback: try to find any function name in the code
          const anyFunctionMatch = cleanCode.match(/(?:function|const)\s+(\w+)/)
          if (anyFunctionMatch) {
            componentName = anyFunctionMatch[1]
            console.log('Found component via fallback:', componentName)
          }
        }

        if (componentName) {
          // CRITICAL: Keep the component function definition OUTSIDE App function
          // Then add App function that returns it
          // The component function should remain at the top level, not inside App
          cleanCode = cleanCode + '\n\nfunction App() {\n  if (typeof ' + componentName + ' === "undefined") {\n    console.error("ERROR: Component ' + componentName + ' is not defined!");\n    return React.createElement("div", null, "Error: Component ' + componentName + ' not found");\n  }\n  return React.createElement(' + componentName + ');\n}'
          console.log('Final code structure: Component function + App function that returns it')
          console.log('Component name:', componentName)
          console.log('Code preview:', cleanCode.substring(0, 400))
        } else {
          // Last resort: wrap and return the code directly
          console.log('No component name found, wrapping code directly')
          // Check if code already has a return statement
          if (cleanCode.includes('return')) {
            cleanCode = 'function App() {\n' + cleanCode + '\n}'
          } else {
            cleanCode = 'function App() {\n  return (\n' + cleanCode + '\n  );\n}'
          }
        }
      }
      // Otherwise, assume it's JSX that needs to be returned
      else {
        cleanCode = 'function App() {\n  return (\n' + cleanCode + '\n  );\n}'
        console.log('Wrapped JSX in App function')
      }

      console.log('Wrapped in function App():', cleanCode.substring(0, 400) + '...')
      console.log('Final cleanCode length:', cleanCode.length)
    } else {
      console.log('Code already has App declaration, validating...')

      // Even if App function exists, it might be malformed
      // Check for "return (" followed by const/let/var/function
      const malformedReturnPattern = /function\s+App\s*\([^)]*\)\s*\{[^}]*return\s*\(\s*\n\s*(const|let|var|function)\s+\w+/;
      if (malformedReturnPattern.test(cleanCode)) {
        console.warn('⚠️ App function has malformed return statement - fixing...')

        // Extract the code after "return (" and fix it
        const appMatch = cleanCode.match(/(function\s+App\s*\([^)]*\)\s*\{)([\s\S]*?)(\}$)/);
        if (appMatch) {
          const appHeader = appMatch[1];  // "function App() {"
          let appBody = appMatch[2];      // Everything between { and }

          // Remove the malformed "return (" and closing ")"
          appBody = appBody
            .replace(/return\s*\(\s*\n/g, '\n')
            .replace(/\n\s*\)\s*$/g, '\n')
            .trim();

          // Rebuild with proper return
          cleanCode = `${appHeader}\n  return (\n${appBody}\n  );\n}`;
          console.log('✅ Fixed malformed App function');
          console.log('Fixed App preview:', cleanCode.substring(0, 400));
        }
      }

      // Check if existing App function has a return statement
      if (cleanCode.includes('function App') && !cleanCode.match(/function\s+App\s*\([^)]*\)\s*\{[^}]*return/)) {
        console.warn('WARNING: App function exists but may not have return statement!')
        console.log('App function code:', cleanCode.match(/function\s+App\s*\([^)]*\)\s*\{[^}]*\}/)?.[0] || 'not found')
      }
    }

    // 处理多文件组件
    let componentScripts = ''
    let hookScripts = ''
    let utilScripts = 'window.utils = window.utils || {};\n'

    // 排除的非组件文件和目录（只排除后端代码）
    const excludedFiles = ['src/App.jsx', 'src/App.tsx', 'src/index.css', 'src/index.ts', 'src/index.tsx', 'src/main.tsx', 'src/main.ts']
    const excludedDirs = ['src/services/', 'src/api/', 'src/app/', 'app/']

    // 文件分类
    const hookFiles: [string, string][] = []
    const utilFiles: [string, string][] = []
    const componentFiles: [string, string][] = []

    // 遍历所有文件并分类
    for (const [filePath, fileCode] of Object.entries(allFiles)) {
      if (excludedFiles.includes(filePath)) continue
      if (excludedDirs.some(dir => filePath.startsWith(dir))) continue

      // 解码 HTML 实体
      const code = String(fileCode)
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")

      if (filePath.includes('/hooks/') || filePath.includes('\\hooks\\') || filePath.startsWith('hooks/')) {
        hookFiles.push([filePath, code])
      } else if (filePath.includes('/utils/') || filePath.includes('\\utils\\') || filePath.startsWith('utils/')) {
        utilFiles.push([filePath, code])
      } else if (filePath.includes('/components/') || filePath.includes('\\components\\') || filePath.startsWith('components/')) {
        if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) {
          componentFiles.push([filePath, code])
        }
      } else if (filePath.startsWith('src/') && (filePath.endsWith('.jsx') || filePath.endsWith('.tsx'))) {
        componentFiles.push([filePath, code])
      }
    }

    console.log('📁 All files received:', Object.keys(allFiles))
    console.log('📁 All files content lengths:', Object.entries(allFiles).map(([k, v]) => `${k}: ${String(v).length}`))
    console.log('📁 Hook files found:', hookFiles.map(([p]) => p))
    console.log('📁 Util files found:', utilFiles.map(([p]) => p))
    console.log('📁 Component files found:', componentFiles.map(([p]) => p))

    // 编译 Hook 文件
    if (hookFiles.length > 0) {
      console.log(`🔨 Processing ${hookFiles.length} hook files`)

      for (const [filePath, fileCode] of hookFiles) {
        const hookName = filePath.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || ''
        if (!hookName) continue

        console.log(`📄 Compiling hook: ${hookName}`)

        try {
          let hookCode = String(fileCode).trim()

          // 修复换行符
          if (hookCode.includes('\\n') && !hookCode.includes('\n')) {
            hookCode = hookCode.replace(/\\n/g, '\n').replace(/\\t/g, '  ')
          }

          // 移除 import 语句
          hookCode = hookCode.replace(/^import\s+.*?['"];?\s*$/gm, '')
          // 移除 export 关键字
          hookCode = hookCode.replace(/export\s+(default\s+)?(function|const|let|var)\s+/g, '$2 ')

          // 使用 Babel 编译
          const result = babel.transformSync(hookCode, {
            presets: [
              [presetReact, { runtime: 'classic' }],
              [presetTypescript, { isTSX: false, allExtensions: true }]
            ],
            filename: `${hookName}.ts`
          })

          if (result?.code) {
            hookScripts += `
              // Hook: ${hookName}
              (function() {
                ${result.code}
                if (typeof ${hookName} !== 'undefined') {
                  window.${hookName} = ${hookName};
                  console.log('✅ Registered hook: ${hookName}');
                }
              })();
            `
            console.log(`✅ Compiled hook: ${hookName}`)
          }
        } catch (err: any) {
          console.warn(`⚠️ Failed to compile hook ${hookName}:`, err.message)
        }
      }
    }

    // 编译工具函数文件
    if (utilFiles.length > 0) {
      console.log(`🔨 Processing ${utilFiles.length} util files`)

      for (const [filePath, fileCode] of utilFiles) {
        const fileName = filePath.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || ''
        if (!fileName) continue

        console.log(`📄 Compiling util: ${fileName}`)

        try {
          let utilCode = String(fileCode).trim()

          // 修复换行符
          if (utilCode.includes('\\n') && !utilCode.includes('\n')) {
            utilCode = utilCode.replace(/\\n/g, '\n').replace(/\\t/g, '  ')
          }

          // 移除 import 语句
          utilCode = utilCode.replace(/^import\s+.*?['"];?\s*$/gm, '')
          // 移除 export 关键字
          utilCode = utilCode.replace(/export\s+(default\s+)?(function|const|let|var)\s+/g, '$2 ')

          // 使用 Babel 编译
          const result = babel.transformSync(utilCode, {
            presets: [[presetTypescript, { isTSX: false, allExtensions: true }]],
            filename: `${fileName}.ts`
          })

          if (result?.code) {
            utilScripts += `
              // Util: ${fileName}
              (function() {
                ${result.code}
                // 尝试注册函数到 window.utils
                try {
                  if (typeof ${fileName} !== 'undefined') {
                    window.utils.${fileName} = ${fileName};
                    console.log('✅ Registered util: ${fileName}');
                  }
                } catch (e) {
                  console.warn('Failed to register util ${fileName}:', e);
                }
              })();
            `
            console.log(`✅ Compiled util: ${fileName}`)
          }
        } catch (err: any) {
          console.warn(`⚠️ Failed to compile util ${fileName}:`, err.message)
        }
      }
    }

    if (componentFiles.length > 0) {
      console.log(`🔧 Processing ${componentFiles.length} component files`)

      for (const [filePath, fileCode] of componentFiles) {
        let componentCode = '' // 移到外层作用域
        let componentName = '' // 移到外层作用域
        try {
          // 获取组件名
          componentName = filePath.split('/').pop()?.replace(/\.(jsx|tsx)$/, '') || ''
          if (!componentName) continue

          componentCode = String(fileCode).trim()

          console.log(`📄 Component ${componentName} raw code length:`, componentCode.length)
          console.log(`📄 Component ${componentName} raw code preview:`, componentCode.substring(0, 200))

          // 修复换行符
          if (componentCode.includes('\\n') && !componentCode.includes('\n')) {
            // 只转换换行符和制表符，不要转换引号
            componentCode = componentCode.replace(/\\n/g, '\n').replace(/\\t/g, '  ')
          }

          // 替换占位符
          componentCode = componentCode.replace(/\[\.\.\.\]/g, '[]').replace(/\{\.\.\.\}/g, '{}')

          // 移除 import 语句
          componentCode = componentCode.replace(/^import\s+.*?['"];?\s*$/gm, '')

          // 移除 TypeScript 类型
          componentCode = removeInterfaces(componentCode)
          componentCode = componentCode.replace(/:\s*\w+(\[\])?(\s*[,\)\}=])/g, '$2')
          // 移除 TypeScript 泛型（但不要删除 JSX 标签）
          // 只删除常见的 TypeScript 泛型类型，避免误删 JSX 标签
          componentCode = componentCode.replace(/<(string|number|boolean|any|unknown|never|void|null|undefined|object|Array|Promise|Record|Partial|Required|Pick|Omit)>/gi, '')

          // 移除所有 export 语句
          componentCode = componentCode
            .replace(/export\s+default\s+/g, '')  // export default function/class
            .replace(/export\s+\{[^}]+\}\s*;?/g, '')  // export { ... }
            .replace(/export\s+\*/g, '')  // export *
            .replace(/^export\s+/gm, '')  // 行首的 export

          // 编译组件
          const result = babel.transformSync(componentCode, {
            presets: [
              [presetReact, { runtime: 'classic' }],
              [presetTypescript, { isTSX: true, allExtensions: true }]
            ],
            filename: `${componentName}.tsx`,
          })

          if (result?.code) {
            let compiledCode = result.code

            // 移除编译后代码中残留的 export 语句
            compiledCode = compiledCode
              .replace(/exports\.__esModule\s*=\s*true;?/g, '')
              .replace(/exports\.default\s*=\s*/g, 'var ' + componentName + ' = ')
              .replace(/Object\.defineProperty\(exports[^;]+;/g, '')
              .replace(/exports\.\w+\s*=\s*/g, '')
              .trim()

            const escapedComponentCode = compiledCode
              .replace(/<\/script>/gi, '<\\/script>')
              .replace(/<!--/g, '<\\!--')
              .replace(/-->/g, '--\\>')

            componentScripts += `
      // Component: ${componentName}
      (function() {
        try {
          ${escapedComponentCode}

          // 使用错误边界包装组件
          var Original${componentName} = ${componentName};
          window.${componentName} = function(props) {
            try {
              return React.createElement(Original${componentName}, props);
            } catch (renderError) {
              console.error('❌ Component ${componentName} render error:', renderError);
              return React.createElement('div', {
                style: {
                  padding: '20px',
                  margin: '10px',
                  border: '2px solid #dc2626',
                  borderRadius: '8px',
                  backgroundColor: '#fef2f2',
                  color: '#991b1b'
                }
              },
                React.createElement('strong', null, '⚠️ ${componentName} Error'),
                React.createElement('p', { style: { fontSize: '14px', marginTop: '8px' } }, renderError.message),
                React.createElement('button', {
                  onClick: function() { window.location.reload(); },
                  style: {
                    marginTop: '10px',
                    padding: '6px 12px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }
                }, 'Reload Page')
              );
            }
          };
          console.log('✅ Loaded component: ${componentName}');
        } catch(e) {
          console.error('❌ Failed to load component ${componentName}:', e);
          window.${componentName} = function() {
            return React.createElement('div', {
              style: {
                padding: '20px',
                margin: '10px',
                border: '2px dashed #f59e0b',
                borderRadius: '8px',
                backgroundColor: '#fffbeb',
                textAlign: 'center',
                color: '#92400e'
              }
            }, '⚠️ Component "${componentName}" failed to load');
          };
        }
      })();
`
            console.log(`✅ Compiled component: ${componentName}`)
          } else {
            // 编译结果为空，创建占位符
            componentScripts += `
window.${componentName} = function() {
  return React.createElement('div', {
    style: {
      padding: '20px',
      margin: '10px',
      border: '2px dashed #f59e0b',
      borderRadius: '8px',
      backgroundColor: '#fffbeb',
      color: '#92400e'
    }
  },
    React.createElement('div', { style: { marginBottom: '12px' } },
      React.createElement('strong', null, '⚠️ Component "${componentName}" not loaded')
    ),
    React.createElement('p', { style: { fontSize: '14px', color: '#78350f', marginBottom: '8px' } },
      'This component failed to compile. The code may be empty or invalid.'
    ),
    React.createElement('details', { style: { fontSize: '12px', marginTop: '8px' } },
      React.createElement('summary', { style: { cursor: 'pointer', color: '#92400e' } }, 'Troubleshooting'),
      React.createElement('ul', { style: { marginTop: '8px', paddingLeft: '20px' } },
        React.createElement('li', null, 'Check if the component file was generated'),
        React.createElement('li', null, 'Verify the component has valid JSX syntax'),
        React.createElement('li', null, 'Try regenerating with a simpler prompt')
      )
    )
  );
};
`
            console.warn(`⚠️ Empty compilation result for component: ${componentName}`)
          }
        } catch (err: any) {
          console.warn(`⚠️ Failed to compile component ${filePath}:`, err.message)

          // 尝试自动修复（最多3次）
          const { autoFixCode } = require('@/lib/code-auto-fix')
          let fixedCode = componentCode
          let retryCount = 0
          const maxRetries = 3

          while (retryCount < maxRetries) {
            const errorMsg = `${filePath}: ${err.message}`
            const autoFix = autoFixCode({ [filePath]: fixedCode }, [errorMsg])

            if (autoFix.fixedErrors.length > 0) {
              console.log(`🔧 自动修复了 ${autoFix.fixedErrors.length} 个错误，重新编译`)
              const newFixedCode = autoFix.fixedFiles[filePath]

              // 检测循环修复：如果代码没有变化，停止重试
              if (newFixedCode === fixedCode) {
                console.warn(`⚠️ 自动修复未改变代码，停止重试`)
                componentScripts += `window.${componentName} = function() { return React.createElement('div', {style:{padding:'20px',margin:'10px',border:'2px dashed #dc2626',borderRadius:'8px',backgroundColor:'#fef2f2',textAlign:'center',color:'#991b1b'}}, '⚠️ Component "${componentName}" compile error'); };\n`
                break
              }

              fixedCode = newFixedCode

              try {
                const result = babel.transformSync(fixedCode, {
                  presets: [
                    [presetReact, { runtime: 'classic' }],
                    [presetTypescript, { isTSX: true, allExtensions: true }]
                  ],
                  filename: `${componentName}.tsx`,
                })

                if (result?.code) {
                  const escapedComponentCode = result.code
                    .replace(/<\/script>/gi, '<\\/script>')
                    .replace(/<!--/g, '<\\!--')
                    .replace(/-->/g, '--\\>')
                    .replace(/export\s+default\s+/g, '')
                    .replace(/export\s+/g, '')
                  componentScripts += `\nwindow.${componentName} = ${escapedComponentCode};\n`
                  console.log(`✅ 修复后编译成功: ${componentName}`)
                  break
                }
              } catch (retryErr: any) {
                console.warn(`⚠️ 修复后仍然编译失败: ${retryErr.message}`)
                err = retryErr
                retryCount++
                if (retryCount >= maxRetries) {
                  componentScripts += `window.${componentName} = function() { return React.createElement('div', {style:{padding:'20px',margin:'10px',border:'2px dashed #dc2626',borderRadius:'8px',backgroundColor:'#fef2f2',textAlign:'center',color:'#991b1b'}}, '⚠️ Component "${componentName}" compile error'); };\n`
                }
              }
            } else {
              // 没有修复，退出循环
              componentScripts += `window.${componentName} = function() { return React.createElement('div', {style:{padding:'20px',margin:'10px',border:'2px dashed #dc2626',borderRadius:'8px',backgroundColor:'#fef2f2',textAlign:'center',color:'#991b1b'}}, '⚠️ Component "${componentName}" compile error'); };\n`
              break
            }
          }
        }
      }
    }

    // 依赖分析
    const { analyzeDependencies } = await import('@/lib/dependency-resolver')
    const depAnalysis = analyzeDependencies(allFiles)

    // 检查严重错误（缺失依赖）
    const criticalIssues = depAnalysis.issues.filter(issue => issue.severity === 'error')
    if (criticalIssues.length > 0) {
      console.warn('⚠️ Dependency issues found:', criticalIssues)
      const issueMessages = criticalIssues.map(issue => `- ${issue.message}`).join('\n')
      console.warn(`Dependency warnings:\n${issueMessages}`)
    }

    // 记录警告（循环依赖等）
    const warnings = depAnalysis.issues.filter(issue => issue.severity === 'warning')
    if (warnings.length > 0) {
      console.warn('⚠️ Dependency warnings:', warnings.map(w => w.message).join('; '))
    }

    // 替换 App.jsx 中的组件导入为全局引用
    let processedAppCode = cleanCode
    for (const [filePath] of componentFiles) {
      const componentName = filePath.split('/').pop()?.replace(/\.(jsx|tsx)$/, '') || ''
      if (componentName) {
        // 支持多种导入路径格式
        const importPatterns = [
          // src/components/ 目录
          new RegExp(`import\\s+${componentName}\\s+from\\s+['"][./]*components/${componentName}['"];?`, 'g'),
          new RegExp(`import\\s+${componentName}\\s+from\\s+['"]@/components/${componentName}['"];?`, 'g'),
          // src/ 目录下的组件（如 ./Dashboard, ./Header）
          new RegExp(`import\\s+${componentName}\\s+from\\s+['"]\\./${componentName}['"];?`, 'g'),
          new RegExp(`import\\s+${componentName}\\s+from\\s+['"]@/${componentName}['"];?`, 'g'),
        ]
        for (const pattern of importPatterns) {
          processedAppCode = processedAppCode.replace(pattern, `const ${componentName} = window.${componentName};`)
        }
      }
    }

    // 替换 Hook 导入
    for (const [filePath] of hookFiles) {
      const hookName = filePath.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || ''
      if (hookName) {
        const hookPatterns = [
          // import { useTheme } from '@/hooks/useTheme'
          new RegExp(`import\\s+\\{\\s*${hookName}\\s*\\}\\s+from\\s+['"]@/hooks/${hookName}['"];?`, 'g'),
          // import { useTheme } from './hooks/useTheme'
          new RegExp(`import\\s+\\{\\s*${hookName}\\s*\\}\\s+from\\s+['"].*?/hooks/${hookName}['"];?`, 'g'),
          // import useTheme from '@/hooks/useTheme'
          new RegExp(`import\\s+${hookName}\\s+from\\s+['"]@/hooks/${hookName}['"];?`, 'g'),
          new RegExp(`import\\s+${hookName}\\s+from\\s+['"].*?/hooks/${hookName}['"];?`, 'g'),
        ]
        for (const pattern of hookPatterns) {
          processedAppCode = processedAppCode.replace(pattern, `const ${hookName} = window.${hookName};`)
        }
      }
    }

    // 替换工具函数导入
    // import { formatDate, parseData } from '@/utils/format'
    const utilImportPattern = /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]@\/utils\/\w+['"];?/g
    processedAppCode = processedAppCode.replace(utilImportPattern, (match, imports) => {
      const importList = imports.split(',').map((i: string) => i.trim())
      return importList.map((name: string) => `const ${name} = window.utils.${name};`).join('\n')
    })

    // 预编译语法检查
    const { checkSyntax } = await import('@/lib/syntax-checker')
    const syntaxCheck = checkSyntax(processedAppCode, 'app.jsx')

    if (!syntaxCheck.valid) {
      console.error('❌ Syntax check failed:', syntaxCheck.errors)
      const errorMessages = syntaxCheck.errors
        .filter(e => e.severity === 'error')
        .map(e => `Line ${e.line}:${e.column} - ${e.message}${e.suggestion ? `\n  Suggestion: ${e.suggestion}` : ''}`)
        .join('\n')

      return NextResponse.json(
        {
          error: 'Syntax validation failed',
          details: `Found ${syntaxCheck.errors.length} syntax error(s):\n\n${errorMessages}`
        },
        { status: 400 }
      )
    }
    console.log('✅ Syntax check passed')

    // 服务端 Babel 编译
    let compiledCode: string
    let processedCode = processedAppCode
    let compileSuccess = false
    const maxRetries = 3

    for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
      try {
        // 修复中文引号为英文引号
        processedCode = processedCode
          .replace(/"/g, '"')
          .replace(/"/g, '"')
          .replace(/'/g, "'")
          .replace(/'/g, "'")

        const result = babel.transformSync(processedCode, {
          presets: [
            [presetReact, { runtime: 'classic' }]
          ],
          filename: 'app.jsx',
          sourceType: 'module',
        })
        compiledCode = result?.code || ''
        // 移除 Babel 编译后残留的 import 语句
        compiledCode = compiledCode.replace(/^import\s+.*?;?\s*$/gm, '')
        console.log('✅ Server-side Babel compilation successful')
        compileSuccess = true
        break
      } catch (babelError: any) {
        console.error('❌ Babel compilation error:', babelError.message)

        // 尝试自动修复
        if (retryCount < maxRetries - 1) {
          const { autoFixCode } = require('@/lib/code-auto-fix')
          const errorMsg = `app.jsx: ${babelError.message}`
          const autoFix = autoFixCode({ 'app.jsx': processedCode }, [errorMsg])

          if (autoFix.fixedErrors.length > 0) {
            console.log(`🔧 自动修复了 ${autoFix.fixedErrors.length} 个错误，重新编译`)
            processedCode = autoFix.fixedFiles['app.jsx']
            continue
          }
        }

        // 打印错误位置附近的代码
        const errorMatch = babelError.message.match(/\((\d+):(\d+)\)/)
        if (errorMatch) {
          const errorLine = parseInt(errorMatch[1])
          const lines = processedCode.split('\n')
          console.error('🔍 Code around error (lines', errorLine - 5, 'to', errorLine + 5, '):')
          for (let i = Math.max(0, errorLine - 6); i < Math.min(lines.length, errorLine + 5); i++) {
            console.error(`${i + 1}: ${lines[i]}`)
          }
          // 打印错误行的字符编码
          const errorLineContent = lines[errorLine - 1]
          if (errorLineContent) {
            console.error('🔍 Error line char codes:', [...errorLineContent].map((c, i) => `${i}:${c.charCodeAt(0)}`).join(' '))
          }
        }

        if (retryCount === maxRetries - 1) {
          return NextResponse.json(
            { error: 'Code compilation failed', details: babelError.message },
            { status: 400 }
          )
        }
      }
    }

    if (!compileSuccess) {
      return NextResponse.json(
        { error: 'Code compilation failed after retries' },
        { status: 400 }
      )
    }

    // Escape for HTML embedding
    const escapedCode = compiledCode
      .replace(/<\/script>/gi, '<\\/script>')
      .replace(/<!--/g, '<\\!--')
      .replace(/-->/g, '--\\>')

    console.log('Final compiled code:', escapedCode.substring(0, 300) + '...')

    // 提取代码中引用的组件名称，为未定义的组件生成占位符
    // 检测所有代码中引用的组件（包括 App 和子组件）
    const allCode = escapedCode + '\n' + componentScripts
    const referencedComponents = new Set<string>()
    const componentPattern = /<([A-Z][a-zA-Z0-9_]*)/g
    let compMatch
    while ((compMatch = componentPattern.exec(allCode)) !== null) {
      referencedComponents.add(compMatch[1])
    }
    // 也检查 React.createElement 调用
    const createElementPattern = /React\.createElement\(([A-Z][a-zA-Z0-9_]*)/g
    while ((compMatch = createElementPattern.exec(allCode)) !== null) {
      referencedComponents.add(compMatch[1])
    }
    const definedComponents = new Set(componentFiles.map(([p]) => p.split('/').pop()?.replace(/\.(jsx|tsx)$/, '') || ''))
    // 添加 App 到已定义组件
    definedComponents.add('App')
    let placeholderScripts = ''
    const builtinComponents = ['App', 'React', 'Fragment', 'Suspense', 'StrictMode']
    for (const name of referencedComponents) {
      if (!definedComponents.has(name) && !builtinComponents.includes(name)) {
        placeholderScripts += `if(typeof window.${name}==='undefined'){window.${name}=function(props){return React.createElement('div',{style:{padding:'20px',margin:'10px',border:'2px dashed #f59e0b',borderRadius:'8px',backgroundColor:'#fffbeb',textAlign:'center',color:'#92400e'}},'⚠️ Component "${name}" not loaded');};console.log('⚠️ Created placeholder: ${name}');}\n`
      }
    }

    // Create a complete HTML preview with the actual generated code
    const previewHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated App - Live Preview</title>
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/lucide-react/0.263.1/umd/lucide-react.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"></script>
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
          'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        overflow: hidden;
      }

      .preview-container {
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        box-sizing: border-box;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 100%;
      }

      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        color: white;
        text-align: center;
      }

      .loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .error {
        max-width: 700px;
        margin: 40px auto;
        padding: 32px;
        background: white;
        color: #dc2626;
        border-radius: 16px;
        border: 2px solid #fecaca;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .error h3 {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .error p {
        margin: 12px 0;
        line-height: 1.6;
        color: #7f1d1d;
      }

      .error-details {
        background: #fef2f2;
        padding: 16px;
        border-radius: 8px;
        margin-top: 20px;
        font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
        font-size: 13px;
        word-break: break-all;
        border-left: 4px solid #dc2626;
      }
    </style>
  </head>
  <body>
    <div id="loading" class="loading">
      <div class="loading-spinner"></div>
      <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Loading Preview...</div>
      <div style="font-size: 14px; opacity: 0.8;">Compiling React component</div>
    </div>

    <div id="root" class="preview-container" style="display: none;"></div>
    
    <script>
      // Enhanced icon components using Lucide React
      const IconComponent = ({ name, className = "w-4 h-4", ...props }) => {
        try {
          if (window.lucideReact && window.lucideReact[name]) {
            const IconComp = window.lucideReact[name];
            return React.createElement(IconComp, {
              className: className,
              ...props
            });
          }
        } catch (e) {
          console.log('Lucide icon not available, using fallback');
        }

        // Fallback to Unicode symbols
        const icons = {
          play: "▶", pause: "⏸", rotate: "🔄", trophy: "🏆", target: "🎯",
          zap: "⚡", sparkles: "✨", mail: "✉", lock: "🔒", user: "👤",
          alert: "⚠", check: "✓", calendar: "📅", clock: "🕐", arrow: "→",
          star: "⭐", rocket: "🚀", shield: "🛡", copy: "📋", download: "⬇",
          eye: "👁", search: "🔍", cloud: "☁", sun: "☀", cloudrain: "🌧",
          wind: "💨", thermometer: "🌡", droplets: "💧", mappin: "📍",
          refreshcw: "🔄", heart: "❤", bell: "🔔", settings: "⚙", menu: "☰",
          shoppingcart: "🛒", shoppingbag: "🛍", cart: "🛒", package: "📦",
          box: "📦", truck: "🚚", creditcard: "💳", dollarsign: "💵",
          euro: "💶", poundsterling: "💷", yen: "💴", home: "🏠",
          grid: "▦", list: "☰", layout: "▦", layers: "📚", columns: "▦",
          filter: "🔍", sliders: "☰", chevrondown: "▼", chevronup: "▲",
          chevronleft: "◀", chevronright: "▶", morehorizontal: "⋯", morevertical: "⋮",
          ellipsis: "⋯"
        };

        return React.createElement('span', {
          className: className + " inline-block",
          ...props
        }, icons[name] || "?");
      };

      // Initialize Lucide icons in global scope
      if (window.lucideReact) {
        const iconNames = [
          'Play', 'Pause', 'RotateCcw', 'Trophy', 'Target', 'Zap', 'Sparkles',
          'Mail', 'Lock', 'User', 'AlertCircle', 'Check', 'Calendar', 'Clock',
          'ArrowRight', 'Star', 'Rocket', 'Shield', 'Search', 'Cloud', 'Sun',
          'CloudRain', 'Wind', 'Thermometer', 'Droplets', 'MapPin', 'RefreshCw',
          'Heart', 'Bell', 'Settings', 'Menu', 'X', 'Plus', 'Minus', 'Edit',
          'Trash', 'Save', 'Download', 'Upload', 'Copy', 'Eye', 'EyeOff',
          'ShoppingCart', 'ShoppingBag', 'Cart', 'Package', 'Box', 'Truck',
          'CreditCard', 'DollarSign', 'Euro', 'PoundSterling', 'Yen',
          'Home', 'Grid', 'List', 'Layout', 'Layers', 'Columns',
          'Filter', 'SlidersHorizontal', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight',
          'MoreHorizontal', 'MoreVertical', 'Ellipsis'
        ];

        iconNames.forEach(name => {
          if (window.lucideReact[name]) {
            window[name] = window.lucideReact[name];
          }
        });
      }

      // Create icon wrapper components
      const createIconWrapper = (name) => (props) => {
        if (window[name]) {
          return React.createElement(window[name], props);
        }
        return React.createElement(IconComponent, { name: name.toLowerCase(), ...props });
      };

      const Play = createIconWrapper('Play');
      const Pause = createIconWrapper('Pause');
      const RotateCcw = createIconWrapper('RotateCcw');
      const Trophy = createIconWrapper('Trophy');
      const Target = createIconWrapper('Target');
      const Zap = createIconWrapper('Zap');
      const Sparkles = createIconWrapper('Sparkles');
      const Mail = createIconWrapper('Mail');
      const Lock = createIconWrapper('Lock');
      const User = createIconWrapper('User');
      const AlertCircle = createIconWrapper('AlertCircle');
      const Check = createIconWrapper('Check');
      const Calendar = createIconWrapper('Calendar');
      const Clock = createIconWrapper('Clock');
      const ArrowRight = createIconWrapper('ArrowRight');
      const Star = createIconWrapper('Star');
      const Rocket = createIconWrapper('Rocket');
      const Shield = createIconWrapper('Shield');
      const Search = createIconWrapper('Search');
      const Cloud = createIconWrapper('Cloud');
      const Sun = createIconWrapper('Sun');
      const Moon = createIconWrapper('Moon');
      const CloudRain = createIconWrapper('CloudRain');
      const Wind = createIconWrapper('Wind');
      const Thermometer = createIconWrapper('Thermometer');
      const Droplets = createIconWrapper('Droplets');
      const MapPin = createIconWrapper('MapPin');
      const RefreshCw = createIconWrapper('RefreshCw');
      const Heart = createIconWrapper('Heart');
      const Bell = createIconWrapper('Bell');
      const Settings = createIconWrapper('Settings');
      const Menu = createIconWrapper('Menu');
      const X = createIconWrapper('X');
      const Plus = createIconWrapper('Plus');
      const Minus = createIconWrapper('Minus');
      const Edit = createIconWrapper('Edit');
      const Trash = createIconWrapper('Trash');
      const Trash2 = createIconWrapper('Trash2');
      const Save = createIconWrapper('Save');
      const Download = createIconWrapper('Download');
      const Upload = createIconWrapper('Upload');
      const Copy = createIconWrapper('Copy');
      const Eye = createIconWrapper('Eye');
      const EyeOff = createIconWrapper('EyeOff');
      const ShoppingCart = createIconWrapper('ShoppingCart');
      const ShoppingBag = createIconWrapper('ShoppingBag');
      const Cart = createIconWrapper('Cart');
      const Package = createIconWrapper('Package');
      const Box = createIconWrapper('Box');
      const Truck = createIconWrapper('Truck');
      const CreditCard = createIconWrapper('CreditCard');
      const DollarSign = createIconWrapper('DollarSign');
      const Euro = createIconWrapper('Euro');
      const PoundSterling = createIconWrapper('PoundSterling');
      const Yen = createIconWrapper('Yen');
      const Home = createIconWrapper('Home');
      const Grid = createIconWrapper('Grid');
      const List = createIconWrapper('List');
      const Layout = createIconWrapper('Layout');
      const Layers = createIconWrapper('Layers');
      const Columns = createIconWrapper('Columns');
      const Filter = createIconWrapper('Filter');
      const SlidersHorizontal = createIconWrapper('SlidersHorizontal');
      const ChevronDown = createIconWrapper('ChevronDown');
      const ChevronUp = createIconWrapper('ChevronUp');
      const ChevronLeft = createIconWrapper('ChevronLeft');
      const ChevronRight = createIconWrapper('ChevronRight');
      const MoreHorizontal = createIconWrapper('MoreHorizontal');
      const MoreVertical = createIconWrapper('MoreVertical');
      const Ellipsis = createIconWrapper('Ellipsis');

      // Simple chart components that work without external libraries
      (function() {
        // Create simple SVG-based chart components
        window.ResponsiveContainer = function({ children, width = '100%', height = 300 }) {
          return React.createElement('div', {
            style: { width: width, height: height + 'px', position: 'relative' }
          }, children);
        };

        window.LineChart = function({ data, children, width = 400, height = 300 }) {
          // Simple line chart implementation
          if (!data || !Array.isArray(data) || data.length === 0) {
            return React.createElement('div', { style: { padding: '20px', textAlign: 'center' } }, 'No data available');
          }

          const values = data.map(d => d.sales || d.value || 0);
          const maxValue = values.length > 0 ? Math.max(...values) : 1;
          const chartWidth = width - 60;
          const chartHeight = height - 60;

          const points = data.map((d, i) => {
            const x = 40 + (i * chartWidth) / Math.max(data.length - 1, 1);
            const y = 40 + chartHeight - ((d.sales || d.value || 0) * chartHeight) / maxValue;
            return x + ',' + y;
          }).join(' ');

          return React.createElement('svg', { width: width, height: height },
            // Grid lines
            React.createElement('line', { x1: 40, y1: 40, x2: 40, y2: height - 20, stroke: '#e5e7eb', strokeWidth: 1 }),
            React.createElement('line', { x1: 40, y1: height - 20, x2: width - 20, y2: height - 20, stroke: '#e5e7eb', strokeWidth: 1 }),

            // Line
            React.createElement('polyline', {
              points: points,
              fill: 'none',
              stroke: '#3b82f6',
              strokeWidth: 2
            }),

            // Data points
            data.map((d, i) => {
              const x = 40 + (i * chartWidth) / Math.max(data.length - 1, 1);
              const y = 40 + chartHeight - ((d.sales || d.value || 0) * chartHeight) / maxValue;
              return React.createElement('circle', {
                key: i,
                cx: x,
                cy: y,
                r: 4,
                fill: '#3b82f6'
              });
            })
          );
        };

        window.BarChart = function({ data, width = 400, height = 300 }) {
          if (!data || !Array.isArray(data) || data.length === 0) {
            return React.createElement('div', { style: { padding: '20px', textAlign: 'center' } }, 'No data available');
          }

          const values = data.map(d => d.sales || d.value || 0);
          const maxValue = values.length > 0 ? Math.max(...values) : 1;
          const barWidth = Math.max((width - 80) / data.length, 20);
          const chartHeight = height - 60;

          return React.createElement('svg', { width: width, height: height },
            data.map((d, i) => {
              const barHeight = maxValue > 0 ? ((d.sales || d.value || 0) * chartHeight) / maxValue : 0;
              const x = 40 + i * barWidth;
              const y = height - 20 - barHeight;

              return React.createElement('rect', {
                key: i,
                x: x,
                y: y,
                width: barWidth - 2,
                height: barHeight,
                fill: '#10b981'
              });
            })
          );
        };

        window.PieChart = function({ data, width = 300, height = 300 }) {
          if (!data || !Array.isArray(data) || data.length === 0) {
            return React.createElement('div', { style: { padding: '20px', textAlign: 'center' } }, 'No data available');
          }

          const values = data.map(d => d.value || 0);
          const total = values.reduce((sum, val) => sum + val, 0);

          if (total === 0) {
            return React.createElement('div', { style: { padding: '20px', textAlign: 'center' } }, 'No valid data to display');
          }

          const centerX = width / 2;
          const centerY = height / 2;
          const radius = Math.min(width, height) / 2 - 20;

          let currentAngle = -Math.PI / 2; // Start from top

          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

          return React.createElement('svg', { width: width, height: height },
            data.map((d, i) => {
              const value = d.value || 0;
              if (value === 0) return null;

              const angle = (value / total) * 2 * Math.PI;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;

              const x1 = centerX + radius * Math.cos(startAngle);
              const y1 = centerY + radius * Math.sin(startAngle);
              const x2 = centerX + radius * Math.cos(endAngle);
              const y2 = centerY + radius * Math.sin(endAngle);

              const largeArcFlag = angle > Math.PI ? 1 : 0;

              const pathData = [
                'M ' + centerX + ' ' + centerY,
                'L ' + x1 + ' ' + y1,
                'A ' + radius + ' ' + radius + ' 0 ' + largeArcFlag + ' 1 ' + x2 + ' ' + y2,
                'Z'
              ].join(' ');

              currentAngle = endAngle;

              return React.createElement('path', {
                key: i,
                d: pathData,
                fill: colors[i % colors.length],
                stroke: 'white',
                strokeWidth: 1
              });
            }).filter(Boolean)
          );
        };

        // Simple placeholder components for other chart elements
        window.Line = function() { return null; };
        window.Bar = function() { return null; };
        window.Pie = function() { return null; };
        window.Cell = function() { return null; };
        window.XAxis = function() { return null; };
        window.YAxis = function() { return null; };
        window.CartesianGrid = function() { return null; };
        window.Tooltip = function() { return null; };
        window.Legend = function() { return null; };

        console.log('✅ Simple chart components loaded');
      })();

      // 创建组件占位符代理 - 当组件未定义时显示占位符而不是崩溃
      window.ComponentPlaceholder = function(props) {
        return React.createElement('div', {
          style: {
            padding: '20px',
            margin: '10px',
            border: '2px dashed #ccc',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9',
            textAlign: 'center',
            color: '#666'
          }
        }, '⚠️ Component not loaded: ' + (props.name || 'Unknown'));
      };

      // 自动生成的组件占位符
      ${placeholderScripts}

      // 1. 先注入工具函数
      ${utilScripts}

      // 2. 再注入 Hooks
      ${hookScripts}

      // 3. 然后注入子组件
      ${componentScripts}

      // 4. 最后注入主 App
      ${escapedCode}

      // 状态持久化系统
      (function() {
        var STATE_KEY = '__PREVIEW_STATE__';

        // 初始化全局状态对象
        window.__PREVIEW_STATE__ = {
          components: {},
          timestamp: Date.now()
        };

        // 从 localStorage 恢复状态
        try {
          var savedState = localStorage.getItem(STATE_KEY);
          if (savedState) {
            var parsed = JSON.parse(savedState);
            // 只恢复 5 分钟内的状态
            if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
              window.__PREVIEW_STATE__ = parsed;
              console.log('✅ Restored state from localStorage');
            } else {
              localStorage.removeItem(STATE_KEY);
            }
          }
        } catch (e) {
          console.warn('Failed to restore state:', e);
        }

        // 保存状态到 localStorage
        window.savePreviewState = function(componentName, state) {
          try {
            window.__PREVIEW_STATE__.components[componentName] = state;
            window.__PREVIEW_STATE__.timestamp = Date.now();
            localStorage.setItem(STATE_KEY, JSON.stringify(window.__PREVIEW_STATE__));
          } catch (e) {
            console.warn('Failed to save state:', e);
          }
        };

        // 获取组件状态
        window.getPreviewState = function(componentName) {
          return window.__PREVIEW_STATE__.components[componentName] || null;
        };

        // 清除状态
        window.clearPreviewState = function() {
          window.__PREVIEW_STATE__ = { components: {}, timestamp: Date.now() };
          localStorage.removeItem(STATE_KEY);
          console.log('✅ Cleared preview state');
        };

        // 页面卸载前保存状态
        window.addEventListener('beforeunload', function() {
          try {
            localStorage.setItem(STATE_KEY, JSON.stringify(window.__PREVIEW_STATE__));
          } catch (e) {
            // 忽略错误
          }
        });

        console.log('✅ State persistence initialized');
      })();

      // 运行时错误监控
      (function() {
        var errorContainer = null;
        var errorList = [];

        // 创建错误显示容器
        function createErrorContainer() {
          if (errorContainer) return;

          errorContainer = document.createElement('div');
          errorContainer.id = 'runtime-errors';
          errorContainer.style.cssText = 'position:fixed;bottom:0;left:0;right:0;max-height:200px;overflow-y:auto;background:#fee;border-top:2px solid #c00;padding:10px;font-family:monospace;font-size:12px;z-index:10000;display:none;';
          document.body.appendChild(errorContainer);
        }

        // 显示错误
        function showError(type, message, source, lineno, colno, error) {
          createErrorContainer();

          var errorInfo = {
            type: type,
            message: message,
            source: source,
            line: lineno,
            column: colno,
            stack: error ? error.stack : null,
            timestamp: new Date().toISOString()
          };

          errorList.push(errorInfo);

          var errorDiv = document.createElement('div');
          errorDiv.style.cssText = 'margin-bottom:8px;padding:8px;background:#fff;border-left:3px solid #c00;';
          errorDiv.innerHTML = '<strong style="color:#c00;">' + type + ':</strong> ' + message +
            (lineno ? ' <span style="color:#666;">(Line ' + lineno + ':' + colno + ')</span>' : '') +
            '<button onclick="this.parentElement.remove()" style="float:right;border:none;background:#ddd;padding:2px 8px;cursor:pointer;">×</button>';

          errorContainer.appendChild(errorDiv);
          errorContainer.style.display = 'block';

          console.error('[Runtime Monitor]', type, message, errorInfo);
        }

        // 捕获全局错误
        window.addEventListener('error', function(event) {
          showError('Runtime Error', event.message, event.filename, event.lineno, event.colno, event.error);
          return false; // 不阻止默认错误处理
        });

        // 捕获未处理的 Promise 拒绝
        window.addEventListener('unhandledrejection', function(event) {
          showError('Unhandled Promise Rejection', event.reason, '', 0, 0, null);
        });

        // 捕获 console.error
        var originalConsoleError = console.error;
        console.error = function() {
          var args = Array.prototype.slice.call(arguments);
          var message = args.map(function(arg) {
            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
          }).join(' ');

          showError('Console Error', message, '', 0, 0, null);
          originalConsoleError.apply(console, arguments);
        };

        // 导出错误列表供调试使用
        window.__RUNTIME_ERRORS__ = errorList;
      })();

      // 直接渲染（无需等待 Babel）
      (function() {
        var loadingEl = document.getElementById('loading');
        var rootEl = document.getElementById('root');
        try {
          if (typeof App === 'undefined') throw new Error('App component not found');
          loadingEl.style.display = 'none';
          rootEl.style.display = 'flex';
          rootEl.style.flexDirection = 'column';
          rootEl.style.minHeight = '100vh';

          // 使用 Proxy 包装全局对象，自动为未定义的组件创建占位符
          var originalApp = App;
          try {
            ReactDOM.createRoot(rootEl).render(React.createElement(originalApp));
          } catch (componentError) {
            // 如果是组件未定义错误，显示更友好的提示
            if (componentError.message && componentError.message.includes('is not defined')) {
              var missingComponent = componentError.message.match(/([A-Z][a-zA-Z]*) is not defined/);
              var componentName = missingComponent ? missingComponent[1] : 'Unknown';
              throw new Error('Component "' + componentName + '" is referenced but not loaded. The AI may not have generated this component file.');
            }
            throw componentError;
          }
          console.log('✅ Rendered successfully');
        } catch (e) {
          console.error('Render error:', e);
          loadingEl.innerHTML = '<div class="error"><h3>⚠️ Render Error</h3><p>' + e.message + '</p><p style="font-size:12px;color:#888;margin-top:10px;">Tip: Try regenerating with a simpler prompt, or ask AI to put all code in a single App component.</p></div>';
        }
      })();

    </script>
  </body>
</html>
`

    return new NextResponse(previewHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: any) {
    console.error('Error generating preview:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview: ' + error.message },
      { status: 500 }
    )
  }
}

