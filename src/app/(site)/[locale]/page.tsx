import Link from 'next/link'
import { locales } from '@/lib/i18n'
import { getDict } from '@/content'
import { CaseGrid } from '@/components/CaseCards'
import ProcessFlow from '@/components/ProcessFlow'
import SlaTable from '@/components/SlaTable'
import ServerModel from '@/components/server-model/ServerModel'
import ServerRevealVideo from '@/components/ServerRevealVideo'
import { SectionHead, CtaBand } from '@/components/Sections'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

/**
 * B300-3D演示模组 —— 暂从首页隐藏，代码与资源保留。
 * 改回 true 即可在原位置恢复显示。
 */
const SHOW_B300_MODEL = false

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const d = getDict(locale)

  return (
    <>
      {/* ---------- hero ---------- */}
      <section
        data-nav-overlay
        className="on-dark relative -mt-[var(--dock-h)] flex min-h-[100svh] flex-col overflow-hidden border-b border-line2 bg-black"
      >
        {/* B300-3D演示模组：全幅背景影片，取代原先的白色网格底 */}
        <ServerRevealVideo />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/25 md:via-black/30 md:to-transparent"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/60 md:bg-black/30 lg:bg-transparent" aria-hidden="true" />

        <div className="u-container relative flex flex-1 flex-col pb-12 pt-[calc(var(--dock-h)+3.5rem)] lg:pb-16 lg:pt-[calc(var(--dock-h)+5rem)]">
          <div className="relative flex flex-1 flex-col">
            <div className="flex w-full max-w-[820px] flex-1 flex-col">
              <p className="u-label flex items-center gap-2.5" data-hero-fade>
                <span className="inline-block h-px w-4 bg-ink" />
                {d.hero.eyebrow}
              </p>

              <h1 className="u-hero-title mt-6 font-semibold leading-[1.06] tracking-[-0.035em]">
                <span className="block overflow-hidden pb-1">
                  <span className="block" data-hero-line>
                    {d.hero.title[0]}
                  </span>
                </span>
                <span className="block overflow-hidden pb-1">
                  <span className="block text-muted" data-hero-line>
                    {d.hero.title[1]}
                  </span>
                </span>
              </h1>

              <p className="mt-7 max-w-[500px] text-[16.5px] leading-[1.95] text-muted" data-hero-fade>
                {d.hero.sub}
              </p>

              <div className="mt-9 flex flex-wrap gap-3" data-hero-fade>
                <Link href={`/${locale}/${d.hero.ctas[0].href}`} className="u-btn u-btn-solid">
                  {d.hero.ctas[0].label}
                  <span className="u-mono text-[13px]">→</span>
                </Link>
                <Link href={`/${locale}${d.hero.ctas[1].href}/`} className="u-btn u-btn-line">
                  {d.hero.ctas[1].label}
                </Link>
              </div>

              {/* B300-3D演示模组：默认隐藏（SHOW_B300_MODEL），代码保留在原位 */}
              {SHOW_B300_MODEL && (
                <div className="mt-10 w-full xl:absolute xl:top-0 xl:right-0 xl:mt-0 xl:w-[50%] xl:max-w-[880px]">
                  <ServerModel model={d.hero.model} />
                </div>
              )}

              <div className="mt-auto pt-9">
                <Link
                  href={`/${locale}/network/`}
                  className="group flex items-center justify-between gap-4 border border-line2 px-5 py-4 transition-colors hover:bg-bg2"
                  data-hero-fade
                >
                  <span className="u-mono text-[9.5px] leading-[1.7] tracking-[0.16em] text-faint">
                    {d.hero.netBar.label}
                  </span>
                  <span className="flex items-center gap-2 whitespace-nowrap text-[12px] font-semibold">
                    {d.hero.netBar.cta}
                    <span className="u-mono transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- capability ---------- */}
      <section id="capability" className="u-container py-16 lg:py-24">
        <SectionHead
          eyebrow={d.cap.eyebrow}
          title={
            <>
              {d.cap.title[0]}
              <br />
              {d.cap.title[1]}
            </>
          }
        >
          <p className="mt-4 max-w-[560px] text-[15px] leading-[1.9] text-muted">
            {d.page.capability.intro}
          </p>
        </SectionHead>

        <div className="grid gap-4 xl:grid-cols-12 xl:gap-5">
          {/* B300-3D演示模组：交互分解图 */}
          <div
            className="flex flex-col border border-line2 bg-bg2/60 p-5 xl:col-span-7 xl:p-6"
            data-reveal
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="u-mono text-[9px] tracking-[0.18em] text-faint">
                  B300 / INTERACTIVE MODEL
                </p>
                <h3 className="mt-2 text-[19px] font-semibold leading-snug">
                  {d.hero.model.label}
                </h3>
              </div>
              <span className="u-mono hidden shrink-0 pt-0.5 text-[9px] tracking-[0.16em] text-faint sm:block">
                EXPLODED VIEW
              </span>
            </div>

            <div className="mt-2 flex min-h-0 flex-1 items-center">
              <ServerModel model={d.hero.model} />
            </div>

            <div className="mt-4 border-t border-line pt-3">
              <p className="u-mono text-[8.5px] leading-[1.9] tracking-[0.06em] text-faint">
                8× B300 · 32× DDR5 · 8× OSFP 800G · 6× 6600W PSU · 12+4 FANS
              </p>
            </div>
          </div>

          {/* 8 capability titles: horizontal rows, no supporting copy */}
          <div className="grid gap-2 lg:grid-cols-2 xl:col-span-5 xl:flex xl:flex-col" data-reveal-group>
            {d.cap.items.map((c, i) => (
              <Link
                key={c.no}
                href={`/${locale}${d.cap.moreHref}/`}
                className="group flex min-h-[56px] flex-1 items-center gap-4 border border-line2 bg-card px-5 transition-colors duration-200 hover:border-ink hover:bg-inv"
                data-reveal={String(i * 0.03)}
              >
                <span className="u-mono shrink-0 text-[10px] tracking-[0.14em] text-faint transition-colors group-hover:text-invt/50">
                  {c.no}
                </span>
                <h3 className="min-w-0 flex-1 truncate text-[16px] font-semibold tracking-tight transition-colors group-hover:text-invt sm:text-[17px]">
                  {c.title}
                </h3>
                <div className="ml-auto shrink-0 text-right sm:flex sm:items-baseline sm:gap-2.5 sm:text-left">
                  <b className="u-mono block text-[17px] font-semibold leading-none tracking-tight transition-colors group-hover:text-invt sm:text-[19px]">
                    {c.metric}
                  </b>
                  <span className="mt-1 block text-[8.5px] leading-tight tracking-[0.03em] text-faint transition-colors group-hover:text-invt/50 sm:mt-0 sm:text-[9.5px] sm:whitespace-nowrap">
                    {c.metricLabel}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
          <Link href={`/${locale}${d.cap.moreHref}/`} className="u-link">
            {d.cap.more} <span className="text-faint">→</span>
          </Link>
        </div>
      </section>

      {/* ---------- cases ---------- */}
      <section id="cases" className="relative overflow-hidden border-y border-line2">
        {/* photographic backdrop, dimmed so the white cards and the headline stay readable */}
        <div
          className="pointer-events-none absolute inset-0 bg-[url('/media/cases-background.webp')] bg-cover bg-center"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/60" aria-hidden="true" />

        <div className="u-container relative py-16 lg:py-24">
          <div className="on-dark">
            <SectionHead eyebrow={d.cases.eyebrow} title={d.cases.title} />
          </div>

          <CaseGrid items={d.cases.items} locale={locale} readLabel={d.cases.read} glass />

          <div className="on-dark mt-7 flex flex-wrap items-center justify-between gap-4">
            <Link href={`/${locale}/cases/`} className="u-link">
              {d.cases.all} <span className="text-faint">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- network + sla ---------- */}
      <section className="border-b border-line2 bg-bg2/40">
        <div className="u-container py-16 lg:py-24">
          <SectionHead eyebrow={d.net.eyebrow} title={d.net.title}>
            <p className="mt-4 max-w-[520px] text-[15px] leading-[1.9] text-muted">{d.net.sub}</p>
          </SectionHead>

          <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
            <div className="min-w-0 lg:flex-1" data-reveal>
              {d.net.sites.slice(0, 5).map((s) => (
                <div key={s.name} className="flex items-center justify-between border-b border-line py-4">
                  <span className="text-[16px] font-medium">
                    {s.name}
                    <em className="u-mono ml-2 not-italic text-[9.5px] tracking-[0.12em] text-faint">
                      {s.tag}
                    </em>
                  </span>
                  <span className="u-mono text-[11.5px] text-muted">{s.coverage}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-b border-line py-4 text-faint">
                <span className="text-[16px] font-medium">
                  {d.net.sites
                    .slice(5)
                    .map((s) => s.name)
                    .join(' / ')}
                  <em className="u-mono ml-2 not-italic text-[9.5px] tracking-[0.12em]">
                    {d.net.sites[5].tag}
                  </em>
                </span>
              </div>
              <p className="mt-5 max-w-[460px] text-[12.5px] leading-[1.9] text-faint">{d.net.note}</p>
              <Link href={`/${locale}/network/`} className="u-link mt-6 inline-flex">
                {d.net.cta} <span className="text-faint">→</span>
              </Link>
            </div>

            <div className="min-w-0 lg:flex-[1.15]" data-reveal="0.08">
              <p className="u-label mb-4">{d.net.slaTitle}</p>
              <SlaTable net={d.net} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- process ---------- */}
      <section id="process" className="relative overflow-hidden">
        {/* lab photo backdrop, washed out so the diagram stays the focus */}
        <div
          className="pointer-events-none absolute inset-0 bg-[url('/media/process-background.webp')] bg-cover bg-center"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-bg/70" aria-hidden="true" />

        <div className="u-container relative py-16 lg:py-24">
          <SectionHead eyebrow={d.process.eyebrow} title={d.process.title} />

          <ProcessFlow flow={d.process.flow} />
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
