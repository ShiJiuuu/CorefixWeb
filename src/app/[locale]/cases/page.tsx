import Link from 'next/link'
import type { Metadata } from 'next'
import { locales } from '@/lib/i18n'
import { getDict } from '@/content'
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
  return {
    title: `${d.page.cases.title} · ${d.meta.title.split(' · ')[0]}`,
    description: d.page.cases.desc,
    alternates: { canonical: `/${locale}/cases/` },
  }
}

export default async function CasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const d = getDict(locale)
  const p = d.page.cases

  return (
    <>
      <PageHeader crumb={d.nav.links[2].label} eyebrow={p.eyebrow} title={p.title} desc={p.desc} />

      <section className="border-b border-line2">
        <dl className="u-container grid grid-cols-2 lg:grid-cols-4">
          {p.metrics.map((m, i) => (
            <div
              key={m.l}
              className={`border-line py-7 ${i > 0 ? 'lg:border-l lg:pl-8' : ''} ${
                i % 2 === 1 ? 'border-l pl-5 lg:pl-8' : ''
              } ${i < 2 ? 'border-b lg:border-b-0' : ''}`}
            >
              <dt className="u-mono text-[clamp(28px,3vw,36px)] font-semibold leading-none tracking-[-0.03em]" data-count={m.v}>
                {m.v}
              </dt>
              <dd className="mt-3 text-[11.5px] tracking-[0.05em] text-faint">{m.l}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="u-container py-14 lg:py-20">
        <div className="grid gap-px border border-line2 bg-line md:grid-cols-2 lg:grid-cols-3">
          {d.cases.items.map((c, i) => (
            <article key={c.k} className="group bg-bg p-7 transition-colors hover:bg-bg2" data-reveal={String(i * 0.03)}>
              <p className="u-mono text-[10px] tracking-[0.14em] text-faint">{c.k}</p>
              <h2 className="mt-4 min-h-[84px] text-[18px] font-semibold leading-[1.55]">{c.h}</h2>
              <p className="min-h-[70px] text-[12.5px] leading-[1.85] text-muted">{c.p}</p>
              <div className="mt-6 flex items-end justify-between border-t border-line pt-5">
                <div>
                  <p className="u-mono text-[30px] font-semibold leading-none tracking-tight">{c.b}</p>
                  <p className="mt-2 text-[10.5px] text-faint">{c.c}</p>
                </div>
                <span className="u-mono text-[13px] text-faint transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </article>
          ))}
        </div>

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
        eyebrow={`06 / ${d.cta.eyebrow}`}
        title={d.cta.title}
        sub={d.cta.sub}
        buttons={d.cta.buttons}
        locale={locale}
      />
    </>
  )
}
