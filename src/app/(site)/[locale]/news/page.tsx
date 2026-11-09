import Link from 'next/link'
import type { Metadata } from 'next'
import { locales, type Locale } from '@/lib/i18n'
import { getDict } from '@/content'
import { pageMetadata } from '@/lib/seo'
import { formatNewsDate, getAllNews } from '@/lib/news'
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
    path: '/news/',
    description: d.page.news.desc,
  })
}

/** News index, driven by content/news/*.md — newest first, no dictionary edits needed. */
export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const d = getDict(locale)
  const p = d.page.news
  const items = getAllNews()

  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} desc={p.desc} />

      <section className="u-container py-14 lg:py-20">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line2 pb-4">
          <span className="u-label">{p.listLabel}</span>
          <span className="u-mono text-[10px] tracking-[0.14em] text-faint">
            {String(items.length).padStart(2, '0')} ARTICLES
          </span>
        </div>

        {items.map((item, i) => (
          <Link
            key={item.slug}
            href={`/${locale}/news/${item.slug}/`}
            className="group grid gap-x-10 gap-y-3 border-b border-line py-7 transition-colors hover:bg-bg2 lg:grid-cols-[132px_1fr_52px] lg:items-start lg:py-8"
            data-reveal={String(Math.min(i, 6) * 0.03)}
          >
            <div className="flex items-center gap-3 lg:block">
              <p className="u-mono text-[11px] tracking-[0.1em] text-muted">
                {formatNewsDate(item.date)}
              </p>
              <p className="u-mono text-[9.5px] tracking-[0.14em] text-faint lg:mt-2">
                {p.categories[item.category]}
              </p>
            </div>

            <div className="min-w-0">
              <h2 className="text-[19px] font-semibold leading-[1.55] lg:text-[22px]">
                {item.title}
              </h2>
              <p className="mt-2 max-w-[780px] text-[13.5px] leading-[1.9] text-muted">
                {item.excerpt}
              </p>
            </div>

            <span className="u-mono hidden justify-self-end pt-1 text-[12px] text-faint transition-transform duration-200 group-hover:translate-x-1 lg:block">
              →
            </span>
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
