"use client"

import { Code2, Zap, Globe, Sparkles, Layout, Palette } from "lucide-react"
import { Card } from "@/components/ui/card"

interface FeaturesSectionProps {
  language: "en" | "zh"
}

const translations = {
  en: {
    title: "Everything you need to build faster",
    subtitle: "Powerful features that help you go from idea to production in minutes",
    features: [
      {
        icon: Sparkles,
        title: "AI-Powered Generation",
        description: "Advanced AI models understand your requirements and generate clean, production-ready code.",
      },
      {
        icon: Code2,
        title: "Frontend UI Code",
        description: "Generate beautiful React and Next.js components with Tailwind CSS styling.",
      },
      {
        icon: Zap,
        title: "Instant Preview",
        description: "See your app come to life in real-time with instant preview and hot reload.",
      },
      {
        icon: Globe,
        title: "Multi-Language",
        description: "Describe your app in English or Chinese - we understand both perfectly.",
      },
      {
        icon: Layout,
        title: "Modern Frameworks",
        description: "Built with Next.js, React, and the latest web technologies.",
      },
      {
        icon: Palette,
        title: "Beautiful Design",
        description: "Every generated app comes with a polished, responsive design out of the box.",
      },
    ],
  },
  zh: {
    title: "构建更快所需的一切",
    subtitle: "强大的功能帮助您在几分钟内从想法到生产",
    features: [
      {
        icon: Sparkles,
        title: "AI 驱动生成",
        description: "先进的 AI 模型理解您的需求并生成干净、可用于生产的代码。",
      },
      {
        icon: Code2,
        title: "前端界面代码",
        description: "生成精美的 React 和 Next.js 组件，配有 Tailwind CSS 样式。",
      },
      {
        icon: Zap,
        title: "即时预览",
        description: "通过即时预览和热重载实时查看您的应用程序。",
      },
      {
        icon: Globe,
        title: "多语言支持",
        description: "用英语或中文描述您的应用 - 我们都能完美理解。",
      },
      {
        icon: Layout,
        title: "现代框架",
        description: "使用 Next.js、React 和最新的 Web 技术构建。",
      },
      {
        icon: Palette,
        title: "精美设计",
        description: "每个生成的应用都配有开箱即用的精美响应式设计。",
      },
    ],
  },
}

export function FeaturesSection({ language }: FeaturesSectionProps) {
  const t = translations[language]

  return (
    <section id="features" className="py-24 md:py-32">
      <div className="container max-w-[95%] xl:max-w-[1400px] mx-auto">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-balance">{t.title}</h2>
          <p className="text-lg text-muted-foreground text-balance">{t.subtitle}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {t.features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border-border bg-card p-6 transition-all hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 transition-colors group-hover:bg-accent/20">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
