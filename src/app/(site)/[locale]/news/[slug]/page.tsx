import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { locales, isLocale } from '@/lib/i18n'
import { getDict } from '@/content'
import { pageMetadata, SITE_TITLE } from '@/lib/seo'
import { formatNewsDate, getAllNews, getNews, getNewsSlugs } from '@/lib/news'
import { CtaBand } from '@/components/Sections'

export const dynamicParams = false

export function generateStaticParams() {
  return locales.flatMap((locale) => getNewsSlugs().map((slug) => ({ locale, slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const article = getNews(slug)
  if (!article) return {}

  return pageMetadata({
    locale: isLocale(locale) ? locale : 'zh-cn',
    path: `/news/${slug}/`,
    description: article.excerpt || article.title,
    title: `${article.title} — ${SITE_TITLE}`,
  })
}

/**
 * Unified article template: every entry in content/news renders here. The body is
 * pre-rendered Markdown served with `.article-body` typography, so we only need to
 * keep one layout in sync with the rest of the site.
 */
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const d = getDict(locale)
  const p = d.page.news
  const article = getNews(slug)
  if (!article) notFound()

  const all = getAllNews()
  const index = all.findIndex((a) => a.slug === slug)
  const newer = index > 0 ? all[index - 1] : undefined
  const older = index < all.length - 1 ? all[index + 1] : undefined

  return (
    <>
      <article className="u-container pb-14 pt-7 lg:pb-20 lg:pt-9">
        <div className="mx-auto w-full max-w-[720px]">
          <div className="flex items-center justify-between gap-6">
            <Link
              href={`/${locale}/news/`}
              className="u-mono text-[10.5px] tracking-[0.14em] text-muted transition-colors hover:text-ink"
            >
              ← {p.back}
            </Link>
            <span className="u-mono text-[10.5px] tracking-[0.1em] text-faint">
              {formatNewsDate(article.date)}
            </span>
          </div>

          <header className="mt-8">
            <span className="u-mono border border-line2 px-2.5 py-1 text-[9.5px] tracking-[0.12em] text-muted">
              {p.categories[article.category]}
            </span>
            <h1 className="mt-5 text-[26px] font-semibold leading-[1.36] lg:text-[34px]">
              {article.title}
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-5">
              <span className="u-mono text-[10px] tracking-[0.12em] text-faint">
                {p.updatedLabel} {formatNewsDate(article.date)}
              </span>
              {article.source && (
                <a
                  href={article.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="u-link"
                >
                  {p.sourceLabel} <span className="text-faint">↗</span>
                </a>
              )}
            </div>
          </header>

          <div
            className="article-body mt-10"
            lang="zh-CN"
            dangerouslySetInnerHTML={{ __html: article.html }}
          />
        </div>
      </article>

      {(newer || older) && (
        <section className="border-t border-line2">
          <div className="u-container grid gap-px bg-line md:grid-cols-2">
            {[
              { item: older, label: p.prev },
              { item: newer, label: p.next },
            ].map(({ item, label }, i) =>
              item ? (
                <Link
                  key={label}
                  href={`/${locale}/news/${item.slug}/`}
                  className={`group bg-bg p-6 transition-colors hover:bg-bg2 lg:p-7 ${
                    i === 1 ? 'md:text-right' : ''
                  }`}
                >
                  <p className="u-mono text-[9.5px] tracking-[0.14em] text-faint">
                    {label} {i === 1 ? '→' : '←'}
                  </p>
                  <p className="mt-3 text-[15.5px] font-semibold leading-[1.6]">{item.title}</p>
                </Link>
              ) : (
                <div key={label} className="bg-bg" />
              ),
            )}
          </div>
        </section>
      )}

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
