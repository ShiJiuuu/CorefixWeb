/* The global 404 must stand on its own: no router context, no client bundle. */
/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 · COREFIX PRO',
  robots: { index: false, follow: true },
}

const links = [
  { href: '/zh-cn/', label: '简体中文' },
  { href: '/zh-tw/', label: '繁體中文' },
  { href: '/en/', label: 'English' },
]

/**
 * Global 404. The site has two root layouts (site / redirect), so Next needs this file
 * instead of a route-level not-found.tsx; it must therefore render the whole document.
 */
export default function GlobalNotFound() {
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
          padding: '24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 560 }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'ui-monospace, Menlo, monospace',
              fontSize: 10.5,
              letterSpacing: '0.16em',
              color: '#9c9c97',
            }}
          >
            ERROR / 404
          </p>
          <h1
            style={{
              margin: '16px 0 12px',
              fontSize: 'clamp(64px, 12vw, 120px)',
              lineHeight: 1,
              letterSpacing: '-0.04em',
              fontWeight: 600,
            }}
          >
            404
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: '#2e2e2c' }}>这个页面不存在或已被移动。</p>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6e6e6a' }}>
            This page could not be found.
          </p>

          <div style={{ marginTop: 32, borderTop: '1px solid rgba(10,10,10,0.28)', paddingTop: 20 }}>
            <a
              href="/zh-cn/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                height: 48,
                padding: '0 22px',
                background: '#0a0a0a',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              返回首页 <span style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>→</span>
            </a>
          </div>

          <p
            style={{
              marginTop: 28,
              fontFamily: 'ui-monospace, Menlo, monospace',
              fontSize: 11,
              letterSpacing: '0.14em',
              color: '#9c9c97',
            }}
          >
            {links.map((l, i) => (
              <span key={l.href}>
                {i > 0 && <span> · </span>}
                <a href={l.href} style={{ color: 'inherit' }}>
                  {l.label}
                </a>
              </span>
            ))}
          </p>
        </div>
      </body>
    </html>
  )
}
