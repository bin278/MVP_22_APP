import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth'
import { query, remove } from '@/lib/database/cloudbase'

export async function DELETE(request: NextRequest) {
  try {
    // 使用CloudBase认证
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    const user = authResult.user

    // 查找并删除GitHub token记录
    try {
      const tokenResult = await query('user_github_tokens', {
        where: { user_id: user.uid || user.id },
        limit: 1
      })

      if (!tokenResult.data || tokenResult.data.length === 0) {
        return NextResponse.json(
          { error: 'GitHub account not connected' },
          { status: 404 }
        )
      }

      // 删除GitHub token记录
      await remove('user_github_tokens', tokenResult.data[0]._id)

      return NextResponse.json({
        success: true,
        message: 'GitHub account unbound successfully'
      })

    } catch (queryError: any) {
      // 如果集合不存在，说明本来就没有连接
      if (queryError.message && queryError.message.includes('DATABASE_COLLECTION_NOT_EXIST')) {
        return NextResponse.json(
          { error: 'GitHub account not connected' },
          { status: 404 }
        )
      }
      throw queryError
    }
  } catch (error: any) {
    console.error('Error unbinding GitHub:', error)
    return NextResponse.json({ error: 'Failed to unbind GitHub account' }, { status: 500 })
  }
}





















