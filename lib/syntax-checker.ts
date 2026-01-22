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
 */
function checkJSXTagMatching(code: string): SyntaxError[] {
  const errors: SyntaxError[] = []
  const lines = code.split('\n')
  const stack: { tag: string; line: number; column: number }[] = []

  lines.forEach((line, lineIndex) => {
    // 匹配开始标签 <tag> 或自闭合标签 <tag />
    const openTagRegex = /<(\w+)(?:\s[^>]*)?(\/?)\>/g
    let match

    while ((match = openTagRegex.exec(line)) !== null) {
      const tagName = match[1]
      const isSelfClosing = match[2] === '/'

      if (!isSelfClosing) {
        stack.push({
          tag: tagName,
          line: lineIndex + 1,
          column: match.index + 1
        })
      }
    }

    // 匹配结束标签 </tag>
    const closeTagRegex = /<\/(\w+)>/g
    while ((match = closeTagRegex.exec(line)) !== null) {
      const tagName = match[1]

      if (stack.length === 0) {
        errors.push({
          line: lineIndex + 1,
          column: match.index + 1,
          message: `Unmatched closing tag </${tagName}>`,
          severity: 'error',
          suggestion: `Remove this closing tag or add the corresponding opening tag <${tagName}>`
        })
      } else {
        const lastOpen = stack[stack.length - 1]
        if (lastOpen.tag !== tagName) {
          errors.push({
            line: lineIndex + 1,
            column: match.index + 1,
            message: `Mismatched tags: expected </${lastOpen.tag}> but found </${tagName}>`,
            severity: 'error',
            suggestion: `Change </${tagName}> to </${lastOpen.tag}> or fix the opening tag`
          })
        } else {
          stack.pop()
        }
      }
    }
  })

  // 检查未闭合的标签
  stack.forEach(unclosed => {
    errors.push({
      line: unclosed.line,
      column: unclosed.column,
      message: `Unclosed tag <${unclosed.tag}>`,
      severity: 'error',
      suggestion: `Add closing tag </${unclosed.tag}> before the end of the component`
    })
  })

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
