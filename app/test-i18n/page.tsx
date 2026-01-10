"use client"

import { useLanguage } from '@/lib/language-context'

export default function TestI18nPage() {
  const { t, language } = useLanguage()

  return (
    <div className="min-h-screen p-8">
      <h1>i18n 测试页面</h1>
      <p>当前语言: {language}</p>

      <div className="space-y-4 mt-8">
        <div className="p-4 border rounded">
          <h2>翻译测试</h2>
          <p>login.title: {t('login.title')}</p>
          <p>login.email: {t('login.email')}</p>
          <p>login.password: {t('login.password')}</p>
          <p>login.signIn: {t('login.signIn')}</p>
        </div>

        <div className="p-4 border rounded">
          <h2>原始翻译对象测试</h2>
          <pre>{JSON.stringify({ language, t_result: t('login.title') }, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}
