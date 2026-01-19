"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { ExamplesSection } from "@/components/examples-section"
import { Footer } from "@/components/footer"
import { parseWxMpLoginCallback, clearWxMpLoginParams } from "@/lib/wechat-mp"

export default function HomePage() {
  // Initialize with "en" to ensure SSR/CSR consistency
  const [language, setLanguage] = useState<"en" | "zh">("en")
  const [isMounted, setIsMounted] = useState(false)

  // Handle miniprogram login callback
  const handleMpLoginCallback = useCallback(async () => {
    console.log('[HomePage] Checking for MP login callback...')
    const callback = parseWxMpLoginCallback()
    console.log('[HomePage] Parsed callback:', callback)

    if (!callback || !callback.token || !callback.openid) {
      console.log('[HomePage] No valid callback data, skipping')
      return
    }

    console.log('[HomePage] Valid callback found, calling mp-callback API...')
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

      console.log('[HomePage] mp-callback API response status:', res.status)
      const data = await res.json()
      console.log('[HomePage] mp-callback API response data:', data)

      if (res.ok) {
        console.log('[HomePage] Login successful, saving auth state...')

        // 保存认证状态到 localStorage，让 AuthProvider 能识别
        if (data.user) {
          const authState = {
            accessToken: callback.token,
            refreshToken: callback.token,
            user: data.user,
            tokenMeta: {
              accessTokenExpiresIn: parseInt(callback.expiresIn || '604800'),
              refreshTokenExpiresIn: parseInt(callback.expiresIn || '604800')
            },
            savedAt: Date.now()
          }

          localStorage.setItem('app-auth-state', JSON.stringify(authState))

          // 触发 auth-state-changed 事件
          window.dispatchEvent(new Event('auth-state-changed'))
        }

        clearWxMpLoginParams()

        // 延迟刷新，让 AuthProvider 有时间更新状态
        setTimeout(() => {
          window.location.reload()
        }, 100)
      } else {
        console.error('[HomePage] mp-callback API failed:', data)
      }
    } catch (error) {
      console.error("[HomePage] MP login callback error:", error)
      clearWxMpLoginParams()
    }
  }, [])

  useEffect(() => {
    handleMpLoginCallback()
  }, [handleMpLoginCallback])

  // Load language preference from localStorage after mount
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== 'undefined') {
      try {
        const savedLanguage = localStorage.getItem('language') as "en" | "zh" | null
        if (savedLanguage === "en" || savedLanguage === "zh") {
          setLanguage(savedLanguage)
        }
      } catch (error) {
        console.error('Error reading language from localStorage:', error)
      }
    }
  }, [])

  const handleLanguageChange = (newLanguage: "en" | "zh") => {
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

  return (
    <div className="min-h-screen bg-background">
      <Header language={language} setLanguage={handleLanguageChange} />
      <main>
        <HeroSection language={language} />
        <FeaturesSection language={language} />
        <ExamplesSection language={language} />
      </main>
      <Footer language={language} />
    </div>
  )
}
