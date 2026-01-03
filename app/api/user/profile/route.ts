import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth'

export async function GET(request: NextRequest) {
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

    // Return user information
    const userProfile = {
      user: {
        id: user.uid || user.id,
        email: user.email,
        created_at: user.createdAt || user.created_at,
        updated_at: user.updatedAt || user.updated_at,
        full_name: user.fullName || user.user_metadata?.full_name,
        last_sign_in_at: user.lastSignInAt || user.last_sign_in_at
      }
    }

    return NextResponse.json(userProfile)

  } catch (error) {
    console.error('Error in profile API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}











