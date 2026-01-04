"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { ExamplesSection } from "@/components/examples-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  // Initialize with "en" to ensure SSR/CSR consistency
  const [language, setLanguage] = useState<"en" | "zh">("en")
  const [isMounted, setIsMounted] = useState(false)

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

        {/* 临时测试按钮 */}
        <div className="container mx-auto px-4 py-8">
          <a
            href="/test-ua"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            测试 UserAgent
          </a>
        </div>
      </main>
      <Footer language={language} />
    </div>
  )
}
