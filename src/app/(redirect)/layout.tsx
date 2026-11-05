import type { Metadata, Viewport } from 'next'
import { SITE_TITLE } from '@/lib/seo'

export const metadata: Metadata = {
  title: SITE_TITLE,
  robots: { index: false, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

/**
 * Second root layout (route group without a shared parent): the bare `/` entry only
 * needs to hand the visitor off, so it stays dependency-free and paints instantly.
 */
export default function RedirectLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#ffffff',
          color: '#0a0a0a',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  )
}
