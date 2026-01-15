import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/components/theme-provider'
import { LanguageProvider } from '@/lib/language-context'
import { CloudBaseInitializer } from '@/components/cloudbase-initializer'
import { BodyWithCleanup } from '@/components/body-cleanup'
import { StatusBarPadding } from '@/components/status-bar-padding'
import './globals.css'
import { MpLinkInterceptor } from '@/components/mp-link-interceptor'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'CodeGen AI - Generate Frontend UI with AI',
  description: 'Create production-ready React components instantly with AI',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'mornfront',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <BodyWithCleanup className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StatusBarPadding />
          <MpLinkInterceptor />
          <CloudBaseInitializer />
          <AuthProvider>
            <LanguageProvider>
              {children}
              <Analytics />
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </BodyWithCleanup>
    </html>
  )
}
