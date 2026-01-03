"use client"

import { Sparkles } from "lucide-react"

interface FooterProps {
  language: "en" | "zh"
}

const translations = {
  en: {
    tagline: "Build apps from a single sentence",
    product: "Product",
    docs: "Documentation",
    examples: "Examples",
    pricing: "Pricing",
    company: "Company",
    about: "About",
    blog: "Blog",
    careers: "Careers",
    legal: "Legal",
    privacy: "Privacy",
    terms: "Terms",
    rights: "All rights reserved.",
  },
  zh: {
    tagline: "一句话生成完整应用",
    product: "产品",
    docs: "文档",
    examples: "示例",
    pricing: "价格",
    company: "公司",
    about: "关于",
    blog: "博客",
    careers: "招聘",
    legal: "法律",
    privacy: "隐私",
    terms: "条款",
    rights: "保留所有权利。",
  },
}

export function Footer({ language }: FooterProps) {
  const t = translations[language]

  return (
    <footer className="border-t border-border bg-card">
      <div className="container max-w-[95%] xl:max-w-[1400px] mx-auto py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <Sparkles className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold">CodeGen AI</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{t.tagline}</p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">{t.product}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.docs}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.examples}
                </a>
              </li>
              <li>
                <a href="/payment" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.pricing}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">{t.company}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.about}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.blog}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.careers}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">{t.legal}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.privacy}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.terms}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} CodeGen AI. {t.rights}
        </div>
      </div>
    </footer>
  )
}
