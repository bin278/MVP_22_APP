"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Sparkles, Mail, Lock, User, Eye, EyeOff, CheckCircle, Shield } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Separator } from "@/components/ui/separator"

// 微信登录图标组件
const WechatIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348z"/>
  </svg>
)

// Google登录图标组件
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isWechatLoading, setIsWechatLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const { signUp, signInWithWechat, signInWithGoogle } = useAuth()
  const router = useRouter()

  // 检测当前版本
  const isInternational = process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase'

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  // 邮箱验证函数
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.fullName) {
      setError("请填写所有字段")
      return false
    }

    if (formData.password.length < 6) {
      setError("密码长度至少6位")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("两次密码输入不一致")
      return false
    }

    if (!acceptTerms) {
      setError("请同意服务条款和隐私政策")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError("")

    try {
      console.log('开始注册，邮箱:', formData.email)

      // 调用直接注册API
      const result = await signUp(formData.email, formData.password, {
        full_name: formData.fullName
      })

      if (result.success) {
        console.log('注册成功:', result.user)
        setSuccess(true)
      } else {
        console.error('注册失败:', result.error)
        setError(result.error)
      }

    } catch (err: any) {
      console.error('注册异常:', err)
      setError("注册失败，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleWechatLogin = async () => {
    setIsWechatLoading(true)
    setError("")

    try {
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

    } catch (err: any) {
      console.error('[WeChat Login] Error:', err)
      setError(err.message || "微信登录过程中发生错误")
      setIsWechatLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError("")

    try {
      if (!signInWithGoogle) {
        throw new Error('Google登录仅在国际版中可用')
      }

      const { error } = await signInWithGoogle()
      if (error) {
        setError(error.message)
        setIsGoogleLoading(false)
      }
      // Supabase会自动处理重定向
    } catch (err: any) {
      console.error('[Google Login] Error:', err)
      setError(err.message || "Google登录过程中发生错误")
      setIsGoogleLoading(false)
    }
  }

  // 成功页面
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-700">注册成功！</CardTitle>
            <CardDescription className="text-base">
              欢迎加入！您的账户已成功注册。
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                您现在可以使用您的邮箱和密码登录系统。
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/login")} className="w-full">
              前往登录
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // 基本信息填写步骤
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <Sparkles className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">创建账户</CardTitle>
          <CardDescription>
            加入CodeGen AI，开始构建精彩的UI界面
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
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
                  placeholder="请输入密码（至少6位）"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="请再次输入密码"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                我同意{" "}
                <Link href="/terms" className="text-accent hover:underline">
                  服务条款
                </Link>{" "}
                和{" "}
                <Link href="/privacy" className="text-accent hover:underline">
                  隐私政策
                </Link>
              </label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "注册中..." : "注册账户"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
            </div>
          </div>

          {/* 国内版显示微信登录 */}
          {!isInternational && (
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
          )}

          {/* 国际版显示Google登录 */}
          {isInternational && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
            >
              <GoogleIcon />
              <span className="ml-2">
                {isGoogleLoading ? "Connecting..." : "Continue with Google"}
              </span>
            </Button>
          )}
        </CardContent>
        <CardFooter className="text-center">
          <div className="text-sm text-muted-foreground">
            已有账户？{" "}
            <Link href="/login" className="text-accent hover:underline">
              立即登录
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}



