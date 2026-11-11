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
    path: '/cases/',
    description: d.page.cases.desc,
  })
}

export default async function CasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const d = getDict(locale)
  const p = d.page.cases
  /** Newest first; the stored order is editorial, the list is chronological. */
  const items = [...d.cases.items].sort((a, b) => b.dateISO.localeCompare(a.dateISO))

  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} desc={p.desc} />

      <section className="border-b border-line2">
        <dl className="u-container grid grid-cols-2 lg:grid-cols-4">
          {p.metrics.map((m, i) => (
            <div
              key={m.l}
              className={`border-line py-7 ${i > 0 ? 'lg:border-l lg:pl-8' : ''} ${
                i % 2 === 1 ? 'border-l pl-5 lg:pl-8' : ''
              } ${i < 2 ? 'border-b lg:border-b-0' : ''}`}
            >
              <dt className="u-mono text-[36px] font-semibold leading-none tracking-[-0.03em]" data-count={m.v}>
                {m.v}
              </dt>
              <dd className="mt-3 text-[11.5px] tracking-[0.05em] text-faint">{m.l}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="u-container py-14 lg:py-20">
        <div className="flex items-baseline justify-start gap-4 border-b border-line2 pb-4">
          <span className="u-mono text-[10px] tracking-[0.14em] text-faint">
            {String(items.length).padStart(2, '0')} CASES
          </span>
        </div>

        {items.map((item, i) => (
          <Link
            key={item.slug}
            href={`/${locale}/cases/${item.slug}/`}
            className="group grid gap-x-10 gap-y-3 border-b border-line py-7 transition-colors hover:bg-bg2 lg:grid-cols-[196px_1fr] lg:items-start lg:py-8"
            data-reveal={String(Math.min(i, 6) * 0.03)}
          >
            <p className="u-mono text-[14px] leading-[1.7] tracking-[0.05em] text-muted">
              {item.date}
            </p>

            <div className="min-w-0">
              <h2 className="text-[19px] font-semibold leading-[1.55] lg:text-[22px]">
                {item.title}
              </h2>
              <p className="u-mono mt-2.5 text-[10.5px] tracking-[0.08em] text-faint">
                {item.client} · {item.device} · {item.service}
              </p>
              <p className="mt-2.5 max-w-[780px] text-[13.5px] leading-[1.9] text-muted">
                {item.summary}
              </p>
            </div>
          </Link>
        ))}
      </section>

      <CtaBand
        eyebrow={d.cta.eyebrow}
        title={d.cta.title}
        sub={d.cta.sub}
        buttons={d.cta.buttons}
        locale={locale}
      />
    </>
  )
}
