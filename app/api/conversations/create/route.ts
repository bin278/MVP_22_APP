import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/auth"
import { add, getDatabaseProvider } from "@/lib/database"

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
      console.error("Database insert failed:", dbError.message)

      // 在 Supabase 模式下,不应该使用临时 ID
      const provider = getDatabaseProvider()
      if (provider === 'supabase') {
        // Supabase 模式: 抛出错误
        throw new Error(`Failed to create conversation in Supabase: ${dbError.message}`)
      } else {
        // CloudBase 模式: 兼容旧逻辑,创建临时 ID
        console.warn("Database insert failed, creating mock conversation:", dbError.message)
        conversation = {
          id: `temp_${Date.now()}`,
          ...conversationData
        }
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

















