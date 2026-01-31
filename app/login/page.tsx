"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { LanguageToggle } from "@/components/language-toggle"
import { isMiniProgram, parseWxMpLoginCallback, clearWxMpLoginParams, requestWxMpLogin } from "@/lib/wechat-mp"

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

// 翻译字典
const translations = {
  zh: {
    title: '欢迎回来',
    description: '登录到您的 CodeGen AI 账户',
    email: '邮箱',
    emailPlaceholder: '输入您的邮箱',
    password: '密码',
    passwordPlaceholder: '输入您的密码',
    signIn: '登录',
    signingIn: '登录中...',
    forgotPassword: '忘记密码?',
    noAccount: '还没有账户?',
    signUp: '立即注册',
    orContinueWith: '或通过以下方式继续',
    continueWithWeChat: '使用微信登录',
    continueWithGoogle: '使用 Google 登录',
    connecting: '连接中...',
    agreeTerms: '我同意',
    termsOfService: '服务条款',
    privacyPolicy: '隐私政策',
    and: '和',
    mustAcceptTerms: '请先同意服务条款和隐私政策',
    resetPassword: '重置密码',
    resetPasswordDescription: '输入您的邮箱地址,我们将向您发送重置密码的链接',
    backToLogin: '返回登录',
    sending: '发送中...',
    sendResetLink: '发送重置链接',
    resetEmailSent: '密码重置邮件已发送!请检查您的收件箱',
    error: '错误',
    // 错误消息
    qrcodeError: '获取微信登录二维码失败',
    unknownError: '未知错误',
    noQrcode: '未获取到微信登录二维码',
    wechatError: '微信登录过程中发生错误',
    googleOnlyIntl: 'Google登录仅在 国际版中可用',
    googleError: 'Google登录过程中发生错误',
    generalError: '发生错误,请稍后重试',
  },
  en: {
    title: 'Welcome Back',
    description: 'Sign in to your CodeGen AI account',
    email: 'Email',
    emailPlaceholder: 'Enter your email',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    signUp: 'Sign up',
    orContinueWith: 'Or continue with',
    continueWithWeChat: 'Continue with WeChat',
    continueWithGoogle: 'Continue with Google',
    connecting: 'Connecting...',
    agreeTerms: 'I agree to the',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    and: 'and',
    mustAcceptTerms: 'Please accept the Terms of Service and Privacy Policy',
    resetPassword: 'Reset Password',
    resetPasswordDescription: 'Enter your email address and we\'ll send you a link to reset your password',
    backToLogin: 'Back to Login',
    sending: 'Sending...',
    sendResetLink: 'Send Reset Link',
    resetEmailSent: 'Password reset email sent! Check your inbox',
    error: 'Error',
    // Error messages
    qrcodeError: 'Failed to get WeChat login QR code',
    unknownError: 'Unknown error',
    noQrcode: 'Failed to get WeChat login QR code',
    wechatError: 'An error occurred during WeChat login',
    googleOnlyIntl: 'Google login is only available in international version',
    googleError: 'An error occurred during Google login',
    generalError: 'An error occurred, please try again later',
  },
}

export default function LoginPage() {
  // Initialize with "zh" to ensure SSR/CSR consistency
  const [language, setLanguage] = useState<"zh" | "en">("zh")
  const [isMounted, setIsMounted] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isWechatLoading, setIsWechatLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetMessage, setResetMessage] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isInMiniProgram, setIsInMiniProgram] = useState(false)

  const { signIn, signInWithWechat, signInWithGoogle, resetPassword } = useAuth()
  const router = useRouter()

  // 检测当前版本
  const isInternational = process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase'

  // Load language preference from localStorage after mount
  useEffect(() => {
    setIsMounted(true)
    setIsInMiniProgram(isMiniProgram())
    if (typeof window !== 'undefined') {
      try {
        const savedLanguage = localStorage.getItem('language') as "zh" | "en" | null
        if (savedLanguage === "zh" || savedLanguage === "en") {
          setLanguage(savedLanguage)
        }
      } catch (error) {
        console.error('Error reading language from localStorage:', error)
      }
    }
  }, [])

  // Handle miniprogram login callback
  const handleMpLoginCallback = useCallback(async () => {
    const callback = parseWxMpLoginCallback()
    if (!callback || !callback.token || !callback.openid) return

    try {
      const res = await fetch("/api/auth/mp-callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: callback.token,
          openid: callback.openid,
          expiresIn: callback.expiresIn,
          nickName: callback.nickName,
          avatarUrl: callback.avatarUrl,
        }),
      })

      if (res.ok) {
        clearWxMpLoginParams()
        window.location.reload()
      }
    } catch (error) {
      console.error("MP login callback error:", error)
      clearWxMpLoginParams()
    }
  }, [])

  useEffect(() => {
    handleMpLoginCallback()
  }, [handleMpLoginCallback])

  const handleLanguageChange = (newLanguage: "zh" | "en") => {
    setLanguage(newLanguage)
    // Save language preference to localStorage when user changes it
    if (isMounted && typeof window !== 'undefined') {
      try {
        localStorage.setItem('language', newLanguage)
      } catch (error) {
        console.error('Error saving language to localStorage:', error)
      }
    }
  }

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.zh] || key
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 检查是否同意条款
    if (!acceptTerms) {
      setError(t('mustAcceptTerms'))
      return
    }

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
      setError(t('error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleWechatLogin = async () => {
    console.log('[WeChat Login] Button clicked, acceptTerms:', acceptTerms, 'isInMiniProgram:', isInMiniProgram)

    // 检查是否同意条款
    if (!acceptTerms) {
      console.warn('[WeChat Login] Terms not accepted')
      setError(t('mustAcceptTerms'))
      // 滚动到错误提示位置
      setTimeout(() => {
        const errorElement = document.querySelector('[role="alert"]')
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      return
    }

    setIsWechatLoading(true)
    setError("")

    try {
      // 如果在小程序环境，使用小程序原生登录
      if (isInMiniProgram) {
        console.log('[WeChat Login] Using mini program login')
        const result = await requestWxMpLogin()
        console.log('[WeChat Login] Mini program login result:', result)

        if (!result) {
          setError('小程序登录失败，请确保在微信小程序环境中打开')
          setIsWechatLoading(false)
          return
        }

        // 小程序登录请求已发送，等待回调
        // 设置超时，如果10秒内没有响应则重置状态
        console.log('[WeChat Login] Waiting for mini program callback...')
        setTimeout(() => {
          setIsWechatLoading(false)
          console.log('[WeChat Login] Timeout - reset loading state')
        }, 10000)
        return
      }

      // 否则使用二维码登录
      console.log('[WeChat Login] Using QR code login')
      const endpoint = '/api/auth/wechat/qrcode'
      const nextPath = '/'
      const response = await fetch(`${endpoint}?next=${encodeURIComponent(nextPath)}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`${t('qrcodeError')}: ${errorData.error || t('unknownError')}`)
      }

      const data = await response.json()
      const authUrl = data.qrcodeUrl

      if (!authUrl) {
        throw new Error(t('noQrcode'))
      }

      window.location.href = authUrl

    } catch (err: any) {
      console.error('[WeChat Login] Error:', err)
      setError(err.message || t('wechatError'))
      setIsWechatLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    // 检查是否同意条款
    if (!acceptTerms) {
      setError(t('mustAcceptTerms'))
      return
    }

    setIsGoogleLoading(true)
    setError("")

    try {
      if (!signInWithGoogle) {
        throw new Error(t('googleOnlyIntl'))
      }

      const { error } = await signInWithGoogle()
      if (error) {
        setError(error.message)
        setIsGoogleLoading(false)
      }
      // Supabase会自动处理重定向,不需要手动设置loading
    } catch (err: any) {
      console.error('[Google Login] Error:', err)
      setError(err.message || t('googleError'))
      setIsGoogleLoading(false)
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
        setResetMessage(t('resetEmailSent'))
      }
    } catch (err: any) {
      setResetMessage(t('error'))
    } finally {
      setIsLoading(false)
    }
  }

  if (showResetForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <div className="absolute top-4 right-4">
          <LanguageToggle />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <Sparkles className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">{t('resetPassword')}</CardTitle>
            <CardDescription>
              {t('resetPasswordDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">{t('email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder={t('emailPlaceholder')}
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
                {isLoading ? t('sending') : t('sendResetLink')}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-center">
            <Button
              variant="link"
              onClick={() => setShowResetForm(false)}
              className="w-full"
            >
              {t('backToLogin')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageToggle language={language} setLanguage={handleLanguageChange} />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <Sparkles className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('passwordPlaceholder')}
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
              <Alert variant="destructive" role="alert">
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="login-terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              />
              <label htmlFor="login-terms" className="text-sm text-muted-foreground">
                {t('agreeTerms')}{" "}
                <Link href="/privacy#terms" className="text-accent hover:underline">
                  {t('termsOfService')}
                </Link>
                {" "}{t('and')}{" "}
                <Link href="/privacy#privacy" className="text-accent hover:underline">
                  {t('privacyPolicy')}
                </Link>
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('signingIn') : t('signIn')}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t('orContinueWith')}</span>
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
                {isWechatLoading ? t('connecting') : t('continueWithWeChat')}
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
                {isGoogleLoading ? t('connecting') : t('continueWithGoogle')}
              </span>
            </Button>
          )}

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
              {t('forgotPassword')}
            </button>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            {t('noAccount')}{" "}
            <Link href="/register" className="text-accent hover:underline">
              {t('signUp')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}



