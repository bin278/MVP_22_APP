"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Separator } from "@/components/ui/separator"

// 微信登录图标组件
const WechatIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348z"/>
  </svg>
)

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isWechatLoading, setIsWechatLoading] = useState(false)
  const [error, setError] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetMessage, setResetMessage] = useState("")

  const { signIn, signInWithWechat, resetPassword } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        router.push("/")
      }
    } catch (err: any) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleWechatLogin = async () => {
    setIsWechatLoading(true)
    setError("")

    try {
      // 检测是否在 Capacitor APP 中
      const userAgent = navigator.userAgent
      const isFromCapacitorApp = userAgent.includes('CapacitorApp/com.mornfront.android.app')

      const win = window as any
      const hasCapacitor = typeof win.Capacitor !== 'undefined'
      const isNative = hasCapacitor && win.Capacitor.isNativePlatform()

      const isNativeApp = isFromCapacitorApp || isNative

      console.log('[WeChat Login] Detection:', {
        userAgent,
        isFromCapacitorApp,
        hasCapacitor,
        isNative,
        isNativeApp
      })

      // 在原生 APP 中，尝试使用微信 SDK
      if (isFromCapacitorApp) {
        // 检测到原生 APP UserAgent
        console.log('[WeChat Login] Detected native app via UserAgent')

        // 尝试使用微信 SDK
        if (hasCapacitor) {
          try {
            const { WeChat } = win.Capacitor.Plugins || {}

            if (WeChat) {
              console.log('[WeChat Login] Using WeChat SDK')

              // 使用微信 SDK 发送登录请求
              const result = await WeChat.sendAuthRequest({
                scope: 'snsapi_userinfo',
                state: Date.now().toString()
              })

              console.log('[WeChat Login] SDK result:', result)

              if (result.code) {
                // 将微信授权码发送到后端
                const response = await fetch('/api/auth/wechat/callback', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code: result.code })
                })

                if (!response.ok) {
                  throw new Error('微信登录失败')
                }

                router.push('/')
                return
              }
            }
          } catch (sdkError: any) {
            console.error('[WeChat Login] SDK error:', sdkError)
            // SDK 调用失败，fallback 到二维码登录
          }
        }

        // SDK 不可用，直接跳转到微信授权链接
        // Android 端会拦截链接并调起微信 APP
        console.log('[WeChat Login] Redirecting to WeChat authorization')
        const endpoint = '/api/auth/wechat/mobile'
        const nextPath = '/'
        const response = await fetch(`${endpoint}?next=${encodeURIComponent(nextPath)}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(`获取微信移动端授权失败: ${errorData.error || '未知错误'}`)
        }

        const data = await response.json()
        const authUrl = data.authUrl

        if (!authUrl) {
          throw new Error('未获取到微信授权链接')
        }

        // 跳转到微信授权页面
        // Android MainActivity 会拦截此链接并调起微信 APP
        window.location.href = authUrl
        return
      } else {
        // Web 端：使用二维码登录
        console.log('[WeChat Login] Using QR code login')
        const endpoint = '/api/auth/wechat/qrcode'
        const nextPath = '/'
        const response = await fetch(`${endpoint}?next=${encodeURIComponent(nextPath)}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(`获取微信登录二维码失败: ${errorData.error || '未知错误'}`)
        }

        const data = await response.json()
        const authUrl = data.qrcodeUrl

        if (!authUrl) {
          throw new Error('未获取到微信登录二维码')
        }

        window.location.href = authUrl
      }

    } catch (err: any) {
      console.error('[WeChat Login] Error:', err)
      setError(err.message || "微信登录过程中发生错误")
      setIsWechatLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResetMessage("")

    try {
      const { error } = await resetPassword(resetEmail)
      if (error) {
        setResetMessage(error.message)
      } else {
        setResetMessage("Password reset email sent! Check your inbox.")
      }
    } catch (err: any) {
      setResetMessage("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (showResetForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <Sparkles className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              {resetMessage && (
                <Alert className={resetMessage.includes("sent") ? "border-green-200 bg-green-50" : ""}>
                  <AlertDescription>{resetMessage}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-center">
            <Button
              variant="link"
              onClick={() => setShowResetForm(false)}
              className="w-full"
            >
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <Sparkles className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your CodeGen AI account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleWechatLogin}
            disabled={isWechatLoading || isLoading}
          >
            <WechatIcon />
            <span className="ml-2">
              {isWechatLoading ? "Connecting..." : "Continue with WeChat"}
            </span>
          </Button>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <button
              onClick={() => setShowResetForm(true)}
              className="text-accent hover:underline"
            >
              Forgot your password?
            </button>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-accent hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}



