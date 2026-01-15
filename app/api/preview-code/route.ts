import { NextRequest, NextResponse } from 'next/server'
import * as babel from '@babel/core'
import presetReact from '@babel/preset-react'
import presetTypescript from '@babel/preset-typescript'

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
      .replace(/\buseState\b/g, 'window.React.useState')
      .replace(/\buseEffect\b/g, 'window.React.useEffect')
      .replace(/\buseCallback\b/g, 'window.React.useCallback')
      .replace(/\buseMemo\b/g, 'window.React.useMemo')
      .replace(/\buseRef\b/g, 'window.React.useRef')
      .replace(/\buseContext\b/g, 'window.React.useContext')
      .replace(/\buseReducer\b/g, 'window.React.useReducer')
      .replace(/\buseLayoutEffect\b/g, 'window.React.useLayoutEffect')
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
    // 支持多种组件路径格式
    const componentFiles = Object.entries(allFiles).filter(([path]) => {
      const isComponent = (
        path.startsWith('src/components/') ||
        path.startsWith('components/') ||
        path.includes('/components/')
      )
      return isComponent && (path.endsWith('.jsx') || path.endsWith('.tsx'))
    })

    console.log('📁 All files received:', Object.keys(allFiles))
    console.log('📁 All files content lengths:', Object.entries(allFiles).map(([k, v]) => `${k}: ${String(v).length}`))
    console.log('📁 Component files found:', componentFiles.map(([p]) => p))

    if (componentFiles.length > 0) {
      console.log(`🔧 Processing ${componentFiles.length} component files`)

      for (const [filePath, fileCode] of componentFiles) {
        try {
          // 获取组件名
          const componentName = filePath.split('/').pop()?.replace(/\.(jsx|tsx)$/, '') || ''
          if (!componentName) continue

          let componentCode = String(fileCode).trim()

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

          // 替换 React hooks
          componentCode = componentCode
            .replace(/\bReact\.(useState|useEffect|useCallback|useMemo|useRef|useContext|useReducer)\b/g, 'window.React.$1')
            .replace(/\b(useState|useEffect|useCallback|useMemo|useRef|useContext|useReducer)\b(?!\s*:)/g, 'window.React.$1')

          // 移除 export default
          componentCode = componentCode.replace(/export\s+default\s+(\w+)\s*;?\s*$/, '')

          // 编译组件
          const result = babel.transformSync(componentCode, {
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

            componentScripts += `
      // Component: ${componentName}
      ${escapedComponentCode}
      window.${componentName} = ${componentName};
      console.log('✅ Loaded component: ${componentName}');
`
            console.log(`✅ Compiled component: ${componentName}`)
          }
        } catch (err: any) {
          console.warn(`⚠️ Failed to compile component ${filePath}:`, err.message)
        }
      }
    }

    // 替换 App.jsx 中的组件导入为全局引用
    let processedAppCode = cleanCode
    for (const [filePath] of componentFiles) {
      const componentName = filePath.split('/').pop()?.replace(/\.(jsx|tsx)$/, '') || ''
      if (componentName) {
        // 支持多种导入路径格式
        // import Header from './components/Header'
        // import Header from '../components/Header'
        // import Header from '@/components/Header'
        const importPatterns = [
          new RegExp(`import\\s+${componentName}\\s+from\\s+['"][./]*components/${componentName}['"];?`, 'g'),
          new RegExp(`import\\s+${componentName}\\s+from\\s+['"]@/components/${componentName}['"];?`, 'g'),
        ]
        for (const pattern of importPatterns) {
          processedAppCode = processedAppCode.replace(pattern, `const ${componentName} = window.${componentName};`)
        }
      }
    }

    // 服务端 Babel 编译
    let compiledCode: string
    try {

      // 修复中文引号为英文引号
      processedAppCode = processedAppCode
        .replace(/"/g, '"')
        .replace(/"/g, '"')
        .replace(/'/g, "'")
        .replace(/'/g, "'")

      const result = babel.transformSync(processedAppCode, {
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
    } catch (babelError: any) {
      console.error('❌ Babel compilation error:', babelError.message)
      // 打印错误位置附近的代码
      const errorMatch = babelError.message.match(/\((\d+):(\d+)\)/)
      if (errorMatch) {
        const errorLine = parseInt(errorMatch[1])
        const lines = processedAppCode.split('\n')
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
      return NextResponse.json(
        { error: 'Code compilation failed', details: babelError.message },
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
    const referencedComponents = new Set<string>()
    const componentPattern = /React\.createElement\(([A-Z][a-zA-Z0-9_]*)/g
    let compMatch
    while ((compMatch = componentPattern.exec(escapedCode)) !== null) {
      referencedComponents.add(compMatch[1])
    }
    const definedComponents = new Set(componentFiles.map(([p]) => p.split('/').pop()?.replace(/\.(jsx|tsx)$/, '') || ''))
    let placeholderScripts = ''
    for (const name of referencedComponents) {
      if (!definedComponents.has(name) && !['App', 'React', 'Fragment'].includes(name)) {
        placeholderScripts += `if(typeof window.${name}==='undefined'){window.${name}=function(){return React.createElement('div',{style:{padding:'20px',margin:'10px',border:'2px dashed #f59e0b',borderRadius:'8px',backgroundColor:'#fffbeb',textAlign:'center',color:'#92400e'}},'⚠️ Component "${name}" not loaded');};console.log('⚠️ Created placeholder: ${name}');}\n`
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

      // Child components - 预编译的子组件
      ${componentScripts}

      // Component code - 服务端已预编译
      ${escapedCode}

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

