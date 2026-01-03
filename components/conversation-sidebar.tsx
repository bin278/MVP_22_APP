"use client"

import React, { useState, useEffect } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, MessageSquare, Trash2, Loader2, Edit2, Check, X } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface ConversationSidebarProps {
  currentConversationId: string | null
  onSelectConversation: (id: string | null) => void
  language: "en" | "zh"
}

const translations = {
  en: {
    title: "Conversations",
    newConversation: "New Conversation",
    noConversations: "No conversations yet",
    createFirst: "Create your first conversation",
    deleteConfirm: "Delete Conversation",
    deleteMessage: "Are you sure you want to delete this conversation? This action cannot be undone.",
    delete: "Delete",
    cancel: "Cancel",
    loading: "Loading...",
    editTitle: "Edit title",
    save: "Save",
    cancelEdit: "Cancel",
    updating: "Updating...",
  },
  zh: {
    title: "对话历史",
    newConversation: "新建对话",
    noConversations: "还没有对话",
    createFirst: "创建你的第一个对话",
    deleteConfirm: "删除对话",
    deleteMessage: "确定要删除这个对话吗？此操作无法撤销。",
    delete: "删除",
    cancel: "取消",
    loading: "加载中...",
    editTitle: "编辑标题",
    save: "保存",
    cancelEdit: "取消",
    updating: "更新中...",
  },
}

export function ConversationSidebar({
  currentConversationId,
  onSelectConversation,
  language,
}: ConversationSidebarProps) {
  const { user, session } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const t = translations[language]

  // 加载对话列表
  const loadConversations = async () => {
    if (!user || !session) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/conversations/list", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
        setAuthError(null) // 清除认证错误
      } else if (response.status === 401) {
        console.error("Authentication failed, token may be expired")

        // CloudBase认证失败，清除本地状态并显示认证错误
        setConversations([])
        setAuthError(language === 'en'
          ? 'Your session has expired. Please sign in again.'
          : '您的会话已过期，请重新登录。')
        setLoading(false)
      } else {
        console.error("Failed to load conversations:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Error loading conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && session) {
      loadConversations()
    }
  }, [user, session])

  // 监听认证状态变化（CloudBase版本简化处理）
  useEffect(() => {
    if (!user) {
      setConversations([])
      setLoading(false)
      setAuthError(null)
    }
  }, [user])

  // 创建新对话
  const handleCreateConversation = async () => {
    if (!user || !session) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/conversations/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          title: t.newConversation,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        await loadConversations()
        onSelectConversation(data.conversation.id)
      } else {
        console.error("Failed to create conversation")
      }
    } catch (error) {
      console.error("Error creating conversation:", error)
    } finally {
      setIsCreating(false)
    }
  }

  // 删除对话
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConversationToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!conversationToDelete || !user || !session) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/conversations/${conversationToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      })

      if (response.ok) {
        await loadConversations()
        if (currentConversationId === conversationToDelete) {
          onSelectConversation(null)
        }
      } else {
        console.error("Failed to delete conversation")
      }
    } catch (error) {
      console.error("Error deleting conversation:", error)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setConversationToDelete(null)
    }
  }

  // 开始编辑标题
  const handleStartEdit = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(conversation.id)
    setEditingTitle(conversation.title)
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingTitle("")
  }

  // 保存标题
  const handleSaveTitle = async (id: string) => {
    if (!editingTitle.trim() || !user || !session) {
      handleCancelEdit()
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          title: editingTitle.trim(),
        }),
      })

      if (response.ok) {
        await loadConversations()
        setEditingId(null)
        setEditingTitle("")
      } else {
        console.error("Failed to update conversation title")
        alert(language === "en" ? "Failed to update title" : "更新标题失败")
      }
    } catch (error) {
      console.error("Error updating conversation title:", error)
      alert(language === "en" ? "Error updating title" : "更新标题时出错")
    } finally {
      setIsUpdating(false)
    }
  }

  // 处理输入框键盘事件
  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSaveTitle(id)
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) {
      return language === "en" ? "Just now" : "刚刚"
    } else if (diffMins < 60) {
      return language === "en" ? `${diffMins}m ago` : `${diffMins}分钟前`
    } else if (diffHours < 24) {
      return language === "en" ? `${diffHours}h ago` : `${diffHours}小时前`
    } else if (diffDays < 7) {
      return language === "en" ? `${diffDays}d ago` : `${diffDays}天前`
    } else {
      return date.toLocaleDateString(language === "en" ? "en-US" : "zh-CN")
    }
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">{t.title}</h2>
          </div>
          <Button
            onClick={handleCreateConversation}
            disabled={isCreating}
            className="w-full"
            size="sm"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === "en" ? "Creating..." : "创建中..."}
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {t.newConversation}
              </>
            )}
          </Button>
        </SidebarHeader>
        <SidebarContent>
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-300">
              {t.loading}
            </div>
          ) : authError ? (
            <div className="p-4 text-center text-sm text-red-400">
              <div className="mb-2">⚠️ {authError}</div>
              <Button
                onClick={() => {
                  // 清除错误状态并尝试重新加载
                  setAuthError(null)
                  if (user && session) {
                    loadConversations()
                  }
                }}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                {language === 'en' ? 'Retry' : '重试'}
              </Button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-300">
              <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>{t.noConversations}</p>
              <p className="text-xs mt-1">{t.createFirst}</p>
            </div>
          ) : (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {conversations.map((conversation, index) => (
                    <React.Fragment key={conversation.id}>
                      <SidebarMenuItem className="mb-2">
                        {editingId === conversation.id ? (
                          <div className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-all hover:bg-gray-800 hover:text-white focus-visible:ring-2 active:bg-gray-700 active:text-white disabled:pointer-events-none disabled:opacity-50 overflow-visible bg-black">
                            <MessageSquare className="h-4 w-4" />
                            <div className="flex-1 min-w-0">
                              <div className="space-y-1 relative z-10">
                                <Input
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, conversation.id)}
                                  onBlur={() => {
                                    // 延迟执行，避免与按钮点击冲突
                                    setTimeout(() => {
                                      if (editingId === conversation.id) {
                                        handleSaveTitle(conversation.id)
                                      }
                                    }, 200)
                                  }}
                                  autoFocus
                                  className="h-7 text-sm"
                                  disabled={isUpdating}
                                  onClick={(e) => e.stopPropagation()}
                                  onFocus={(e) => e.stopPropagation()}
                                  maxLength={255}
                                />
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-5 w-5 hover:bg-accent hover:text-accent-foreground"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSaveTitle(conversation.id)
                                    }}
                                    disabled={isUpdating}
                                  >
                                    <Check className="h-3 w-3 text-green-600" />
                                  </button>
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-5 w-5 hover:bg-accent hover:text-accent-foreground"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCancelEdit()
                                    }}
                                    disabled={isUpdating}
                                  >
                                    <X className="h-3 w-3 text-muted-foreground" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <SidebarMenuButton
                            onClick={(e) => {
                              // 如果点击的是操作按钮区域，不切换对话
                              if ((e.target as HTMLElement).closest('[data-sidebar="menu-action"]')) {
                                return
                              }
                              onSelectConversation(conversation.id)
                            }}
                            isActive={currentConversationId === conversation.id}
                            className={`group relative bg-black hover:bg-gray-800 ${
                              currentConversationId === conversation.id
                                ? '!bg-gray-700 !border-l-4 !border-blue-500'
                                : ''
                            }`}
                          >
                            <MessageSquare className="h-4 w-4" />
                            <div className="flex-1 min-w-0">
                              <div className={`truncate text-sm font-medium ${
                                currentConversationId === conversation.id ? '!text-white' : 'text-white'
                              }`}>
                                {conversation.title}
                              </div>
                              <div className={`text-xs ${
                                currentConversationId === conversation.id ? '!text-gray-200' : 'text-gray-300'
                              }`}>
                                {formatDate(conversation.updated_at)}
                              </div>
                            </div>
                          </SidebarMenuButton>
                          <SidebarMenuAction
                            asChild
                            onClick={(e) => handleStartEdit(conversation, e)}
                            showOnHover={false}
                            className="absolute top-1.5 right-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <button type="button" title="编辑对话标题">
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </SidebarMenuAction>
                          <SidebarMenuAction
                            asChild
                            onClick={(e) => handleDeleteConversation(conversation.id, e)}
                            showOnHover={false}
                            className="absolute top-1.5 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <button type="button" title="删除对话">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </SidebarMenuAction>
                          </>
                        )}
                      </SidebarMenuItem>
                      {index < conversations.length - 1 && (
                        <Separator className="my-1 bg-gray-600" />
                      )}
                    </React.Fragment>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-gray-700 text-xs text-gray-300 text-center">
          {conversations.length} {language === "en" ? "conversations" : "个对话"}
        </SidebarFooter>
      </Sidebar>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "en" ? "Deleting..." : "删除中..."}
                </>
              ) : (
                t.delete
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

