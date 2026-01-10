import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/auth"
import { query, getDatabaseProvider } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("List conversations API called")

    // 使用CloudBase认证
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      console.log("Authentication failed:", authResult.error)
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    const user = authResult.user
    console.log("User authenticated:", user.id)

    console.log("Fetching conversations for user:", user.id)
    console.log("Database provider:", getDatabaseProvider())

    // 获取用户的所有对话，按更新时间倒序
    let conversations = []
    try {
      const result = await query("conversations", {
        where: { user_id: user.id },
        orderBy: "updated_at",
        orderDirection: "desc"
      })

      console.log("Successfully fetched", result.data.length, "conversations")

      // 转换数据格式以保持兼容性
      // CloudBase 使用 _id, Supabase 使用 id
      conversations = result.data.map(conv => ({
        id: conv._id || conv.id,
        ...conv
      }))
    } catch (dbError: any) {
      console.warn("Database query failed, returning empty conversations list:", dbError.message)
      // 如果数据库查询失败，返回空列表而不是报错
      conversations = []
    }

    return NextResponse.json({
      success: true,
      conversations: conversations,
    })
  } catch (error: any) {
    console.error("Unexpected error in list conversations:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error", stack: error.stack },
      { status: 500 }
    )
  }
}

