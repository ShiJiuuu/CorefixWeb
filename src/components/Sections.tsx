import type { Dict } from '@/content/types'

export function SectionHead({
  eyebrow,
  title,
  children,
  more,
}: {
  eyebrow: string
  title: React.ReactNode
  children?: React.ReactNode
  more?: React.ReactNode
}) {
  return (
    <div className="mb-10 border-b border-line2 pb-6 lg:mb-13">
      <div className="max-w-[720px]" data-reveal>
        <p className="u-label">{eyebrow}</p>
        <h2 className="mt-4 text-[50px] font-semibold">{title}</h2>
        {children}
      </div>
      {more}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  desc,
  aside,
}: {
  eyebrow: string
  title: string
  desc?: string
  aside?: React.ReactNode
}) {
  return (
    <div className="border-b border-line2">
      <div className="u-container">
        <div className="flex flex-col justify-between gap-8 pb-9 pt-12 lg:pt-14 xl:flex-row xl:items-end xl:gap-16">
          <div className="max-w-[820px]">
            <p className="u-label">{eyebrow}</p>
            <h1 className="mt-4 text-[64px] font-semibold">{title}</h1>
          </div>
          {desc ? (
            <p className="max-w-[420px] text-[15.5px] leading-[1.95] text-muted lg:pb-2">{desc}</p>
          ) : (
            aside
          )}
        </div>
      </div>
    </div>
  )
}

/** Internal paths get the locale prefix; `tel:` / `mailto:` / `https:` are used as-is. */
function resolveHref(href: string, locale: string) {
  return /^(tel:|mailto:|https?:)/.test(href) ? href : `/${locale}${href}`
}

export function CtaBand({
  eyebrow,
  title,
  sub,
  buttons,
  locale,
}: {
  eyebrow: string
  title: string[]
  sub: string
  buttons: Dict['cta']['buttons']
  locale: string
}) {
  return (
    <section id="contact" className="border-t border-line2">
      <div className="u-container flex flex-col gap-10 py-20 lg:flex-row lg:items-end lg:gap-16 lg:py-24">
        <div className="min-w-0 lg:flex-[1.25]" data-reveal>
          <p className="u-label">{eyebrow}</p>
          <h2 className="mt-5 text-[64px] font-semibold leading-[1.12]">
            {title[0]}
            <br />
            <span className="text-muted">{title[1]}</span>
          </h2>
          <p className="mt-6 max-w-[520px] text-[16px] leading-relaxed text-muted">{sub}</p>
        </div>
        <div className="flex min-w-0 flex-col gap-3 lg:flex-[0.75]" data-reveal="0.1">
          {buttons.map((b, i) => (
            <a
              key={`${b.label}-${i}`}
              href={resolveHref(b.href, locale)}
              className={`u-btn w-full ${i === 0 ? 'u-btn-solid' : 'u-btn-line'}`}
            >
              {b.label}
              <span className="u-mono text-[13px]">{b.href.startsWith('tel:') ? '☏' : '→'}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
