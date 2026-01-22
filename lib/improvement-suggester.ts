/**
 * 改进建议器 - 基于错误历史提供改进建议
 */

import { classifyError, analyzeErrors, type ErrorStats } from './error-classifier'

export interface ImprovementSuggestion {
  id: string
  priority: 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  actionItems: string[]
  estimatedImpact: string
  relatedErrors: string[]
}

/**
 * 生成改进建议
 */
export function generateImprovementSuggestions(
  errorStats: ErrorStats
): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = []

  // 建议 1: 提高修复成功率
  if (errorStats.fixSuccessRate < 0.7) {
    suggestions.push({
      id: 'improve-fix-rate',
      priority: 'high',
      category: 'Auto-fix',
      title: 'Improve Auto-fix Success Rate',
      description: `Current fix success rate is ${(errorStats.fixSuccessRate * 100).toFixed(1)}%. Consider enhancing auto-fix patterns.`,
      actionItems: [
        'Review failed fix attempts to identify patterns',
        'Add new fix strategies for common errors',
        'Improve AST-based fixing logic'
      ],
      estimatedImpact: 'Could reduce manual fixes by 20-30%',
      relatedErrors: errorStats.topErrors.slice(0, 3).map(e => e.message)
    })
  }

  // 建议 2: 处理高频错误
  if (errorStats.topErrors.length > 0 && errorStats.topErrors[0].count > 10) {
    suggestions.push({
      id: 'address-frequent-errors',
      priority: 'high',
      category: 'Error Prevention',
      title: 'Address Most Frequent Errors',
      description: `Top error occurs ${errorStats.topErrors[0].count} times. Focus on preventing this error.`,
      actionItems: [
        'Add validation to prevent this error at generation time',
        'Improve AI prompt to avoid this pattern',
        'Create specific fix strategy for this error'
      ],
      estimatedImpact: `Could prevent ${errorStats.topErrors[0].count} errors`,
      relatedErrors: [errorStats.topErrors[0].message]
    })
  }

  // 建议 3: 语法错误预防
  if (errorStats.byCategory.syntax > errorStats.totalErrors * 0.4) {
    suggestions.push({
      id: 'prevent-syntax-errors',
      priority: 'high',
      category: 'Code Quality',
      title: 'Reduce Syntax Errors',
      description: `${errorStats.byCategory.syntax} syntax errors (${((errorStats.byCategory.syntax / errorStats.totalErrors) * 100).toFixed(1)}% of total). Improve pre-compilation validation.`,
      actionItems: [
        'Enhance syntax checker with more rules',
        'Add JSX structure validation',
        'Improve AI prompt for better syntax'
      ],
      estimatedImpact: 'Could reduce syntax errors by 40-50%',
      relatedErrors: []
    })
  }

  // 建议 4: 依赖问题
  if (errorStats.byCategory.dependency > 5) {
    suggestions.push({
      id: 'fix-dependency-issues',
      priority: 'medium',
      category: 'Dependencies',
      title: 'Resolve Dependency Issues',
      description: `${errorStats.byCategory.dependency} dependency errors detected. Improve dependency resolution.`,
      actionItems: [
        'Enhance dependency resolver logic',
        'Add missing dependency detection',
        'Improve import path resolution'
      ],
      estimatedImpact: 'Could eliminate most dependency errors',
      relatedErrors: []
    })
  }

  // 建议 5: 严重错误优先处理
  if (errorStats.bySeverity.critical > 0) {
    suggestions.push({
      id: 'address-critical-errors',
      priority: 'high',
      category: 'Stability',
      title: 'Address Critical Errors',
      description: `${errorStats.bySeverity.critical} critical errors that block rendering. These need immediate attention.`,
      actionItems: [
        'Review all critical errors',
        'Add specific handling for critical error types',
        'Implement fallback mechanisms'
      ],
      estimatedImpact: 'Improves system stability significantly',
      relatedErrors: []
    })
  }

  // 按优先级排序
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

/**
 * 生成常见问题文档
 */
export function generateCommonIssuesDoc(errorStats: ErrorStats): string {
  let doc = '# Common Issues and Solutions\n\n'

  doc += `## Overview\n\n`
  doc += `- Total Errors: ${errorStats.totalErrors}\n`
  doc += `- Fix Success Rate: ${(errorStats.fixSuccessRate * 100).toFixed(1)}%\n\n`

  doc += `## Error Distribution\n\n`
  doc += `### By Category\n`
  for (const [category, count] of Object.entries(errorStats.byCategory)) {
    if (count > 0) {
      const percentage = ((count / errorStats.totalErrors) * 100).toFixed(1)
      doc += `- ${category}: ${count} (${percentage}%)\n`
    }
  }

  doc += `\n### By Severity\n`
  for (const [severity, count] of Object.entries(errorStats.bySeverity)) {
    if (count > 0) {
      const percentage = ((count / errorStats.totalErrors) * 100).toFixed(1)
      doc += `- ${severity}: ${count} (${percentage}%)\n`
    }
  }

  doc += `\n## Top 5 Most Frequent Errors\n\n`
  errorStats.topErrors.slice(0, 5).forEach((error, index) => {
    doc += `${index + 1}. **${error.message}** (${error.count} occurrences)\n`
    const classified = classifyError(error.message)
    doc += `   - Category: ${classified.category}\n`
    doc += `   - Severity: ${classified.severity}\n`
    if (classified.suggestedAction) {
      doc += `   - Suggested Action: ${classified.suggestedAction}\n`
    }
    doc += `\n`
  })

  return doc
}

/**
 * 获取预防性建议
 */
export function getPreventiveSuggestions(errorType: string): string[] {
  const suggestions: Record<string, string[]> = {
    'jsx-tag-mismatch': [
      'Always close JSX tags properly',
      'Use an IDE with JSX syntax highlighting',
      'Enable ESLint with React rules'
    ],
    'incomplete-ternary': [
      'Always provide both branches in ternary expressions',
      'Use explicit null/undefined for empty branches',
      'Consider using if-else for complex conditions'
    ],
    'missing-arrow-in-callback': [
      'Use arrow functions in array methods',
      'Double-check callback syntax',
      'Enable TypeScript for better type checking'
    ],
    'class-instead-of-classname': [
      'Remember to use className in JSX, not class',
      'Use a linter to catch this automatically',
      'Create a code snippet for common patterns'
    ]
  }

  return suggestions[errorType] || [
    'Review code carefully before generating',
    'Use linting tools to catch errors early',
    'Test generated code incrementally'
  ]
}
