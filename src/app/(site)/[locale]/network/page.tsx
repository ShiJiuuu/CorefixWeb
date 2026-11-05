import Link from 'next/link'
import type { Metadata } from 'next'
import { locales, type Locale } from '@/lib/i18n'
import { getDict } from '@/content'
import { pageMetadata } from '@/lib/seo'
import { PageHeader, CtaBand } from '@/components/Sections'
import MapPanel from '@/components/MapPanel'
import SlaTable from '@/components/SlaTable'

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
    path: '/network/',
    description: d.page.network.desc,
  })
}

export default async function NetworkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const d = getDict(locale)
  const p = d.page.network

  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} desc={p.desc} />

      <MapPanel
        sites={d.net.sites}
        hint={p.mapHint}
        legend={p.legend}
        title={p.mapTitle}
      />

      <section className="u-container py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <div className="mb-4 flex items-baseline justify-between border-b border-line2 pb-4">
              <h2 className="text-[20px] font-semibold">{p.sitesTitle}</h2>
              <span className="u-mono text-[10px] tracking-[0.14em] text-faint">09 SITES</span>
            </div>
            {d.net.sites.map((s) => (
              <div
                key={s.name}
                className={`flex items-center justify-between gap-4 border-b border-line py-3.5 ${
                  s.plan ? 'text-faint' : ''
                }`}
              >
                <span className="flex items-baseline gap-2 text-[15.5px] font-medium">
                  {s.name}
                  <em className="u-mono not-italic text-[9.5px] tracking-[0.12em] text-faint">
                    {s.tag}
                  </em>
                </span>
                <span className="flex items-center gap-5">
                  <span className="u-mono text-[11px] text-muted">{s.coverage}</span>
                  <span className="u-mono w-10 text-right text-[11px] text-muted">{s.arrival}</span>
                </span>
              </div>
            ))}
            <p className="mt-5 text-[12.5px] leading-[1.9] text-faint">{d.net.note}</p>
          </div>

          <div>
            <div className="mb-4 flex items-baseline justify-between border-b border-line2 pb-4">
              <h2 className="text-[20px] font-semibold">{p.slaTitle}</h2>
              <span className="u-mono text-[10px] tracking-[0.14em] text-faint">SLA</span>
            </div>
            <SlaTable net={d.net} />
          </div>
        </div>

        <div className="mt-12 grid gap-px border border-line2 bg-line sm:grid-cols-3">
          {d.stats.slice(0, 3).map((s) => (
            <div key={s.l} className="bg-bg px-6 py-7">
              <p className="u-mono text-[30px] font-semibold leading-none tracking-tight" data-count={s.v}>
                {s.v}
              </p>
              <p className="mt-3 text-[11px] tracking-[0.05em] text-faint">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <Link href={`/${locale}/capability/`} className="u-link">
            {d.cap.more} <span className="text-faint">→</span>
          </Link>
          <Link href={`/${locale}/cases/`} className="u-link">
            {d.cases.all} <span className="text-faint">→</span>
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
