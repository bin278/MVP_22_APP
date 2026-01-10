import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/auth"
import { query, add, update, getDatabaseProvider } from "@/lib/database"

// POST: 保存文件到对话
export async function POST(
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
    const { files } = body // Array of { file_path, file_content }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Files array is required" },
        { status: 400 }
      )
    }

    // 验证对话属于当前用户
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

    // 批量插入或更新文件
    const savedFiles: any[] = []
    for (const file of files) {
      try {
        // 检查文件是否已存在
        const existingFile = await query("conversation_files", {
          where: {
            conversation_id: conversationId,
            file_path: file.file_path,
            user_id: user.id  // 确保只查询当前用户的文件
          },
          limit: 1
        })

        let result
        if (existingFile.data && existingFile.data.length > 0) {
          // 更新现有文件 (使用 idField)
          const docId = existingFile.data[0][idField]
          result = await update("conversation_files", docId, {
            file_content: file.file_content,
            updated_at: new Date().toISOString()
          })
          savedFiles.push({
            ...existingFile.data[0],
            file_content: file.file_content,
            updated_at: new Date().toISOString()
          })
        } else {
          // 添加新文件
          result = await add("conversation_files", {
            conversation_id: conversationId,
            user_id: user.id,  // 确保文件关联到用户
            file_path: file.file_path,
            file_content: file.file_content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          savedFiles.push({
            id: result.id,
            conversation_id: conversationId,
            user_id: user.id,
            file_path: file.file_path,
            file_content: file.file_content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      } catch (fileError) {
        console.error(`Error saving file ${file.file_path}:`, fileError)
        return NextResponse.json(
          { error: `Failed to save file: ${file.file_path}` },
          { status: 500 }
        )
      }
    }

    // 更新对话的 updated_at (使用前面声明的 idField)
    const conversationDocId = conversationResult.data[0][idField]
    await update("conversations", conversationDocId, {
      updated_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      files: savedFiles,
    })
  } catch (error: any) {
    console.error("Save files error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

