import Link from 'next/link'
import { locales } from '@/lib/i18n'
import { getDict } from '@/content'
import WorkOrder from '@/components/WorkOrder'
import CasesRail from '@/components/CasesRail'
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
        <div className="u-container relative grid gap-12 pb-12 pt-14 lg:grid-cols-[1.04fr_0.96fr] lg:gap-14 lg:pb-16 lg:pt-20">
          <div>
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

            <p className="mt-7 max-w-[500px] text-[15.5px] leading-[1.95] text-muted" data-hero-fade>
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

          <div className="lg:pt-2">
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
                  className="u-mono text-[clamp(28px,3vw,38px)] font-semibold leading-none tracking-[-0.03em]"
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
          eyebrow={`02 / ${d.cap.eyebrow}`}
          index="02 — 05"
          title={d.cap.title.join('')}
        >
          <p className="mt-4 max-w-[560px] text-[14px] leading-[1.9] text-muted">
            {d.page.capability.intro}
          </p>
        </SectionHead>

        <div className="border-t border-line2">
          {d.cap.items.map((c, i) => (
            <Link
              key={c.no}
              href={`/${locale}/capability/`}
              className="group grid grid-cols-1 gap-x-6 gap-y-3 border-b border-line py-6 transition-colors duration-200 hover:bg-inv lg:grid-cols-[64px_240px_1fr_168px_52px] lg:items-start lg:py-7"
              data-reveal={String(i * 0.04)}
            >
              <span className="u-mono pt-1 text-[11px] tracking-[0.1em] text-faint group-hover:text-invt/60">
                {c.no}
              </span>
              <h3 className="text-[21px] font-semibold leading-tight group-hover:text-invt">
                {c.title}
                <small className="u-mono mt-2 block text-[9.5px] font-normal tracking-[0.16em] text-faint group-hover:text-invt/50">
                  {c.en}
                </small>
              </h3>
              <p className="text-[13.5px] leading-[1.95] text-muted group-hover:text-invt/70">{c.desc}</p>
              <div className="lg:text-right">
                <b className="u-mono block text-[22px] font-semibold tracking-tight group-hover:text-invt">
                  {c.metric}
                </b>
                <span className="mt-1 block text-[10.5px] tracking-[0.05em] text-faint group-hover:text-invt/50">
                  {c.metricLabel}
                </span>
              </div>
              <span className="u-mono hidden text-right text-[13px] text-faint transition-opacity group-hover:text-invt lg:block">
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

      {/* ---------- network + sla ---------- */}
      <section className="border-y border-line2 bg-bg2/40">
        <div className="u-container py-16 lg:py-24">
          <SectionHead eyebrow={`03 / ${d.net.eyebrow}`} index="03 — 05" title={d.net.title}>
            <p className="mt-4 max-w-[520px] text-[14px] leading-[1.9] text-muted">{d.net.sub}</p>
          </SectionHead>

          <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
            <div data-reveal>
              {d.net.sites.slice(0, 5).map((s) => (
                <div key={s.name} className="flex items-center justify-between border-b border-line py-4">
                  <span className="text-[15px] font-medium">
                    {s.name}
                    <em className="u-mono ml-2 not-italic text-[9.5px] tracking-[0.12em] text-faint">
                      {s.tag}
                    </em>
                  </span>
                  <span className="u-mono text-[11.5px] text-muted">{s.coverage}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-b border-line py-4 text-faint">
                <span className="text-[15px] font-medium">
                  {d.net.sites
                    .slice(5)
                    .map((s) => s.name)
                    .join(' / ')}
                  <em className="u-mono ml-2 not-italic text-[9.5px] tracking-[0.12em]">
                    {d.net.sites[5].tag}
                  </em>
                </span>
              </div>
              <p className="mt-5 max-w-[460px] text-[11.5px] leading-[1.9] text-faint">{d.net.note}</p>
              <Link href={`/${locale}/network/`} className="u-link mt-6 inline-flex">
                {d.net.cta} <span className="text-faint">→</span>
              </Link>
            </div>

            <div data-reveal="0.08">
              <p className="u-label mb-4">{d.net.slaTitle}</p>
              <SlaTable net={d.net} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- cases ---------- */}
      <section id="cases" className="border-b border-line2">
        <div className="u-container pt-16 lg:pt-24">
          <SectionHead eyebrow={`04 / ${d.cases.eyebrow}`} index="04 — 05" title={d.cases.title} />
        </div>
        <CasesRail
          items={d.cases.items}
          hint={d.cases.hint}
          all={d.cases.all}
          href={`/${locale}/cases/`}
        />
      </section>

      {/* ---------- process ---------- */}
      <section id="process" className="u-container py-16 lg:py-24">
        <SectionHead eyebrow={`05 / ${d.process.eyebrow}`} index="05 — 05" title={d.process.title} />

        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-px bg-line2" />
          <div className="absolute inset-x-0 top-0 h-px origin-left bg-ink" data-line />
          <ol className="grid gap-8 pt-8 sm:grid-cols-2 lg:grid-cols-6 lg:gap-0">
            {d.process.steps.map((s) => (
              <li key={s.no} className="lg:border-r lg:border-line lg:pr-5 lg:last:border-r-0" data-reveal>
                <span className="u-mono text-[10px] tracking-[0.1em] text-faint">{s.no}</span>
                <h3 className="mt-3 text-[16px] font-semibold">{s.t}</h3>
                <p className="mt-2 text-[11.5px] leading-[1.8] text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
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
