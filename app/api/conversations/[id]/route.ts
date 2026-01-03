import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/auth"
import { query } from "@/lib/database/cloudbase"

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
    const conversationResult = await query("conversations", {
      where: {
        _id: conversationId,
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
    const messagesResult = await query("conversation_messages", {
      where: {
        conversation_id: conversationId,
        user_id: user.id  // 额外的安全验证
      },
      orderBy: "created_at",
      orderDirection: "asc"
    })

    // 获取文件（确保只返回当前用户的文件）
    const filesResult = await query("conversation_files", {
      where: {
        conversation_id: conversationId,
        user_id: user.id  // 额外的安全验证
      },
      orderBy: "created_at",
      orderDirection: "asc"
    })

    // 格式化响应数据
    const formattedConversation = {
      id: conversation._id,
      ...conversation
    }

    const formattedMessages = messagesResult.data.map(msg => ({
      id: msg._id,
      ...msg
    }))

    const formattedFiles = filesResult.data.map(file => ({
      id: file._id,
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
    const conversationResult = await query("conversations", {
      where: {
        _id: conversationId,
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

    // 注意：CloudBase不支持级联删除，我们需要手动删除相关的消息和文件
    // 首先删除消息
    const messagesResult = await query("conversation_messages", {
      where: { conversation_id: conversationId }
    })

    // 删除所有相关的消息
    for (const message of messagesResult.data) {
      try {
        await require('@/lib/database/cloudbase').remove('conversation_messages', message._id)
      } catch (error) {
        console.error(`Failed to delete message ${message._id}:`, error)
      }
    }

    // 删除所有相关的文件
    const filesResult = await query("conversation_files", {
      where: { conversation_id: conversationId }
    })

    for (const file of filesResult.data) {
      try {
        await require('@/lib/database/cloudbase').remove('conversation_files', file._id)
      } catch (error) {
        console.error(`Failed to delete file ${file._id}:`, error)
      }
    }

    // 最后删除对话
    await require('@/lib/database/cloudbase').remove('conversations', conversationId)

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
    const conversationResult = await query("conversations", {
      where: {
        _id: conversationId,
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
    await require('@/lib/database/cloudbase').update('conversations', conversationId, {
      title,
      updated_at: new Date().toISOString()
    })

    // 获取更新后的对话
    const updatedResult = await query("conversations", {
      where: { _id: conversationId },
      limit: 1
    })

    const updatedConversation = updatedResult.data[0]

    return NextResponse.json({
      success: true,
      conversation: {
        id: updatedConversation._id,
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

