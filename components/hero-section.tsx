"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface HeroSectionProps {
  language: "en" | "zh"
}

const translations = {
  en: {
    badge: "AI-Powered Code Generation",
    title: "Build apps from a single sentence",
    subtitle:
      "Describe your UI idea in plain language, and watch as AI generates production-ready frontend code instantly. Perfect for React and Next.js components.",
    placeholder: 'Describe your app idea... e.g., "Create a todo list with dark mode"',
    generate: "Generate App",
    generating: "Generating...",
    viewExample: "View Example",
    examples: [
      "Create a modern todo list with dark mode and categories",
      "Build a weather dashboard with city search and 5-day forecast",
      "Design a landing page for a SaaS product with pricing tiers",
      "Make a responsive e-commerce product card with add to cart",
      "Create a user profile page with avatar upload and settings",
      "Build a chat interface with message bubbles and typing indicator"
    ],
  },
  zh: {
    badge: "AI 驱动的代码生成",
    title: "一句话生成完整应用",
    subtitle: "用自然语言描述你的界面想法，AI 将立即生成可用于生产环境的前端代码。完美支持 React 和 Next.js 组件。",
    placeholder: '描述你的应用想法... 例如："创建一个带深色模式的待办事项列表"',
    generate: "生成应用",
    generating: "生成中...",
    viewExample: "查看示例",
    examples: [
      "创建一个带深色模式和分类的现代待办事项列表",
      "构建一个带城市搜索和 5 天预报的天气仪表板",
      "为 SaaS 产品设计一个带定价层级的落地页",
      "制作一个响应式的电商产品卡片带添加到购物车功能",
      "创建一个带头像上传和设置的用户资料页面",
      "构建一个带消息气泡和打字指示器的聊天界面"
    ],
  },
}

export function HeroSection({ language }: HeroSectionProps) {
  const t = translations[language]
  const [prompt, setPrompt] = useState("")
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0)
  const router = useRouter()

  const handleGenerate = () => {
    // 允许空输入直接进入生成页面
    const trimmedPrompt = prompt.trim()
    console.log('[HeroSection] Navigating to generate page', trimmedPrompt ? `with prompt: ${trimmedPrompt}` : 'with empty prompt')

    // Save the prompt to localStorage before navigating (even if empty)
    if (trimmedPrompt) {
      localStorage.setItem('prefillPrompt', trimmedPrompt)
    } else {
      localStorage.removeItem('prefillPrompt') // Clear any existing prompt
    }
    router.push("/generate")
  }

  const handleViewExample = () => {
    const example = t.examples[currentExampleIndex]
    setPrompt(example)
    setCurrentExampleIndex((prev) => (prev + 1) % t.examples.length)
  }

  return (
    <section className="relative overflow-hidden border-b border-border/40">
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

      <div className="container relative py-12 sm:py-16 md:py-24 lg:py-32 px-4 sm:px-6 max-w-[95%] xl:max-w-[1400px] mx-auto">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 sm:px-4 py-1.5 text-xs sm:text-sm">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            <span className="text-muted-foreground">{t.badge}</span>
          </div>

          <h1 className="mb-4 sm:mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
            <span className="gradient-text text-balance">{t.title}</span>
          </h1>

          <p className="mb-8 sm:mb-12 text-base sm:text-lg md:text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed px-2">
            {t.subtitle}
          </p>

          <div className="mx-auto max-w-3xl px-2">
            <div className="relative rounded-xl border border-border bg-card p-2 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-accent/5 opacity-50" />
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.placeholder}
                className="min-h-[100px] sm:min-h-[120px] resize-none border-0 bg-transparent text-sm sm:text-base focus-visible:ring-0 focus-visible:ring-offset-0 relative z-10 placeholder:text-muted-foreground/70"
              />
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 relative z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors text-sm justify-start sm:justify-center"
                  onClick={handleViewExample}
                >
                  {language === "en" ? "Example" : "示例"}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform hover:translate-x-1" />
                </Button>
                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                  <div className="flex gap-1">
                    {t.examples.slice(0, 3).map((_, index) => (
                      <div
                        key={index}
                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                          index === currentExampleIndex
                            ? 'bg-accent'
                            : 'bg-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                  <Button
                    onClick={handleGenerate}
                    size="sm"
                    className="bg-accent hover:bg-accent/90 hover:shadow-lg transition-all duration-200 text-sm sm:base"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                    {t.generate}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 inline-flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-3 sm:px-4 py-2 text-xs sm:text-sm text-accent">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">
              {language === "en"
                ? "Frontend UI Generation - React, Next.js"
                : "前端界面生成 - React、Next.js"}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
