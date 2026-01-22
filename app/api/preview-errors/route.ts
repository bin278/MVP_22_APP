/**
 * 错误收集器 - 收集预览系统中的错误报告
 */

import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 10

export interface ErrorReport {
  id?: string
  timestamp: string
  sessionId: string
  errorType: string
  errorMessage: string
  filePath?: string
  lineNumber?: number
  codeSnippet?: string
  fixAttempted: boolean
  fixSuccessful?: boolean
  fixStrategy?: string
  userAgent: string
  metadata?: Record<string, any>
}

// 内存存储（生产环境应使用数据库）
const errorReports: ErrorReport[] = []
const MAX_REPORTS = 1000

export async function POST(request: NextRequest) {
  try {
    const report: ErrorReport = await request.json()

    // 验证必需字段
    if (!report.errorType || !report.errorMessage) {
      return NextResponse.json(
        { error: 'Missing required fields: errorType, errorMessage' },
        { status: 400 }
      )
    }

    // 添加时间戳和 ID
    const errorReport: ErrorReport = {
      ...report,
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || 'unknown'
    }

    // 存储错误报告
    errorReports.push(errorReport)

    // 限制存储数量
    if (errorReports.length > MAX_REPORTS) {
      errorReports.shift()
    }

    console.log(`📊 Error report collected: ${errorReport.errorType}`)

    return NextResponse.json({
      success: true,
      reportId: errorReport.id
    })
  } catch (error: any) {
    console.error('Failed to collect error report:', error)
    return NextResponse.json(
      { error: 'Failed to collect error report' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const errorType = searchParams.get('type')

    let filtered = errorReports

    // 按错误类型过滤
    if (errorType) {
      filtered = filtered.filter(r => r.errorType === errorType)
    }

    // 按时间倒序排序
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // 限制返回数量
    const results = filtered.slice(0, limit)

    return NextResponse.json({
      total: filtered.length,
      reports: results
    })
  } catch (error: any) {
    console.error('Failed to retrieve error reports:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve error reports' },
      { status: 500 }
    )
  }
}
