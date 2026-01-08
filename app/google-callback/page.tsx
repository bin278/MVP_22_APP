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

        // 检查hash中的token (Implicit Flow)
        const hash = window.location.hash
        if (hash && hash.includes("access_token")) {
          console.log("🔑 检测到access_token in hash (Implicit Flow)")
          console.log("Hash:", hash.substring(0, 50) + "...")

          // Supabase SDK会自动处理hash并建立session
          // 我们需要等待session建立
          setMessage("Completing Google authentication...")

          // 等待Supabase处理并触发onAuthStateChange
          setTimeout(async () => {
            // 尝试获取session
            const { createClient } = await import("@supabase/supabase-js")
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            console.log("🔍 检查session状态...")
            const { data: { session } } = await supabase.auth.getSession()

            if (session) {
              console.log("✅ Session已建立:", session.user?.email)
              setStatus("success")
              setMessage("Google authentication successful!")

              // 跳转到首页
              setTimeout(() => {
                router.push("/generate")
              }, 1000)
            } else {
              console.warn("⚠️ Session未建立")
              setStatus("error")
              setMessage("Failed to establish session. Please try again.")
              setTimeout(() => {
                router.push("/login?error=session_failed")
              }, 3000)
            }
          }, 2000)
          return
        }

        // 检查query参数中的code (Authorization Code Flow - PKCE)
        const code = urlParams.get("code")
        if (code) {
          console.log("🔑 检测到authorization code (PKCE Flow)")
          console.log("Code:", code.substring(0, 20) + "...")

          setMessage("Exchanging authorization code for session...")

          const { createClient } = await import("@supabase/supabase-js")
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          )

          console.log("🔄 正在交换code for session...")
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error("❌ Code exchange error:", exchangeError)
            setStatus("error")
            setMessage("Failed to exchange code for session: " + exchangeError.message)
            setTimeout(() => {
              router.push("/login?error=code_exchange_failed")
            }, 3000)
            return
          }

          console.log("✅ Session已建立:", data.session?.user?.email)
          setStatus("success")
          setMessage("Google authentication successful!")

          setTimeout(() => {
            router.push("/generate")
          }, 1000)
          return
        }

        // 既没有token也没有code
        console.warn("⚠️ 未找到access_token或authorization code")
        console.log("URL:", window.location.href)
        console.log("Hash:", window.location.hash)
        console.log("SearchParams:", Object.fromEntries(urlParams))

        setStatus("error")
        setMessage("No authentication data found in callback URL")
        setTimeout(() => {
          router.push("/login?error=no_data")
        }, 3000)

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
