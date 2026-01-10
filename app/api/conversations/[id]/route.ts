import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/auth"
import { query, remove, update, getDatabaseProvider } from "@/lib/database"

// GET: 获取对话详情（包括消息和文件）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    const conversationId = id

    // 获取对话信息
    // 根据数据库提供商使用不同的ID字段
    const provider = getDatabaseProvider()
    const idField = provider === 'supabase' ? 'id' : '_id'

    const conversationResult = await query("conversations", {
      where: {
        [idField]: conversationId,
        user_id: user.id
      },
      limit: 1
    })

    if (!conversationResult.data || conversationResult.data.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    const conversation = conversationResult.data[0]

    // 获取消息（确保只返回当前用户的消息）
    // 注意：如果 conversation_messages 集合不存在，忽略错误并返回空数组
    let messagesResult: any = { data: [] }
    try {
      messagesResult = await query("conversation_messages", {
        where: {
          conversation_id: conversationId,
          user_id: user.id  // 额外的安全验证
        },
        orderBy: "created_at",
        orderDirection: "asc"
      })
    } catch (error: any) {
      console.warn("Failed to query conversation_messages (collection might not exist):", error.message)
      messagesResult = { data: [] }
    }

    // 获取文件（确保只返回当前用户的文件）
    const filesResult = await query("conversation_files", {
      where: {
        conversation_id: conversationId,
        user_id: user.id  // 额外的安全验证
      },
      orderBy: "created_at",
      orderDirection: "asc"
    })

    // 格式化响应数据 (使用前面声明的 provider 和 idField)
    const formattedConversation = {
      id: conversation[idField],
      ...conversation
    }

    const formattedMessages = messagesResult.data.map(msg => ({
      id: msg[idField],
      ...msg
    }))

    const formattedFiles = filesResult.data.map(file => ({
      id: file[idField],
      ...file
    }))

    return NextResponse.json({
      success: true,
      conversation: formattedConversation,
      messages: formattedMessages,
      files: formattedFiles,
    })
  } catch (error: any) {
    console.error("Get conversation error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE: 删除对话
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    const conversationId = id

    // 验证对话属于当前用户
    const provider = getDatabaseProvider()
    const idField = provider === 'supabase' ? 'id' : '_id'

    const conversationResult = await query("conversations", {
      where: {
        [idField]: conversationId,
        user_id: user.id
      },
      limit: 1
    })

    if (!conversationResult.data || conversationResult.data.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    // 注意：需要手动删除相关的消息和文件
    // 首先删除消息
    const messagesResult = await query("conversation_messages", {
      where: { conversation_id: conversationId }
    })

    // 删除所有相关的消息
    for (const message of messagesResult.data) {
      try {
        await remove('conversation_messages', message[idField])
      } catch (error) {
        console.error(`Failed to delete message ${message[idField]}:`, error)
      }
    }

    // 删除所有相关的文件
    const filesResult = await query("conversation_files", {
      where: { conversation_id: conversationId }
    })

    for (const file of filesResult.data) {
      try {
        await remove('conversation_files', file[idField])
      } catch (error) {
        console.error(`Failed to delete file ${file[idField]}:`, error)
      }
    }

    // 最后删除对话
    await remove('conversations', conversationId)

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("Delete conversation error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT: 更新对话标题
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    const conversationId = id
    const body = await request.json()
    const { title } = body

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    // 验证对话属于当前用户
    const provider = getDatabaseProvider()
    const idField = provider === 'supabase' ? 'id' : '_id'

    const conversationResult = await query("conversations", {
      where: {
        [idField]: conversationId,
        user_id: user.id
      },
      limit: 1
    })

    if (!conversationResult.data || conversationResult.data.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    // 更新对话标题
    await update('conversations', conversationId, {
      title,
      updated_at: new Date().toISOString()
    })

    // 获取更新后的对话
    const updatedResult = await query("conversations", {
      where: { [idField]: conversationId },
      limit: 1
    })

    const updatedConversation = updatedResult.data[0]

    return NextResponse.json({
      success: true,
      conversation: {
        id: updatedConversation[idField],
        ...updatedConversation
      },
    })
  } catch (error: any) {
    console.error("Update conversation error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

