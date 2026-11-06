import Link from 'next/link'
import type { Metadata } from 'next'
import { locales, type Locale } from '@/lib/i18n'
import { getDict } from '@/content'
import { pageMetadata } from '@/lib/seo'
import { CaseGrid } from '@/components/CaseCards'
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
        <CaseGrid
          items={d.cases.items}
          locale={locale}
          readLabel={d.cases.read}
          headingLevel="h2"
        />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <Link href={`/${locale}/network/`} className="u-link">
            {d.net.cta} <span className="text-faint">→</span>
          </Link>
          <Link href={`/${locale}/about/`} className="u-link">
            {d.nav.links[3].label} <span className="text-faint">→</span>
          </Link>
        </div>
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
