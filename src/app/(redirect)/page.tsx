const TARGET = '/zh-cn/'

const links = [
  { href: '/zh-cn/', label: '简体中文' },
  { href: '/zh-tw/', label: '繁體中文' },
  { href: '/en/', label: 'English' },
]

/**
 * Static entry for `/`: Next cannot redirect at request time with `output: 'export'`,
 * so this page hands off on the client while staying readable without JavaScript.
 * Query string and hash are preserved so `/?theme=dark` survives the hop.
 */
export default function RootRedirect() {
  return (
    <div style={{ textAlign: 'center', padding: '24px' }}>
      <meta httpEquiv="refresh" content={`0; url=${TARGET}`} />
      <p style={{ fontSize: 11, letterSpacing: '0.22em', opacity: 0.6 }}>COREFIX PRO</p>
      <p style={{ fontSize: 22, margin: '16px 0 24px' }}>正在跳转 / Redirecting…</p>
      <p style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12, letterSpacing: '0.14em' }}>
        {links.map((l, i) => (
          <span key={l.href}>
            {i > 0 && <span style={{ opacity: 0.4 }}> · </span>}
            <a href={l.href} style={{ color: 'inherit' }}>
              {l.label}
            </a>
          </span>
        ))}
      </p>
      <script
        dangerouslySetInnerHTML={{
          __html: `location.replace('${TARGET}' + location.search + location.hash)`,
        }}
      />
    </div>
  )
}
