/**
 * AI 辅助修复 - 对复杂错误使用 AI 生成修复建议
 */

export interface AIFixRequest {
  filePath: string
  code: string
  error: string
  context?: {
    surroundingCode?: string
    relatedFiles?: Record<string, string>
  }
}

export interface AIFixResult {
  success: boolean
  fixedCode?: string
  suggestion?: string
  confidence: number
  error?: string
}

/**
 * 使用 AI 生成修复建议
 * 注意：这是一个简化的实现，实际使用时需要集成到 generate-async API
 */
export async function requestAIFix(request: AIFixRequest): Promise<AIFixResult> {
  try {
    // 构建修复提示
    const prompt = buildFixPrompt(request)

    // 这里应该调用 generate-async API
    // 由于这是一个独立的模块，实际集成时需要在调用处实现
    console.log('AI Fix Request:', {
      filePath: request.filePath,
      errorType: extractErrorType(request.error),
      codeLength: request.code.length
    })

    // 返回占位符结果
    return {
      success: false,
      confidence: 0,
      error: 'AI fix not implemented - requires integration with generate-async API'
    }
  } catch (error: any) {
    return {
      success: false,
      confidence: 0,
      error: error.message
    }
  }
}

/**
 * 构建 AI 修复提示
 */
function buildFixPrompt(request: AIFixRequest): string {
  const { filePath, code, error, context } = request

  let prompt = `Fix the following code error:

File: ${filePath}
Error: ${error}

Current Code:
\`\`\`
${code}
\`\`\`
`

  if (context?.surroundingCode) {
    prompt += `\nSurrounding Context:\n\`\`\`\n${context.surroundingCode}\n\`\`\`\n`
  }

  prompt += `
IMPORTANT:
1. Only fix the specific error mentioned
2. Do not add new features or refactor unrelated code
3. Preserve the original code style and structure
4. Return ONLY the fixed code, no explanations

Fixed Code:`

  return prompt
}

/**
 * 提取错误类型
 */
function extractErrorType(error: string): string {
  if (error.includes('JSX')) return 'JSX Error'
  if (error.includes('Unexpected token')) return 'Syntax Error'
  if (error.includes('is not defined')) return 'Reference Error'
  if (error.includes('expected')) return 'Parse Error'
  return 'Unknown Error'
}

/**
 * 判断错误是否适合 AI 修复
 */
export function shouldUseAIFix(error: string, attemptedFixes: number): boolean {
  // 如果已经尝试了多次自动修复仍然失败，考虑使用 AI
  if (attemptedFixes >= 3) return true

  // 复杂的错误类型适合 AI 修复
  const complexErrors = [
    'Type mismatch',
    'Cannot find module',
    'Circular dependency',
    'Invalid hook call',
    'Maximum update depth exceeded'
  ]

  return complexErrors.some(pattern => error.includes(pattern))
}

/**
 * 应用 AI 修复结果
 */
export function applyAIFix(
  originalCode: string,
  fixResult: AIFixResult
): { success: boolean; code: string; message: string } {
  if (!fixResult.success || !fixResult.fixedCode) {
    return {
      success: false,
      code: originalCode,
      message: fixResult.error || 'AI fix failed'
    }
  }

  // 验证修复后的代码不为空
  if (!fixResult.fixedCode.trim()) {
    return {
      success: false,
      code: originalCode,
      message: 'AI returned empty code'
    }
  }

  // 验证修复后的代码长度合理（不应该比原代码短太多或长太多）
  const lengthRatio = fixResult.fixedCode.length / originalCode.length
  if (lengthRatio < 0.5 || lengthRatio > 2) {
    console.warn('AI fix resulted in significant code length change:', lengthRatio)
  }

  return {
    success: true,
    code: fixResult.fixedCode,
    message: fixResult.suggestion || 'Code fixed by AI'
  }
}
