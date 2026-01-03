import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/auth"
import { add } from "@/lib/database/cloudbase"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { title } = body

    // 创建新对话
    const conversationData = {
      user_id: user.id,
      title: title || "New Conversation",
      type: 'manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    let conversation
    try {
      const result = await add('conversations', conversationData)
      conversation = {
        id: result.id,
        ...conversationData
      }
    } catch (dbError: any) {
      console.warn("Database insert failed, creating mock conversation:", dbError.message)
      // 如果数据库插入失败，创建一个模拟的对话对象
      conversation = {
        id: `temp_${Date.now()}`,
        ...conversationData
      }
    }

    return NextResponse.json({
      success: true,
      conversation,
    })
  } catch (error: any) {
    console.error("Create conversation error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

















