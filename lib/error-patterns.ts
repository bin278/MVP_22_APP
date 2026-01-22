/**
 * 错误模式匹配器 - 集中管理错误模式和修复策略
 */

export interface ErrorPattern {
  id: string
  name: string
  pattern: RegExp | ((error: string) => boolean)
  severity: 'error' | 'warning'
  confidence: number // 0-1, 修复成功的置信度
  fixStrategy: (code: string, error: string) => { fixed: boolean; code: string; suggestion?: string }
  description: string
  examples?: {
    before: string
    after: string
  }
}

/**
 * 预定义的错误模式
 */
export const ERROR_PATTERNS: ErrorPattern[] = [
  {
    id: 'jsx-tag-mismatch',
    name: 'JSX Tag Mismatch',
    pattern: /Expected corresponding JSX closing tag/,
    severity: 'error',
    confidence: 0.9,
    description: 'JSX 标签不匹配，缺少开始或结束标签',
    fixStrategy: (code, error) => {
      // 由 AST 修复器处理
      return { fixed: false, code }
    }
  },
  {
    id: 'incomplete-ternary',
    name: 'Incomplete Ternary Expression',
    pattern: /expected ":"/,
    severity: 'error',
    confidence: 0.85,
    description: '不完整的三元表达式，缺少 : 部分',
    fixStrategy: (code, error) => {
      // 查找不完整的三元表达式
      const ternaryPattern = /\?\s*([^:]+)\s*(?:\)|;|,|\})/g
      if (ternaryPattern.test(code)) {
        const fixed = code.replace(ternaryPattern, (match, trueValue) => {
          return `? ${trueValue.trim()} : null${match.slice(-1)}`
        })
        return {
          fixed: fixed !== code,
          code: fixed,
          suggestion: 'Added ": null" to incomplete ternary expression'
        }
      }
      return { fixed: false, code }
    },
    examples: {
      before: 'const x = condition ? value )',
      after: 'const x = condition ? value : null )'
    }
  },
  {
    id: 'missing-arrow-in-callback',
    name: 'Missing Arrow in Callback',
    pattern: /Unexpected token/,
    severity: 'error',
    confidence: 0.75,
    description: '回调函数缺少箭头 =>',
    fixStrategy: (code, error) => {
      // 修复 .map(item: item.id) -> .map(item => item.id)
      const callbackPattern = /\.(map|filter|reduce|forEach|find|some|every)\((\w+):\s+/g
      if (callbackPattern.test(code)) {
        const fixed = code.replace(callbackPattern, '.$1($2 => ')
        return {
          fixed: fixed !== code,
          code: fixed,
          suggestion: 'Added => to callback function'
        }
      }
      return { fixed: false, code }
    },
    examples: {
      before: 'items.map(item: item.id)',
      after: 'items.map(item => item.id)'
    }
  },
  {
    id: 'class-instead-of-classname',
    name: 'class instead of className',
    pattern: /class=/,
    severity: 'error',
    confidence: 0.95,
    description: 'JSX 中应使用 className 而不是 class',
    fixStrategy: (code, error) => {
      if (code.includes('class=') && !code.includes('className=')) {
        const fixed = code.replace(/\bclass=/g, 'className=')
        return {
          fixed: true,
          code: fixed,
          suggestion: 'Changed class= to className='
        }
      }
      return { fixed: false, code }
    },
    examples: {
      before: '<div class="container">',
      after: '<div className="container">'
    }
  },
  {
    id: 'object-property-comparison',
    name: 'Object Property with Comparison Operator',
    pattern: /Unexpected token/,
    severity: 'error',
    confidence: 0.7,
    description: '对象属性使用了比较运算符而不是冒号',
    fixStrategy: (code, error) => {
      // 修复 { backgroundColor === 'dark' } -> { backgroundColor: theme === 'dark' ? '#000' : '#fff' }
      const propertyPattern = /(\{[^}]*,\s*)([a-zA-Z_]\w*)\s+(===|!==)\s+/g
      if (propertyPattern.test(code)) {
        const fixed = code.replace(propertyPattern, '$1$2: $2 $3 ')
        return {
          fixed: fixed !== code,
          code: fixed,
          suggestion: 'Changed comparison operator to colon in object property'
        }
      }
      return { fixed: false, code }
    }
  },
  {
    id: 'adjacent-jsx-elements',
    name: 'Adjacent JSX Elements',
    pattern: /Adjacent JSX elements must be wrapped/,
    severity: 'error',
    confidence: 0.8,
    description: '相邻的 JSX 元素需要包裹在父元素中',
    fixStrategy: (code, error) => {
      // 查找 return 后的相邻元素
      const adjacentPattern = /return\s*\(\s*\n?\s*(<[A-Z]\w+[^>]*>[\s\S]*?<\/[A-Z]\w+>)\s*\n?\s*(<[A-Z]\w+[^>]*>[\s\S]*?<\/[A-Z]\w+>)/
      const match = code.match(adjacentPattern)
      if (match) {
        const fixed = code.replace(adjacentPattern, `return (\n    <>\n      ${match[1]}\n      ${match[2]}\n    </>`)
        return {
          fixed: true,
          code: fixed,
          suggestion: 'Wrapped adjacent JSX elements in React Fragment'
        }
      }
      return { fixed: false, code }
    },
    examples: {
      before: 'return (\n  <div>A</div>\n  <div>B</div>\n)',
      after: 'return (\n  <>\n    <div>A</div>\n    <div>B</div>\n  </>\n)'
    }
  }
]

/**
 * 匹配错误并返回对应的模式
 */
export function matchErrorPattern(error: string): ErrorPattern | null {
  for (const pattern of ERROR_PATTERNS) {
    if (typeof pattern.pattern === 'function') {
      if (pattern.pattern(error)) {
        return pattern
      }
    } else {
      if (pattern.pattern.test(error)) {
        return pattern
      }
    }
  }
  return null
}

/**
 * 获取所有匹配的模式（按置信度排序）
 */
export function matchAllPatterns(error: string): ErrorPattern[] {
  const matches: ErrorPattern[] = []

  for (const pattern of ERROR_PATTERNS) {
    if (typeof pattern.pattern === 'function') {
      if (pattern.pattern(error)) {
        matches.push(pattern)
      }
    } else {
      if (pattern.pattern.test(error)) {
        matches.push(pattern)
      }
    }
  }

  // 按置信度降序排序
  return matches.sort((a, b) => b.confidence - a.confidence)
}

/**
 * 应用修复策略
 */
export function applyFixStrategy(
  code: string,
  error: string,
  pattern: ErrorPattern
): { fixed: boolean; code: string; suggestion?: string } {
  try {
    return pattern.fixStrategy(code, error)
  } catch (e) {
    console.error(`Failed to apply fix strategy for ${pattern.id}:`, e)
    return { fixed: false, code }
  }
}
