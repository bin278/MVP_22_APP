"use client"

import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LanguageToggleProps {
  language: 'zh' | 'en'
  setLanguage: (lang: 'zh' | 'en') => void
}

export function LanguageToggle({ language, setLanguage }: LanguageToggleProps) {
  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh')
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="font-mono"
    >
      <Languages className="h-4 w-4 mr-2" />
      {language === 'zh' ? 'EN' : '中文'}
    </Button>
  )
}
