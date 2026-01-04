'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

/**
 * Android 状态栏适配 Hook
 * 为 Android APP 添加顶部 padding，避免内容被状态栏遮挡
 */
export function useStatusBarPadding() {
  useEffect(() => {
    // 只在 Android APP 中应用
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return
    }

    // 为 body 添加状态栏高度的 padding
    const addStatusBarPadding = () => {
      // 获取状态栏高度（通常约 24-30dp，转换为像素）
      const statusBarHeight = window.innerWidth < 600 ? 30 : 0 // 只在移动端添加

      if (statusBarHeight > 0) {
        document.body.style.paddingTop = `${statusBarHeight}px`

        // 为固定定位的元素也添加 padding
        const fixedElements = document.querySelectorAll('[data-fixed]')
        fixedElements.forEach((el) => {
          (el as HTMLElement).style.paddingTop = `${statusBarHeight}px`
        })
      }
    }

    // 初始添加
    addStatusBarPadding()

    // 窗口大小改变时重新计算
    window.addEventListener('resize', addStatusBarPadding)

    return () => {
      window.removeEventListener('resize', addStatusBarPadding)
    }
  }, [])
}
