// 自动修复生成代码中的常见错误

export interface AutoFixResult {
  fixedFiles: Record<string, string>
  fixedErrors: string[]
  remainingErrors: string[]
}

export function autoFixCode(
  files: Record<string, string>,
  errors: string[]
): AutoFixResult {
  const fixedFiles = { ...files }
  const fixedErrors: string[] = []
  const remainingErrors: string[] = []

  // 创建文件路径映射，支持部分路径匹配
  const fileKeys = Object.keys(files)
  const findFileKey = (errorPath: string): string | null => {
    // 先尝试精确匹配
    if (fileKeys.includes(errorPath)) return errorPath
    // 尝试文件名匹配
    const fileName = errorPath.split(/[/\\]/).pop()
    if (fileName) {
      const match = fileKeys.find(key => key.endsWith(fileName))
      if (match) return match
    }
    return null
  }

  for (const error of errors) {
    let fixed = false

    // 打印错误的文件路径
    const filePathMatch = error.match(/^([^:]+):/)
    if (filePathMatch) {
      console.log(`🔍 处理错误文件: ${filePathMatch[1]}`)
      console.log(`   错误信息: ${error}`)
    }

    // 修复不完整的三元表达式和 switch case 赋值错误
    if (error.includes('expected ":"') || error.includes('expected ","') || error.includes('Invalid left-hand side in assignment') || error.includes('Unexpected token')) {
      const filePathMatch = error.match(/^([^:]+):/)
      if (filePathMatch) {
        const errorPath = filePathMatch[1]
        const filePath = findFileKey(errorPath)
        if (filePath && fixedFiles[filePath]) {
          let code = fixedFiles[filePath]
          let wasFixed = false

          // 修复 switch case 中的 = 应该是 :
          const switchCaseAssignment = /case\s+(['"][\w]+['"])\s*=\s*([^;]+);/g
          if (switchCaseAssignment.test(code)) {
            code = code.replace(switchCaseAssignment, 'case $1: minIndex = $2;')
            wasFixed = true
          }

          // 修复 switch default 中的 = 应该是 :
          const defaultAssignment = /default\s*=\s*([^;]+);/g
          if (defaultAssignment.test(code)) {
            code = code.replace(defaultAssignment, 'default: $1;')
            wasFixed = true
          }

          // 修复对象属性中使用 => 而不是 : 的情况
          // 只匹配对象字面量中的属性，避免误匹配箭头函数
          const arrowInsteadOfColon = /\{[^}]*\b([a-zA-Z_]\w*)\s*=>\s*([^,}]+)/g
          if (arrowInsteadOfColon.test(code)) {
            code = code.replace(arrowInsteadOfColon, (match) => {
              return match.replace(/(\b[a-zA-Z_]\w*)\s*=>\s*/, '$1: ')
            })
            wasFixed = true
          }

          // 修复对象属性中缺少键名的情况 (如: category === 'all' ? 'Work' ,)
          // 必须在不完整三元表达式修复之前执行
          const simplePropertyMissingKey = /(\s+)([a-zA-Z_]\w*)\s+===\s+(['"][^'"]+['"])\s+\?\s+(['"][^'"]*['"])\s*,/g
          if (code.match(simplePropertyMissingKey)) {
            code = code.replace(simplePropertyMissingKey, (match, indent, varName, compareVal, trueVal) => {
              return `${indent}${varName}: ${varName} === ${compareVal} ? ${trueVal} : ${varName},`
            })
            wasFixed = true
          }

          // 修复 map/filter 等回调中缺少 => 的情况 (如: .map(task: task.id)
          const mapCallbackMissingArrow = /\.(map|filter|reduce|forEach|find|some|every)\((\w+):\s+/g
          if (mapCallbackMissingArrow.test(code)) {
            code = code.replace(mapCallbackMissingArrow, '.$1($2 => ')
            wasFixed = true
          }

          // 修复 map 回调缺少 : field 的情况 (如: ? { ...field, ...updates }\n      ))
          const mapTernaryMissingElse = /(\?\s*\{\s*\.\.\.\w+,\s*\.\.\.\w+\s*\}\s*\n\s*)\)/g
          if (mapTernaryMissingElse.test(code)) {
            code = code.replace(mapTernaryMissingElse, '$1: field\n      )')
            wasFixed = true
          }

          // 修复 setState 使用 : 而不是 => 的情况 (如: setFormFields(prevFields: [...])
          const setStateColonInsteadOfArrow = /\bset\w+\((\w+):\s*/g
          if (setStateColonInsteadOfArrow.test(code)) {
            code = code.replace(setStateColonInsteadOfArrow, (match, varName) => {
              return match.replace(`${varName}:`, `${varName} =>`)
            })
            wasFixed = true
          }

          // 修复 Promise 回调中缺少 => 的情况 (如: .then(response: {)
          const promiseCallbackMissingArrow = /\.(then|catch|finally)\((\w+):\s*\{/g
          if (promiseCallbackMissingArrow.test(code)) {
            code = code.replace(promiseCallbackMissingArrow, '.$1($2 => {')
            wasFixed = true
          }

          // 修复缺少 if 条件的 else 语句 (如: } else { 前面没有 if)
          const elseWithoutIf = /(\n\s+)(setError\([^)]+\);)(\n\s+)(\}\s+else\s+\{)/g
          if (elseWithoutIf.test(code)) {
            code = code.replace(elseWithoutIf, '$1if (field.required && !value) {$1  $2$3$4')
            wasFixed = true
          }

          // 修复缺少 : 的三元表达式 (如: condition ? value )
          // 只修复明确缺少冒号的情况，避免误修复嵌套三元表达式
          const incompleteTernary = /(\?\s+(?:\d+|['"][^'"]*['"]|[A-Za-z_]\w+\([^)]*\))\s*)([,\)\};])/g
          if (incompleteTernary.test(code)) {
            code = code.replace(incompleteTernary, '$1 : null$2')
            wasFixed = true
          }

          // 修复三元表达式中间缺少 : 的情况 (如: x ? 24  === 'y' ? 168)
          const brokenTernaryMiddle = /(\?\s+)(\d+|['"][^'"]+['"])\s+(===|!==)\s+(['"][^'"]+['"])\s+\?/g
          if (brokenTernaryMiddle.test(code)) {
            code = code.replace(brokenTernaryMiddle, '$1$2 : $3 $4 ?')
            wasFixed = true
          }

          // 修复 map 中缺少 return 的三元表达式 (如: alert.id === id ? { ...alert, resolved })
          const mapTernaryMissingReturn = /(\?\s+\{[^}]+\})\s*\n\s*\)\);/g
          if (mapTernaryMissingReturn.test(code)) {
            code = code.replace(mapTernaryMissingReturn, '$1 : alert\n    ));')
            wasFixed = true
          }

          // 修复空的 map 回调 (如: .map(item => (\n))}
          const emptyMapCallback = /\.map\((\w+)\s+=>\s+\(\s*\n\s*\)\)/g
          if (emptyMapCallback.test(code)) {
            code = code.replace(emptyMapCallback, '.map($1 => null)')
            wasFixed = true
          }

          // 修复 JSX 属性中缺少 = 的情况 (如: <div className"container">)
          const jsxAttrMissingEquals = /(<\w+[^>]*\s)(\w+)"([^"]+)"/g
          if (jsxAttrMissingEquals.test(code)) {
            code = code.replace(jsxAttrMissingEquals, '$1$2="$3"')
            wasFixed = true
          }

          // 修复对象解构中缺少冒号的情况 (如: const { name value } = obj)
          const destructuringMissingColon = /const\s+\{\s*(\w+)\s+(\w+)\s*\}/g
          if (destructuringMissingColon.test(code)) {
            code = code.replace(destructuringMissingColon, 'const { $1: $2 }')
            wasFixed = true
          }

          // 修复数组方法链中缺少点的情况 (如: arr.map()filter())
          const missingDotInChain = /\)([a-z]+)\(/g
          if (missingDotInChain.test(code) && code.includes('.map(') || code.includes('.filter(')) {
            code = code.replace(/\)(map|filter|reduce|find|some|every)\(/g, ').$1(')
            wasFixed = true
          }

          // 修复 useState 初始值缺少括号 (如: useState[])
          const useStateMissingParens = /useState\[/g
          if (useStateMissingParens.test(code)) {
            code = code.replace(/useState\[/g, 'useState([')
            code = code.replace(/useState\(\[\]\)/g, 'useState([])')
            wasFixed = true
          }

          // 修复三元表达式中缺少 : 的情况 (如: x ? y  === z ? a : b)
          const brokenTernary = /(\?\s+\d+)\s+(===|!==)\s+(['"][^'"]+['"])/g
          if (brokenTernary.test(code)) {
            code = code.replace(brokenTernary, '$1 : ')
            wasFixed = true
          }

          // 修复对象中缺少属性名的情况 (如: { [filterType] })
          const missingObjectValue = /\{\s*\.\.\.[^,}]+,\s*\[([^\]]+)\]\s*\}/g
          if (missingObjectValue.test(code)) {
            code = code.replace(missingObjectValue, (match, key) => {
              return `{ ...prev, [${key}]: true }`
            })
            wasFixed = true
          }

          // 修复对象属性中缺少值的情况 (如: { ...prev, [key] } 应该是 { ...prev, [key]: value })
          const objectSpreadMissingValue = /(\{[^}]*\.\.\.[^,}]+),\s*\[([^\]]+)\]\s*\}/g
          if (objectSpreadMissingValue.test(code)) {
            code = code.replace(objectSpreadMissingValue, '$1, [$2]: true }')
            wasFixed = true
          }

          // 修复 setState 回调函数缺少箭头 (如: setFilters(prevFilters ({ ...prev }))
          // 只修复明确缺少箭头的情况，避免误修复正常代码
          const setStateCallbackMissingArrow = /\bset\w+\((\w+)\s+\(\{/g
          if (setStateCallbackMissingArrow.test(code)) {
            code = code.replace(/\bset\w+\((\w+)\s+\(\{/g, (match, varName) => {
              return match.replace(`${varName} ({`, `${varName} => ({`)
            })
            wasFixed = true
          }

          // 修复 setState 回调中对象属性缺少值 (如: ({ ...prevFilters, [name] }))
          // 只修复确实缺少值的情况，保持变量名不变
          const setStateObjectMissingValue = /\(\{\s*\.\.\.(\w+),\s*\[([^\]]+)\]\s*\}\)\);/g
          if (setStateObjectMissingValue.test(code)) {
            code = code.replace(setStateObjectMissingValue, (match, varName, key) => {
              // 使用 key 作为值，保持原变量名
              return `({ ...${varName}, [${key}]: ${key} }));`
            })
            wasFixed = true
          }

          // 修复三元表达式后直接跟 {xxx.map 的模式
          const ternaryMapPattern = /(\?\s*\(\s*\n\s*)(\{[a-zA-Z]+\.map\()/g
          if (ternaryMapPattern.test(code)) {
            code = code.replace(ternaryMapPattern, '$1<>\n$2')
            code = code.replace(/(\)\)}\s*\n\s*)(\)\s*:\s*)/g, '$1</>\n$2')
            wasFixed = true
          }

          // 修复三元表达式中缺少包裹元素的 JSX (? ( {xxx 模式)
          const ternaryJSXPattern = /(\?\s*\(\s*\n\s*)(\{[^<])/g
          if (ternaryJSXPattern.test(code)) {
            code = code.replace(ternaryJSXPattern, '$1<>$2')
            // 找到对应的结束位置并添加 </>
            code = code.replace(/(\}[\s\n]*\)\s*)(\)\s*:\s*)/g, '$1</>\n$2')
            wasFixed = true
          }

          if (wasFixed) {
            fixedFiles[filePath] = code
            fixedErrors.push(error)
            fixed = true
          }
        }
      }
    }

    // 修复 TypeScript 类型注解错误（优先处理）
    if (!fixed && (error.includes('type annotation') || error.includes('Did not expect a type annotation') || error.includes('Missing semicolon') || error.includes('Unexpected token'))) {
      const filePathMatch = error.match(/^([^:]+):/)
      if (filePathMatch) {
        const errorPath = filePathMatch[1]
        const filePath = findFileKey(errorPath)
        if (filePath && fixedFiles[filePath]) {
          let code = fixedFiles[filePath]
          let wasFixed = false

          // 移除箭头函数返回类型注解 (...): Type =>
          const beforeArrow = code
          code = code.replace(/\(([^)]*)\)\s*:\s*[^=]+?=>/g, '($1) =>')
          if (code !== beforeArrow) wasFixed = true

          // 移除变量类型注解 const x: Type =
          const beforeVarType = code
          code = code.replace(/const\s+(\w+)\s*:\s*[^=]+=/g, 'const $1 =')
          if (code !== beforeVarType) wasFixed = true

          // 移除 map/filter 等回调中的类型注解 .map(d: d.value)
          // 注意：不要匹配已经有箭头函数的情况
          const beforeMap = code
          code = code.replace(/\.(map|filter|reduce|forEach|find|some|every)\((\w+):\s+(?!=>)/g, '.$1($2 => ')
          if (code !== beforeMap) wasFixed = true

          // 修复 filter 回调中缺少 => 的情况 .filter(point: {
          const beforeFilter = code
          code = code.replace(/\.(map|filter|reduce|forEach|find|some|every)\((\w+):\s*\{/g, '.$1($2 => {')
          if (code !== beforeFilter) wasFixed = true

          if (wasFixed) {
            fixedFiles[filePath] = code
            fixedErrors.push(error)
            fixed = true
          }
        }
      }
    }

    // 其他 Babel 语法错误交给 AI 重试
    if (!fixed && (error.includes('SyntaxError') || error.includes('Unexpected token'))) {

      if (!fixed) {
        remainingErrors.push(error)
        continue
      }
    }

    // 修复 JSX 标签不匹配
    if (error.includes('Expected corresponding JSX closing tag') || error.includes('Adjacent JSX elements')) {
      const filePathMatch = error.match(/^([^:]+):/)
      if (filePathMatch) {
        const errorPath = filePathMatch[1]
        const filePath = findFileKey(errorPath)
        if (filePath && fixedFiles[filePath]) {
          let code = fixedFiles[filePath]

          // 修复缺少 return 语句开始标签的情况
          // 检查是否有 return ( 后面直接跟内容，但缺少包裹的标签
          const returnPattern = /return\s*\(\s*\n([\s\S]*?)\n\s*\);/g
          const returnMatches = code.match(returnPattern)
          if (returnMatches) {
            code = code.replace(returnPattern, (match, content) => {
              // 检查内容是否已经有顶层标签
              const trimmedContent = content.trim()
              if (!trimmedContent.startsWith('<') || !trimmedContent.endsWith('>')) {
                return `return (\n    <>\n${content}\n    </>\n  );`
              }
              return match
            })
          }

          // 修复多余的闭合标签（先处理，避免后续修复产生冲突）
          code = code.replace(/<\/div>\s*\n\s*<\/div>/g, '</div>')
          code = code.replace(/<\/>\s*\n\s*<\/>/g, '</>')

          // 修复 ResponsiveContainer/LineChart 标签顺序（只在明确错误时修复）
          if (error.includes('Expected corresponding JSX closing tag for <ResponsiveContainer>')) {
            code = code.replace(/<\/LineChart>\s*\n\s*<\/ResponsiveContainer>/g, '</ResponsiveContainer>\n      </LineChart>')
          }

          // 修复 JSX 标签不匹配 - 查找缺少开始标签的情况
          // 检查是否有 </ul> 但缺少对应的 <ul>
          if (error.includes('Expected corresponding JSX closing tag') && code.includes('</ul>')) {
            const tagMatch = error.match(/closing tag for <(\w+)>/)
            if (tagMatch) {
              const parentTag = tagMatch[1]
              // 在父标签后查找第一个 <li>，在它之前添加 <ul>
              const pattern = new RegExp(`(<${parentTag}[^>]*>[\\s\\S]*?)(\\s*<li[^>]*>)`, 'g')
              const before = code
              code = code.replace(pattern, '$1\n        <ul>$2')
              if (code !== before) {
                console.log(`🔧 在 <${parentTag}> 后添加了缺失的 <ul> 标签`)
              }
            }
          }

          if (code !== fixedFiles[filePath]) {
            fixedFiles[filePath] = code
            fixedErrors.push(error)
            fixed = true
          }
        }
      }
    }

    if (fixed) continue

    // 原有的 JSX 标签不匹配修复
    if (error.includes('Expected corresponding JSX closing tag')) {
      const filePathMatch = error.match(/^([^:]+):/)
      const tagMatch = error.match(/closing tag for <(\w+)>/)
      if (filePathMatch && tagMatch) {
        const errorPath = filePathMatch[1]
        const filePath = findFileKey(errorPath)
        const expectedTag = tagMatch[1]
        if (filePath && fixedFiles[filePath]) {
          let code = fixedFiles[filePath]
          // 查找错误的闭合标签并替换
          code = code.replace(/<\/(\w+)>(\s*<\/div>)/g, (match, tag, rest) => {
            if (tag !== expectedTag) {
              return `</${expectedTag}>${rest}`
            }
            return match
          })
          if (code !== fixedFiles[filePath]) {
            fixedFiles[filePath] = code
            fixedErrors.push(error)
            fixed = true
          }
        }
      }
    }

    // 修复缺少 React 导入
    if (error.includes('missing') && error.includes('import React')) {
      const filePathMatch = error.match(/^([^:]+):/)
      if (filePathMatch) {
        const errorPath = filePathMatch[1]
        const filePath = findFileKey(errorPath)
        if (filePath && fixedFiles[filePath]) {
          const code = fixedFiles[filePath]
          // 在文件开头添加 React 导入
          if (!/import\s+React/.test(code)) {
            fixedFiles[filePath] = `import React from 'react';\n${code}`
            fixedErrors.push(error)
            fixed = true
          }
        }
      }
    }

    // 修复未定义的常见变量（删除使用这些变量的代码行）
    if (error.includes('is used but not declared')) {
      const filePathMatch = error.match(/^([^:]+):/)
      const varMatch = error.match(/Variable '(\w+)'/)
      if (filePathMatch && varMatch) {
        const errorPath = filePathMatch[1]
        const filePath = findFileKey(errorPath)
        const varName = varMatch[1]
        if (filePath && fixedFiles[filePath]) {
          const code = fixedFiles[filePath]
          const lines = code.split('\n')
          const filteredLines = lines.filter(line => {
            const usageRegex = new RegExp(`\\b${varName}\\b`)
            return !usageRegex.test(line) || /(?:const|let|var)\s+/.test(line)
          })
          if (filteredLines.length < lines.length) {
            fixedFiles[filePath] = filteredLines.join('\n')
            fixedErrors.push(error)
            fixed = true
          }
        }
      }
    }

    // 修复相邻 JSX 元素（添加 Fragment 包裹）
    if (error.includes('Adjacent JSX elements')) {
      const filePathMatch = error.match(/^([^:]+):/)
      if (filePathMatch) {
        const errorPath = filePathMatch[1]
        const filePath = findFileKey(errorPath)
        if (filePath && fixedFiles[filePath]) {
          let code = fixedFiles[filePath]

          // 修复 return 语句中缺少内容的情况
          code = code.replace(/return\s*\(\s*\n\s*\);/g, 'return null;')

          code = code.replace(/return\s*\(\s*\n(\s*)(<[A-Z][\s\S]*?)\n\s*\)/g, (_match, indent, jsx) => {
            return `return (\n${indent}<>\n${indent}  ${jsx.replace(/\n/g, '\n  ')}\n${indent}</>\n${indent})`
          })
          if (code !== fixedFiles[filePath]) {
            fixedFiles[filePath] = code
            fixedErrors.push(error)
            fixed = true
          }
        }
      }
    }

    // 修复空的 return 语句
    if (error.includes('Unexpected token')) {
      const filePathMatch = error.match(/^([^:]+):/)
      if (filePathMatch) {
        const errorPath = filePathMatch[1]
        const filePath = findFileKey(errorPath)
        if (filePath && fixedFiles[filePath]) {
          let code = fixedFiles[filePath]
          code = code.replace(/return\s*\(\s*\n\s*\);/g, 'return null;')
          if (code !== fixedFiles[filePath]) {
            fixedFiles[filePath] = code
            fixedErrors.push(error)
            fixed = true
          }
        }
      }
    }

    // 修复 return 在函数外（包裹在函数中）
    if (error.includes("'return' outside of function")) {
      const filePathMatch = error.match(/^([^:]+):/)
      if (filePathMatch) {
        const errorPath = filePathMatch[1]
        const filePath = findFileKey(errorPath)
        if (filePath && fixedFiles[filePath]) {
          let code = fixedFiles[filePath]
          const componentName = filePath.split('/').pop()?.replace(/\.(jsx|tsx)$/, '') || 'Component'

          // 检查是否已经有函数定义
          if (!/function\s+\w+/.test(code) && !/const\s+\w+\s*=\s*\([^)]*\)\s*=>/.test(code)) {
            // 移除开头的 import 语句
            const importMatch = code.match(/^((?:import\s+.*?;\s*\n)*)([\s\S]*)$/)
            if (importMatch) {
              const imports = importMatch[1]
              const body = importMatch[2].trim()
              code = `${imports}\nfunction ${componentName}() {\n  ${body.replace(/\n/g, '\n  ')}\n}\n\nexport default ${componentName};`
            } else {
              code = `function ${componentName}() {\n  ${code.replace(/\n/g, '\n  ')}\n}\n\nexport default ${componentName};`
            }
            fixedFiles[filePath] = code
            fixedErrors.push(error)
            fixed = true
          }
        }
      }
    }

    if (!fixed) {
      remainingErrors.push(error)
    }
  }

  return { fixedFiles, fixedErrors, remainingErrors }
}
