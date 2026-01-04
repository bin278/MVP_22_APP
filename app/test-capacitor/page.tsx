'use client'

import { useEffect, useState } from 'react'

export default function TestCapacitorPage() {
  const [info, setInfo] = useState<any>({})

  useEffect(() => {
    const win = window as any
    const capacitorInfo = {
      hasCapacitor: typeof win.Capacitor !== 'undefined',
      isNative: typeof win.Capacitor !== 'undefined' ? win.Capacitor.isNativePlatform() : false,
      platform: typeof win.Capacitor !== 'undefined' ? win.Capacitor.getPlatform() : 'unknown',
      getPlugin: typeof win.Capacitor !== 'undefined' ? typeof win.Capacitor.getPlugin : 'undefined',
      fullCapacitor: typeof win.Capacitor !== 'undefined' ? JSON.stringify(win.Capacitor, Object.keys(win.Capacitor).sort()) : 'undefined'
    }

    setInfo(capacitorInfo)
    console.log('[Capacitor Test]', capacitorInfo)
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Capacitor Detection Test</h1>
      <pre>{JSON.stringify(info, null, 2)}</pre>

      <div style={{ marginTop: '20px' }}>
        <h2>Window Properties:</h2>
        <ul>
          <li>window.Capacitor: {typeof (window as any).Capacitor}</li>
          <li>typeof Capacitor: {typeof (window as any).Capacitor}</li>
        </ul>
      </div>
    </div>
  )
}
