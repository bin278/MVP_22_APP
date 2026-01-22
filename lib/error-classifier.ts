/**
 * 问题分类器 - 对错误进行分类和严重程度评估
 */

export type ErrorCategory = 'syntax' | 'runtime' | 'dependency' | 'type' | 'performance' | 'security' | 'other'
export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info'

export interface ClassifiedError {
  category: ErrorCategory
  severity: ErrorSeverity
  description: string
  suggestedAction?: string
  relatedPatterns?: string[]
}

/**
 * 分类错误
 */
export function classifyError(errorMessage: string, context?: {
  filePath?: string
  codeSnippet?: string
  stackTrace?: string
}): ClassifiedError {
  const msg = errorMessage.toLowerCase()

  // 语法错误
  if (msg.includes('syntax error') || msg.includes('unexpected token') || msg.includes('expected')) {
    return {
      category: 'syntax',
      severity: determineSyntaxSeverity(errorMessage),
      description: 'Code syntax error that prevents compilation',
      suggestedAction: 'Check for missing brackets, quotes, or incorrect syntax',
      relatedPatterns: ['jsx-tag-mismatch', 'incomplete-ternary', 'missing-arrow-in-callback']
    }
  }

  // JSX 相关错误
  if (msg.includes('jsx') || msg.includes('closing tag')) {
    return {
      category: 'syntax',
      severity: 'error',
      description: 'JSX structure error',
      suggestedAction: 'Verify all JSX tags are properly opened and closed',
      relatedPatterns: ['jsx-tag-mismatch', 'adjacent-jsx-elements']
    }
  }

  // 运行时错误
  if (msg.includes('is not defined') || msg.includes('undefined') || msg.includes('null')) {
    return {
      category: 'runtime',
      severity: 'error',
      description: 'Variable or function not defined at runtime',
      suggestedAction: 'Ensure all variables and functions are declared before use',
      relatedPatterns: []
    }
  }

  // 依赖错误
  if (msg.includes('cannot find module') || msg.includes('module not found') || msg.includes('import')) {
    return {
      category: 'dependency',
      severity: 'critical',
      description: 'Missing or incorrect module import',
      suggestedAction: 'Check import paths and ensure all dependencies are available',
      relatedPatterns: []
    }
  }

  // 类型错误
  if (msg.includes('type') && (msg.includes('mismatch') || msg.includes('expected'))) {
    return {
      category: 'type',
      severity: 'warning',
      description: 'Type mismatch or incorrect type usage',
      suggestedAction: 'Verify variable types match expected types',
      relatedPatterns: []
    }
  }

  // 性能问题
  if (msg.includes('maximum') || msg.includes('stack') || msg.includes('memory')) {
    return {
      category: 'performance',
      severity: 'critical',
      description: 'Performance issue or resource exhaustion',
      suggestedAction: 'Check for infinite loops or excessive recursion',
      relatedPatterns: []
    }
  }

  // 安全问题
  if (msg.includes('xss') || msg.includes('injection') || msg.includes('unsafe')) {
    return {
      category: 'security',
      severity: 'critical',
      description: 'Potential security vulnerability',
      suggestedAction: 'Review code for security best practices',
      relatedPatterns: []
    }
  }

  // 默认分类
  return {
    category: 'other',
    severity: 'error',
    description: 'Unclassified error',
    suggestedAction: 'Review error message and context for details',
    relatedPatterns: []
  }
}

/**
 * 确定语法错误的严重程度
 */
function determineSyntaxSeverity(errorMessage: string): ErrorSeverity {
  const msg = errorMessage.toLowerCase()

  // 阻止编译的严重错误
  if (msg.includes('unexpected end of file') || msg.includes('unexpected eof')) {
    return 'critical'
  }

  // 标准语法错误
  if (msg.includes('unexpected token') || msg.includes('expected')) {
    return 'error'
  }

  // 可能的警告
  return 'warning'
}

/**
 * 分析错误频率和模式
 */
export interface ErrorStats {
  totalErrors: number
  byCategory: Record<ErrorCategory, number>
  bySeverity: Record<ErrorSeverity, number>
  topErrors: Array<{ message: string; count: number }>
  fixSuccessRate: number
}

export function analyzeErrors(errors: Array<{
  errorMessage: string
  fixSuccessful?: boolean
}>): ErrorStats {
  const stats: ErrorStats = {
    totalErrors: errors.length,
    byCategory: {
      syntax: 0,
      runtime: 0,
      dependency: 0,
      type: 0,
      performance: 0,
      security: 0,
      other: 0
    },
    bySeverity: {
      critical: 0,
      error: 0,
      warning: 0,
      info: 0
    },
    topErrors: [],
    fixSuccessRate: 0
  }

  const errorCounts = new Map<string, number>()
  let fixedCount = 0

  for (const error of errors) {
    const classified = classifyError(error.errorMessage)

    // 统计分类
    stats.byCategory[classified.category]++
    stats.bySeverity[classified.severity]++

    // 统计错误频率
    const count = errorCounts.get(error.errorMessage) || 0
    errorCounts.set(error.errorMessage, count + 1)

    // 统计修复成功率
    if (error.fixSuccessful) {
      fixedCount++
    }
  }

  // 计算修复成功率
  stats.fixSuccessRate = errors.length > 0 ? fixedCount / errors.length : 0

  // 获取最常见的错误
  stats.topErrors = Array.from(errorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([message, count]) => ({ message, count }))

  return stats
}
