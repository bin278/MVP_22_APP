'use client'

import { useEffect, useState } from 'react'

export default function DebugUserAgentPage() {
  const [info, setInfo] = useState<any>({})

  useEffect(() => {
    const userAgent = navigator.userAgent
    const win = window as any

    const debugInfo = {
      userAgent,
      isFromCapacitorApp: userAgent.includes('CapacitorApp/com.mornfront.app'),
      hasCapacitor: typeof win.Capacitor !== 'undefined',
      isNative: typeof win.Capacitor !== 'undefined' ? win.Capacitor.isNativePlatform() : false,
      url: window.location.href,
    }

    setInfo(debugInfo)
    console.log('[Debug UserAgent]', debugInfo)
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '14px' }}>
      <h1>Debug UserAgent</h1>
      <pre>{JSON.stringify(info, null, 2)}</pre>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <strong>请在 APP 中访问此页面查看 UserAgent 是否包含 CapacitorApp/com.mornfront.app</strong>
      </div>
    </div>
  )
}
