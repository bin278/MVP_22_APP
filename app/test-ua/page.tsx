'use client'

import { useEffect, useState } from 'react'

export default function TestUAPage() {
  const [info, setInfo] = useState<any>({})

  useEffect(() => {
    const fullUA = navigator.userAgent
    const info = {
      userAgent: fullUA,
      hasCapacitorAppUA: fullUA.includes('CapacitorApp/com.mornfront.android.app'),
      hasOldUA: fullUA.includes('CapacitorApp/com.mornfront.app'),
      hasCapacitor: typeof (window as any).Capacitor !== 'undefined',
      url: window.location.href,
    }
    setInfo(info)
    console.log('[UA Test]', info)
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>UserAgent Test</h1>
      <pre>{JSON.stringify(info, null, 2)}</pre>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: info.hasCapacitorAppUA ? '#d4edda' : '#f8d7da' }}>
        {info.hasCapacitorAppUA ? '✅ 检测到原生 APP UserAgent' : '❌ 未检测到原生 APP UserAgent'}
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e2e3e5' }}>
        <strong>完整 UserAgent:</strong>
        <p style={{ fontSize: '12px', wordBreak: 'break-all' }}>{info.userAgent}</p>
      </div>
    </div>
  )
}
