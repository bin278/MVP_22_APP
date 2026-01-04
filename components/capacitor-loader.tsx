'use client'

import { useEffect } from 'react'

export function CapacitorLoader() {
  useEffect(() => {
    // 只在原生 APP 环境中加载
    const userAgent = navigator.userAgent
    const isCapacitorApp = userAgent.includes('CapacitorApp/com.mornfront.android.app')

    if (!isCapacitorApp) return

    // 动态加载 Capacitor 运行时
    const loadCapacitor = async () => {
      try {
        // 加载 Capacitor 核心
        await loadScript('/_next/static/capacitor.js')

        // 加载 Capacitor 插件
        await loadScript('/_next/static/capacitor-plugins.js')

        console.log('[Capacitor] Runtime loaded successfully')
      } catch (error) {
        console.error('[Capacitor] Failed to load runtime:', error)
      }
    }

    loadCapacitor()
  }, [])

  return null
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })
}
