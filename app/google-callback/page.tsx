// app/google-callback/page.tsx
// 国际版Google OAuth回调处理页面

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function GoogleCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("🔄 Google OAuth回调处理开始")

        // 检查URL中的错误参数
        const urlParams = new URLSearchParams(window.location.search)
        const error = urlParams.get("error")
        const errorDescription = urlParams.get("error_description")

        if (error) {
          console.error("❌ OAuth error:", error, errorDescription)
          setStatus("error")
          setMessage(getErrorMessage(error, errorDescription))
          // 3秒后跳转回登录页
          setTimeout(() => {
            router.push("/login?error=" + error)
          }, 3000)
          return
        }

        // Supabase SDK 会自动处理 URL hash 中的 tokens 并建立 session
        // AuthContext 中的 onAuthStateChange 监听器会自动捕获登录状态
        // 我们只需要等待 session 建立然后跳转
        setMessage("Completing Google authentication...")

        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // 等待 Supabase 处理 URL hash 并建立 session
        // 最多等待 5 秒
        let attempts = 0
        const maxAttempts = 10

        const checkSession = async (): Promise<boolean> => {
          const { data: { session }, error } = await supabase.auth.getSession()

          if (error) {
            console.error("❌ 获取session失败:", error)
            return false
          }

          if (session) {
            console.log("✅ Session已建立:", session.user?.email)
            return true
          }

          return false
        }

        // 轮询检查 session 是否建立
        const pollInterval = setInterval(async () => {
          attempts++

          const hasSession = await checkSession()

          if (hasSession) {
            clearInterval(pollInterval)
            setStatus("success")
            setMessage("Google authentication successful!")

            // 等待 AuthContext 更新状态后跳转
            setTimeout(() => {
              router.push("/generate")
            }, 1500)
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval)
            console.warn("⚠️ Session建立超时")

            // 检查 hash 中是否有 tokens
            const hash = window.location.hash
            if (hash && hash.includes("access_token")) {
              console.log("ℹ️ Hash 中有 tokens 但 session 未建立，可能需要更长时间")
              setMessage("Processing authentication, please wait...")
              // 再等待一会儿
              setTimeout(async () => {
                const finalCheck = await checkSession()
                if (finalCheck) {
                  setStatus("success")
                  setMessage("Google authentication successful!")
                  setTimeout(() => {
                    router.push("/generate")
                  }, 1000)
                } else {
                  setStatus("error")
                  setMessage("Failed to establish session. Please try again.")
                  setTimeout(() => {
                    router.push("/login?error=session_timeout")
                  }, 3000)
                }
              }, 3000)
            } else {
              setStatus("error")
              setMessage("No authentication data found. Please try again.")
              setTimeout(() => {
                router.push("/login?error=no_session")
              }, 3000)
            }
          }
        }, 500)

        return () => clearInterval(pollInterval)

      } catch (err: any) {
        console.error("❌ Callback处理错误:", err)
        setStatus("error")
        setMessage("An unexpected error occurred: " + err.message)
        setTimeout(() => {
          router.push("/login?error=callback_error")
        }, 3000)
      }
    }

    handleCallback()
  }, [router])

  // 渲染不同状态的UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white py-8 px-4 shadow-lg rounded-lg text-center">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto h-16 w-16 text-indigo-600 animate-spin mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Completing Google Authentication
              </h2>
              <p className="text-gray-600">{message || "Please wait while we sign you in..."}</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Authentication Successful!
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to application...</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="mx-auto h-16 w-16 text-red-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Authentication Error
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => router.push("/login")}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// OAuth错误消息映射
function getErrorMessage(error: string | null, description: string | null): string {
  if (!error) return "Unknown error"

  const errorMessages: Record<string, string> = {
    "access_denied": "You denied the authentication request",
    "invalid_request": "The authentication request was invalid",
    "unauthorized_client": "The client is not authorized",
    "unsupported_response_type": "The response type is not supported",
    "invalid_scope": "The requested scope is invalid",
    "server_error": "The authentication server encountered an error",
    "temporarily_unavailable": "The service is temporarily unavailable",
  }

  const message = errorMessages[error] || error
  return description ? `${message}: ${description}` : message
}
