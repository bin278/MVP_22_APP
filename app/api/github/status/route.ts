import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth'
import { query } from '@/lib/database/cloudbase'

/**
 * Check GitHub connection status
 * GET /api/github/status
 */
export async function GET(request: NextRequest) {
  try {
    // 使用CloudBase认证
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { connected: false, error: authResult.error },
        { status: 401 }
      )
    }

    const user = authResult.user

    // Check if GitHub token exists in CloudBase
    try {
      const tokenResult = await query('user_github_tokens', {
        where: { user_id: user.uid || user.id },
        limit: 1
      })

      if (!tokenResult.data || tokenResult.data.length === 0) {
        return NextResponse.json({
          connected: false,
        })
      }

      const tokenData = tokenResult.data[0]
      return NextResponse.json({
        connected: true,
        username: tokenData.github_username,
      })

    } catch (queryError: any) {
      console.warn("GitHub status check failed:", queryError.message)
      // 如果数据库查询失败，默认返回未连接状态
      return NextResponse.json({
        connected: false,
      })
    }
  } catch (error: any) {
    console.error('Error checking GitHub status:', error)
    return NextResponse.json(
      { connected: false, error: error.message },
      { status: 500 }
    )
  }
}

