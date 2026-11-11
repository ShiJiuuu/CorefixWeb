import type { Metadata } from 'next'
import { locales, type Locale } from '@/lib/i18n'
import { getDict } from '@/content'
import { pageMetadata } from '@/lib/seo'
import { CtaBand } from '@/components/Sections'

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
    path: '/careers/',
    description: d.page.careers.desc,
  })
}

export default async function CareersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const d = getDict(locale)
  const p = d.page.careers

  return (
    <>
      {/* ---------- hero: photo band carrying the page title ---------- */}
      <section
        data-nav-overlay
        className="relative -mt-[var(--dock-h)] overflow-hidden bg-[#0a1622]"
      >
        <img
          src="/media/careers-hero.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent lg:h-32" />

        <div className="u-container relative flex min-h-[400px] flex-col justify-end pb-12 pt-[calc(var(--dock-h)+64px)] lg:min-h-[470px] lg:pb-16">
          <p className="u-mono text-[10px] tracking-[0.18em] text-white/55">{p.eyebrow}</p>
          <h1 className="mt-4 text-[42px] font-semibold leading-[1.04] text-white lg:text-[64px]">
            {p.title}
          </h1>
          <p className="mt-5 max-w-[560px] text-[14px] leading-[1.9] text-white/75 lg:text-[15.5px]">
            {p.desc}
          </p>
        </div>
      </section>

      {/* ---------- open roles ---------- */}
      <section className="border-b border-line2">
        <div className="u-container py-14 lg:py-18">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line2 pb-4">
            <h2 className="text-[20px] font-semibold">{p.openingsTitle}</h2>
            <span className="u-mono text-[10px] tracking-[0.12em] text-faint">{p.openingsNote}</span>
          </div>

          {p.openings.map((job, i) => (
            <article
              key={job.title}
              className="border-b border-line py-9 lg:py-11"
              data-reveal={String(i * 0.03)}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
                <div className="flex min-w-0 items-baseline gap-4">
                  <span className="u-mono text-[11px] tracking-[0.1em] text-faint">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-[24px] font-semibold leading-tight">{job.title}</h3>
                </div>
                <b className="u-mono text-[19px] font-semibold tracking-tight">{job.salary}</b>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13.5px] leading-[1.85] text-ink2">
                {job.meta.map((m, mi) => (
                  <span key={m} className="flex items-center gap-3">
                    {mi > 0 && <span className="text-faint">·</span>}
                    {m}
                  </span>
                ))}
              </div>

              <div className="mt-7 grid gap-7 lg:grid-cols-2 lg:gap-10">
                {[
                  { t: job.dutiesTitle, list: job.duties },
                  { t: job.reqsTitle, list: job.reqs },
                ].map((block) => (
                  <div key={block.t}>
                    <p className="u-label mb-3.5">{block.t}</p>
                    <ol className="space-y-2.5">
                      {block.list.map((item, idx) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 text-[13.5px] leading-[1.85] text-ink2"
                        >
                          <span className="u-mono mt-[2px] shrink-0 text-[10.5px] text-faint">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- apply ---------- */}
      <section className="bg-bg2/40">
        <div className="u-container py-14 lg:py-18">
          <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
            <div className="lg:w-[240px] lg:shrink-0">
              <h2 className="text-[20px] font-semibold">{p.applyTitle}</h2>
              <p className="u-mono mt-3 text-[9.5px] tracking-[0.16em] text-faint">APPLY</p>
            </div>

            <div className="min-w-0 flex-1">
              <dl className="border-t border-line2">
                {p.apply.map((row) => (
                  <div
                    key={row.k}
                    className="flex flex-col justify-between gap-1 border-b border-line py-4 sm:flex-row sm:items-center sm:gap-6"
                  >
                    <dt className="u-mono text-[10.5px] tracking-[0.1em] text-faint">{row.k}</dt>
                    <dd className="text-[14px] leading-[1.7] text-ink2 sm:text-right">
                      {row.href ? (
                        <a href={row.href} className="u-link">
                          {row.v}
                        </a>
                      ) : (
                        row.v
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-7 max-w-[720px] border-l-2 border-line2 pl-5 text-[14px] leading-[1.95] text-muted">
                {p.quote}
              </p>
            </div>
          </div>
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
