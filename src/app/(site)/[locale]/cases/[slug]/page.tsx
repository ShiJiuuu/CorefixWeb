import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { locales, isLocale, type Locale } from '@/lib/i18n'
import { caseSlugs, getDict } from '@/content'
import { pageMetadata, SITE_TITLE } from '@/lib/seo'
import { CtaBand } from '@/components/Sections'

/** Only the slugs generated below exist; anything else falls through to the 404 page. */
export const dynamicParams = false

export function generateStaticParams() {
  return locales.flatMap((locale) => caseSlugs.map((slug) => ({ locale, slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const item = getDict(locale).cases.items.find((c) => c.slug === slug)
  if (!item) return {}

  return pageMetadata({
    locale: isLocale(locale) ? locale : 'zh-cn',
    path: `/cases/${slug}/`,
    description: item.summary,
    title: `${item.title} — ${SITE_TITLE}`,
  })
}

const pad = (n: number) => String(n).padStart(2, '0')

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const d = getDict(locale)
  const t = d.cases.detail

  const index = d.cases.items.findIndex((c) => c.slug === slug)
  if (index === -1) notFound()
  const item = d.cases.items[index]
  const related = d.cases.items.filter((c) => c.slug !== slug).slice(0, 3)

  const meta: [string, string][] = [
    [t.client, item.client],
    [t.service, item.service],
    [t.date, item.date],
  ]

  return (
    <>
      {/* ---------- header ---------- */}
      <section className="border-b border-line2">
        <div className="u-container pb-10 pt-7 lg:pb-14 lg:pt-9">
          <div className="flex items-center justify-between gap-6">
            <Link
              href={`/${locale}/cases/`}
              className="u-mono text-[10.5px] tracking-[0.14em] text-muted transition-colors hover:text-ink"
            >
              ← {t.back}
            </Link>
            <span className="u-mono text-[10.5px] tracking-[0.14em] text-faint">
              CASE {pad(index + 1)} / {pad(d.cases.items.length)}
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="u-mono border border-line2 px-2.5 py-1 text-[9.5px] tracking-[0.12em] text-muted">
              {item.tag}
            </span>
            <span className="u-mono border border-line2 px-2.5 py-1 text-[9.5px] tracking-[0.12em] text-muted">
              {item.device}
            </span>
          </div>

          <h1 className="mt-5 max-w-[900px] text-[38px] font-semibold leading-[1.2] lg:text-[52px]">
            {item.title}
          </h1>
          <p className="mt-5 max-w-[640px] text-[15.5px] leading-[1.95] text-muted">{item.summary}</p>

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3">
            {meta.map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-2">
                <dt className="u-mono text-[9.5px] tracking-[0.12em] text-faint">{k}</dt>
                <dd className="text-[12.5px]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------- headline metrics ---------- */}
      <section className="border-b border-line2">
        <dl className="u-container grid grid-cols-2">
          {item.metrics.map((m, i) => (
            <div key={m.l} className={`py-7 lg:py-8 ${i > 0 ? 'border-l border-line pl-6 lg:pl-10' : ''}`}>
              <dt className="u-mono text-[34px] font-semibold leading-none tracking-[-0.02em]">{m.v}</dt>
              <dd className="mt-3 text-[11px] tracking-[0.05em] text-faint">{m.l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- body ---------- */}
      <section className="u-container py-14 lg:py-20">
        <div className="flex flex-col gap-12 lg:gap-14">
          <Block no="01" title={t.challenge}>
            <div className="flex flex-col gap-4">
              {item.challenge.map((p) => (
                <p key={p} className="text-[15px] leading-[2] text-muted">
                  {p}
                </p>
              ))}
            </div>
          </Block>

          <Block no="02" title={t.solution}>
            <div className="grid gap-px border border-line2 bg-line sm:grid-cols-2">
              {item.solution.map((s, i) => (
                <div key={s.t} className="bg-bg p-6">
                  <p className="u-mono text-[10px] tracking-[0.14em] text-faint">{pad(i + 1)}</p>
                  <h3 className="mt-3 text-[16.5px] font-semibold">{s.t}</h3>
                  <p className="mt-2 text-[13.5px] leading-[1.9] text-muted">{s.d}</p>
                </div>
              ))}
            </div>
          </Block>

          <Block no="03" title={t.outcome}>
            <div className="flex flex-col gap-4">
              {item.outcome.map((p) => (
                <p key={p} className="text-[15px] leading-[2] text-muted">
                  {p}
                </p>
              ))}
            </div>
          </Block>

          {item.quote && (
            <Block no="04" title={t.quote}>
              <blockquote className="border-l-2 border-line2 pl-5">
                <p className="text-[16px] leading-[1.9]">{item.quote.text}</p>
                <footer className="u-mono mt-3 text-[10px] tracking-[0.12em] text-faint">
                  {item.quote.by}
                </footer>
              </blockquote>
            </Block>
          )}
        </div>
      </section>

      {/* ---------- related ---------- */}
      {related.length > 0 && (
        <section className="border-y border-line2 bg-bg2/40">
          <div className="u-container py-14 lg:py-16">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-[26px] font-semibold">{t.related}</h2>
              <Link href={`/${locale}/cases/`} className="u-link">
                {t.allCases} <span className="text-faint">→</span>
              </Link>
            </div>

            <div className="mt-8 grid gap-px border border-line2 bg-line md:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/${locale}/cases/${r.slug}/`}
                  className="group flex flex-col bg-bg p-6 transition-colors hover:bg-bg2"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="u-mono text-[9.5px] tracking-[0.12em] text-faint">{r.client}</p>
                    <span className="u-mono shrink-0 text-[9.5px] tracking-[0.1em] text-faint">
                      {r.tag}
                    </span>
                  </div>
                  <h3 className="mt-3 flex-1 text-[16px] font-semibold leading-[1.55]">{r.title}</h3>
                  <span className="u-mono mt-6 flex items-center justify-between text-[10.5px] tracking-[0.1em] text-faint transition-transform group-hover:translate-x-1">
                    {d.cases.read}
                    <span>→</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand
        eyebrow={d.cta.eyebrow}
        title={d.cta.title}
        sub={d.cta.sub}
        buttons={d.cta.buttons}
        locale={locale as Locale}
      />
    </>
  )
}

function Block({
  no,
  title,
  children,
}: {
  no: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-5 border-t border-line2 pt-7 lg:grid-cols-[190px_1fr] lg:gap-12 lg:pt-9">
      <div>
        <p className="u-mono text-[10px] tracking-[0.16em] text-faint">{no}</p>
        <h2 className="mt-2 text-[19px] font-semibold">{title}</h2>
      </div>
      <div className="min-w-0 max-w-[780px]">{children}</div>
    </div>
  )
}
