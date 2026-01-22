/**
 * 语法检查器 - 在 Babel 编译前进行预验证
 * 检查常见的 JSX 语法错误，提供更友好的错误信息
 */

export interface SyntaxError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning'
  suggestion?: string
}

export interface SyntaxCheckResult {
  valid: boolean
  errors: SyntaxError[]
}

/**
 * 检查 JSX 标签是否匹配
 * 注意：这是一个简化的检查器，可能在复杂的 JSX 表达式中产生误报
 * 如果编译成功但语法检查失败，以编译结果为准
 */
function checkJSXTagMatching(code: string): SyntaxError[] {
  const errors: SyntaxError[] = []

  // 简化检查：只检查明显的标签不匹配
  // 由于 JSX 的复杂性（表达式、注释、字符串等），完整的解析需要 AST
  // 这里只做基本检查，避免误报

  try {
    const stack: { tag: string; line: number; column: number }[] = []
    const tagRegex = /<\/?(\w+)(?:\s[^>]*?)?(\s*\/)?>/g
    let match

    while ((match = tagRegex.exec(code)) !== null) {
      const fullMatch = match[0]
      const tagName = match[1]
      const isClosing = fullMatch.startsWith('</')
      const isSelfClosing = match[2] && match[2].includes('/')

      // 计算行号和列号
      const beforeMatch = code.substring(0, match.index)
      const line = beforeMatch.split('\n').length
      const lastNewline = beforeMatch.lastIndexOf('\n')
      const column = match.index - lastNewline

      if (isClosing) {
        // 结束标签 - 只在栈完全为空时报错
        if (stack.length === 0) {
          // 可能是误报，不报告
          continue
        }
        const lastOpen = stack[stack.length - 1]
        if (lastOpen.tag === tagName) {
          stack.pop()
        }
        // 不报告不匹配错误，因为可能是误报
      } else if (!isSelfClosing) {
        // 开始标签（非自闭合）
        stack.push({ tag: tagName, line, column })
      }
    }

    // 只报告明显未闭合的标签（栈中剩余超过2个）
    if (stack.length > 2) {
      stack.forEach(unclosed => {
        errors.push({
          line: unclosed.line,
          column: unclosed.column,
          message: `Possibly unclosed tag <${unclosed.tag}>`,
          severity: 'warning',
          suggestion: `Check if </${unclosed.tag}> is missing`
        })
      })
    }
  } catch (e) {
    // 检查失败时不报错
  }

  return errors
}

/**
 * 检查括号匹配
 */
function checkBracketMatching(code: string): SyntaxError[] {
  const errors: SyntaxError[] = []
  const lines = code.split('\n')

  let openParens = 0
  let openBraces = 0
  let openBrackets = 0

  lines.forEach((line, lineIndex) => {
    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      // 跳过字符串和注释
      if (char === '"' || char === "'" || char === '`') {
        const quote = char
        i++
        while (i < line.length && line[i] !== quote) {
          if (line[i] === '\\') i++
          i++
        }
        continue
      }

      if (char === '(') openParens++
      else if (char === ')') openParens--
      else if (char === '{') openBraces++
      else if (char === '}') openBraces--
      else if (char === '[') openBrackets++
      else if (char === ']') openBrackets--

      if (openParens < 0) {
        errors.push({
          line: lineIndex + 1,
          column: i + 1,
          message: 'Unmatched closing parenthesis )',
          severity: 'error'
        })
        openParens = 0
      }
      if (openBraces < 0) {
        errors.push({
          line: lineIndex + 1,
          column: i + 1,
          message: 'Unmatched closing brace }',
          severity: 'error'
        })
        openBraces = 0
      }
      if (openBrackets < 0) {
        errors.push({
          line: lineIndex + 1,
          column: i + 1,
          message: 'Unmatched closing bracket ]',
          severity: 'error'
        })
        openBrackets = 0
      }
    }
  })

  if (openParens > 0) {
    errors.push({
      line: lines.length,
      column: 1,
      message: `${openParens} unclosed parenthesis(es)`,
      severity: 'error',
      suggestion: 'Add missing closing parenthesis )'
    })
  }
  if (openBraces > 0) {
    errors.push({
      line: lines.length,
      column: 1,
      message: `${openBraces} unclosed brace(s)`,
      severity: 'error',
      suggestion: 'Add missing closing brace }'
    })
  }
  if (openBrackets > 0) {
    errors.push({
      line: lines.length,
      column: 1,
      message: `${openBrackets} unclosed bracket(s)`,
      severity: 'error',
      suggestion: 'Add missing closing bracket ]'
    })
  }

  return errors
}

/**
 * 检查常见的 JSX 语法错误
 */
function checkCommonJSXErrors(code: string): SyntaxError[] {
  const errors: SyntaxError[] = []
  const lines = code.split('\n')

  lines.forEach((line, lineIndex) => {
    // 检查 className 拼写错误
    if (line.includes('class=') && !line.includes('className=')) {
      const match = line.match(/class=/)
      if (match) {
        errors.push({
          line: lineIndex + 1,
          column: match.index! + 1,
          message: 'Use className instead of class in JSX',
          severity: 'error',
          suggestion: 'Change class= to className='
        })
      }
    }

    // 检查未闭合的 JSX 属性
    const unclosedAttr = line.match(/(\w+)="[^"]*$/)
    if (unclosedAttr) {
      errors.push({
        line: lineIndex + 1,
        column: unclosedAttr.index! + 1,
        message: 'Unclosed JSX attribute',
        severity: 'error',
        suggestion: 'Add closing quote for the attribute value'
      })
    }

    // 检查相邻的 JSX 元素（缺少包裹元素）
    const adjacentElements = line.match(/>\s*<[A-Z]/)
    if (adjacentElements && !line.includes('return')) {
      errors.push({
        line: lineIndex + 1,
        column: adjacentElements.index! + 1,
        message: 'Adjacent JSX elements must be wrapped in an enclosing tag',
        severity: 'error',
        suggestion: 'Wrap elements in <> </> or a parent element'
      })
    }
  })

  return errors
}

/**
 * 主语法检查函数
 */
export function checkSyntax(code: string, filePath: string): SyntaxCheckResult {
  const allErrors: SyntaxError[] = []

  // 只检查 JSX/TSX 文件
  if (!filePath.endsWith('.jsx') && !filePath.endsWith('.tsx')) {
    return { valid: true, errors: [] }
  }

  // 执行各项检查
  allErrors.push(...checkJSXTagMatching(code))
  allErrors.push(...checkBracketMatching(code))
  allErrors.push(...checkCommonJSXErrors(code))

  // 按行号排序
  allErrors.sort((a, b) => a.line - b.line)

  return {
    valid: allErrors.filter(e => e.severity === 'error').length === 0,
    errors: allErrors
  }
}
