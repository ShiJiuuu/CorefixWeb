import type { Metadata } from 'next'
import { locales, type Locale } from '@/lib/i18n'
import { getDict } from '@/content'
import { pageMetadata } from '@/lib/seo'
import { PageHeader, CtaBand } from '@/components/Sections'
import CertificateMarquee from '@/components/CertificateMarquee'

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
      </section>

      <section className="border-y border-line2 bg-bg2/40">
        <div className="u-container pt-14 lg:pt-20">
          <div className="flex items-baseline justify-between border-b border-line2 pb-4">
            <h2 className="text-[20px] font-semibold">{p.qualsTitle}</h2>
            <span className="u-mono text-[10px] tracking-[0.14em] text-faint">CERTIFIED</span>
          </div>
        </div>
        <div className="u-container mt-8 pb-14 lg:mt-10 lg:pb-20">
          <CertificateMarquee locale={locale as Locale} label={p.qualsTitle} />
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
