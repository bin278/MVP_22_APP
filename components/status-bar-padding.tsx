'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

/**
 * Android 状态栏适配组件
 * 为 Android APP 添加顶部 padding，避免内容被状态栏遮挡
 */
export function StatusBarPadding() {
  useEffect(() => {
    // 检测平台
    const platform = Capacitor.getPlatform()
    const isNative = Capacitor.isNativePlatform()

    console.log('[StatusBarPadding] Platform:', platform, 'IsNative:', isNative)

    // 只在 Android APP 中应用
    if (!isNative || platform !== 'android') {
      console.log('[StatusBarPadding] Skipped: not Android native')
      return
    }

    // 只为 body 添加状态栏高度的 padding
    // header 会通过 CSS 自己处理安全区域
    const statusBarHeight = 0 // 不再添加 padding，让 header 自己处理

    console.log('[StatusBarPadding] No padding added (handled by header)')
  }, [])

  return null // 这个组件不渲染任何内容
}
