import Link from 'next/link'
import { locales } from '@/lib/i18n'
import { getDict } from '@/content'
import WorkOrder from '@/components/WorkOrder'
import { CaseGrid } from '@/components/CaseCards'
import ProcessFlow from '@/components/ProcessFlow'
import SlaTable from '@/components/SlaTable'
import { SectionHead, CtaBand } from '@/components/Sections'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const d = getDict(locale)

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="relative overflow-hidden border-b border-line2">
        <div
          className="u-gridbg pointer-events-none absolute inset-0"
          style={{
            maskImage: 'radial-gradient(ellipse 75% 70% at 65% 35%, #000, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 70% at 65% 35%, #000, transparent 80%)',
          }}
        />
        <div className="u-container relative flex flex-col gap-12 pb-12 pt-14 lg:gap-14 lg:pb-16 lg:pt-20 xl:flex-row xl:items-start">
          <div className="min-w-0 xl:flex-[1.04]">
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

            <Link
              href={`/${locale}/network/`}
              className="group mt-9 flex items-center justify-between gap-4 border border-line2 px-5 py-4 transition-colors hover:bg-bg2"
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

          <div className="min-w-0 lg:max-w-[620px] xl:max-w-none xl:flex-[0.96] xl:pt-2">
            <WorkOrder wo={d.wo} />
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              {d.hero.meta.map((m) => (
                <div key={m.l} className="flex items-baseline gap-2">
                  <span className="u-mono text-[14px] font-semibold" data-count={m.v}>
                    {m.v}
                  </span>
                  <span className="text-[11px] tracking-[0.04em] text-faint">{m.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="u-container relative">
          <dl className="grid grid-cols-2 border-t border-line2 lg:grid-cols-4">
            {d.stats.map((s, i) => (
              <div
                key={s.l}
                className={`border-line py-6 lg:py-7 ${i < 2 ? 'border-b lg:border-b-0' : ''} ${
                  i % 2 === 1 ? '' : 'pr-5 lg:pr-8'
                } ${i > 0 ? 'lg:border-l lg:pl-8' : ''} ${i === 1 ? 'border-l pl-5 lg:pl-8' : ''} ${
                  i === 2 ? 'lg:border-l-0' : ''
                }`}
              >
                <dt
                  className="u-mono text-[38px] font-semibold leading-none tracking-[-0.03em]"
                  data-count={s.v}
                >
                  {s.v}
                </dt>
                <dd className="mt-3 text-[11.5px] tracking-[0.05em] text-faint">{s.l}</dd>
              </div>
            ))}
          </dl>
          <div className="border-t border-line2" />
        </div>
      </section>

      {/* ---------- capability ---------- */}
      <section className="u-container py-16 lg:py-24">
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

        <div className="border-t border-line2">
          {d.cap.items.map((c, i) => (
            <Link
              key={c.no}
              href={`/${locale}/capability/`}
              className="group flex flex-col gap-x-6 gap-y-3 border-b border-line py-6 transition-colors duration-200 hover:bg-inv lg:flex-row lg:items-start lg:gap-x-5 lg:py-7 xl:gap-x-6"
              data-reveal={String(i * 0.04)}
            >
              <span className="u-mono pt-1 text-[11px] tracking-[0.1em] text-faint group-hover:text-invt/60 lg:w-10 lg:shrink-0 xl:w-16">
                {c.no}
              </span>
              <h3 className="text-[21px] font-semibold leading-tight group-hover:text-invt lg:w-[180px] lg:shrink-0 xl:w-60">
                {c.title}
                <small className="u-mono mt-2 block text-[9.5px] font-normal tracking-[0.16em] text-faint group-hover:text-invt/50">
                  {c.en}
                </small>
              </h3>
              <p className="text-[14.5px] leading-[1.95] text-muted group-hover:text-invt/70 lg:min-w-0 lg:max-w-[660px] lg:flex-1">{c.desc}</p>
              <div className="lg:w-[120px] lg:shrink-0 lg:text-right xl:w-[168px]">
                <b className="u-mono block text-[22px] font-semibold tracking-tight group-hover:text-invt">
                  {c.metric}
                </b>
                <span className="mt-1 block text-[10.5px] tracking-[0.05em] text-faint group-hover:text-invt/50">
                  {c.metricLabel}
                </span>
              </div>
              <span className="u-mono hidden text-right text-[13px] text-faint transition-opacity group-hover:text-invt xl:block xl:w-[52px] xl:shrink-0">
                →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
          <Link href={`/${locale}${d.cap.moreHref}/`} className="u-link">
            {d.cap.more} <span className="text-faint">→</span>
          </Link>
        </div>
      </section>

      {/* ---------- cases ---------- */}
      <section id="cases" className="border-y border-line2">
        <div className="u-container py-16 lg:py-24">
          <SectionHead eyebrow={d.cases.eyebrow} title={d.cases.title} />

          <CaseGrid items={d.cases.items} locale={locale} readLabel={d.cases.read} />

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
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
      <section id="process" className="u-container py-16 lg:py-24">
        <SectionHead eyebrow={d.process.eyebrow} title={d.process.title} />

        <ProcessFlow flow={d.process.flow} />
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
