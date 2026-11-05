import Link from 'next/link'
import type { Metadata } from 'next'
import { locales, type Locale } from '@/lib/i18n'
import { getDict } from '@/content'
import { pageMetadata } from '@/lib/seo'
import { PageHeader, CtaBand } from '@/components/Sections'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const d = getDict(locale)
  return pageMetadata({
    locale: locale as Locale,
    path: '/capability/',
    description: d.page.capability.desc,
  })
}

export default async function CapabilityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const d = getDict(locale)
  const p = d.page.capability

  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} desc={p.desc} />

      <section className="u-container">
        <div className="border-b border-line py-5">
          <span className="u-label">{p.detail}</span>
        </div>

        {d.cap.items.map((c, i) => (
          <article
            key={c.no}
            className="grid gap-6 border-b border-line py-10 lg:grid-cols-[70px_300px_1fr] lg:gap-8 lg:py-12"
            data-reveal={String(i * 0.03)}
          >
            <span className="u-mono text-[11px] tracking-[0.1em] text-faint">{c.no}</span>

            <div>
              <h2 className="text-[26px] font-semibold leading-tight">{c.title}</h2>
              <p className="u-mono mt-2 text-[9.5px] tracking-[0.16em] text-faint">{c.en}</p>
              <div className="mt-6 flex items-baseline gap-2 border-t border-line pt-4 lg:mt-8">
                <span className="u-mono text-[26px] font-semibold leading-none tracking-tight">
                  {c.metric}
                </span>
                <span className="text-[10.5px] leading-tight text-faint">{c.metricLabel}</span>
              </div>
            </div>

            <div>
              <p className="text-[15px] leading-[1.95] text-muted">{c.desc}</p>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {c.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-[13.5px] text-ink2">
                    <span className="mt-[9px] h-[3px] w-[10px] shrink-0 bg-ink" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>

          </article>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-4 py-8">
          <Link href={`/${locale}/network/`} className="u-link">
            {d.net.cta} <span className="text-faint">→</span>
          </Link>
          <Link href={`/${locale}/cases/`} className="u-link">
            {d.cases.all} <span className="text-faint">→</span>
          </Link>
        </div>
      </section>

      <CtaBand
        eyebrow={`06 / ${d.cta.eyebrow}`}
        title={d.cta.title}
        sub={d.cta.sub}
        buttons={d.cta.buttons}
        locale={locale}
      />
    </>
  )
}
