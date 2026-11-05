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
    path: '/about/',
    title: `${d.page.about.title} · ${d.meta.title.split(' · ')[0]}`,
    description: d.page.about.desc,
  })
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const d = getDict(locale)
  const p = d.page.about

  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} desc={p.desc} />

      <section className="u-container py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <p className="u-label mb-5">COMPANY</p>
            {p.paras.map((para, i) => (
              <p
                key={i}
                className={`text-[15px] leading-[2] ${i === 0 ? 'text-ink2' : 'mt-5 text-muted'}`}
              >
                {para}
              </p>
            ))}
          </div>

          <dl className="grid grid-cols-3 gap-px self-start border border-line2 bg-line">
            {p.facts.map((f) => (
              <div key={f.l} className="bg-bg px-4 py-7 text-center">
                <dt className="u-mono text-[clamp(20px,2.2vw,26px)] font-semibold leading-none tracking-tight">
                  {f.v}
                </dt>
                <dd className="mt-3 text-[10.5px] tracking-[0.04em] text-faint">{f.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-y border-line2 bg-bg2/40">
        <div className="u-container grid gap-12 py-14 lg:grid-cols-2 lg:gap-20 lg:py-20">
          <div>
            <div className="mb-4 flex items-baseline justify-between border-b border-line2 pb-4">
              <h2 className="text-[20px] font-semibold">{p.qualsTitle}</h2>
              <span className="u-mono text-[10px] tracking-[0.14em] text-faint">CERTIFIED</span>
            </div>
            <ul>
              {p.quals.map((q) => (
                <li
                  key={q}
                  className="flex items-center justify-between border-b border-line py-4 text-[14.5px]"
                >
                  {q}
                  <span className="u-mono text-[10px] text-faint">✓</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-4 flex items-baseline justify-between border-b border-line2 pb-4">
              <h2 className="text-[20px] font-semibold">{p.contactTitle}</h2>
              <span className="u-mono text-[10px] tracking-[0.14em] text-faint">CONTACT</span>
            </div>
            <dl>
              {p.contact.map((c) => (
                <div key={c.k} className="flex justify-between gap-6 border-b border-line py-4">
                  <dt className="u-mono pt-1 text-[10px] tracking-[0.1em] text-faint">{c.k}</dt>
                  <dd className="max-w-[320px] text-right text-[14px] leading-relaxed">{c.v}</dd>
                </div>
              ))}
            </dl>
            <Link href={`/${locale}/network/`} className="u-link mt-6 inline-flex">
              {d.net.cta} <span className="text-faint">→</span>
            </Link>
          </div>
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
