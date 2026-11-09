import Link from 'next/link'
import type { CaseStudy } from '@/content/types'

/**
 * One case card. Shared by the home section, /cases and the related block on a
 * detail page, so the visual language never drifts between the three places.
 *
 * The card is a link to /[locale]/cases/[slug]/ — the whole surface is clickable,
 * and the "read case" label is decorative rather than a nested anchor.
 */
export function CaseCard({
  item,
  index = 0,
  locale,
  readLabel,
  headingLevel: Heading = 'h3',
  wide = false,
  glass = false,
}: {
  item: CaseStudy
  index?: number
  locale: string
  readLabel: string
  headingLevel?: 'h2' | 'h3'
  /** Spans both columns; used for the last card when the count is odd. */
  wide?: boolean
  /** Frosted, rounded card used when the grid floats on the photo backdrop. */
  glass?: boolean
}) {
  return (
    <Link
      href={`/${locale}/cases/${item.slug}/`}
      className={`group flex flex-col p-7 transition-colors duration-200 lg:p-8 ${
        glass
          ? 'card-glass rounded-3xl border border-line2 bg-bg/85 backdrop-blur-xl hover:bg-bg'
          : 'bg-bg hover:bg-bg2'
      } ${wide ? 'md:col-span-2' : ''}`}
      data-reveal={String(index * 0.03)}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="u-mono text-[10px] tracking-[0.14em] text-faint">
          {String(index + 1).padStart(2, '0')} / {item.client}
        </p>
        <span className="u-mono shrink-0 border border-line2 px-2 py-0.5 text-[9.5px] tracking-[0.1em] text-muted">
          {item.tag}
        </span>
      </div>

      <Heading
        className={`mt-4 font-semibold leading-[1.5] ${
          wide ? 'text-[21px] lg:text-[26px]' : 'text-[19px] lg:text-[23px]'
        }`}
      >
        {item.title}
      </Heading>

      <p className="mt-3 max-w-[640px] flex-1 text-[13.5px] leading-[1.85] text-muted">
        {item.summary}
      </p>

      <div className="mt-6 flex items-end justify-between gap-4 border-t border-line pt-5">
        <div className="flex flex-wrap gap-x-7 gap-y-3">
          {item.metrics.slice(0, 2).map((m) => (
            <div key={m.l}>
              <p className="u-mono text-[26px] font-semibold leading-none tracking-tight">{m.v}</p>
              <p className="mt-2 text-[10.5px] text-faint">{m.l}</p>
            </div>
          ))}
        </div>
        <span className="u-mono hidden shrink-0 items-center gap-1.5 text-[10.5px] tracking-[0.1em] text-faint transition-transform duration-200 group-hover:translate-x-1 sm:flex">
          {readLabel}
          <span>→</span>
        </span>
      </div>
    </Link>
  )
}

/**
 * Hairline case grid: one column on mobile, two from md up.
 *
 * Extensibility rule: an odd number of cases would leave an empty cell, so the
 * last card spans both columns instead. Adding a fifth case therefore needs no
 * layout work at all — it simply becomes 2 + 2 + 1 full-width.
 */
export function CaseGrid({
  items,
  locale,
  readLabel,
  headingLevel = 'h3',
  glass = false,
}: {
  items: CaseStudy[]
  locale: string
  readLabel: string
  headingLevel?: 'h2' | 'h3'
  glass?: boolean
}) {
  const odd = items.length % 2 === 1

  return (
    <div className={glass ? 'grid gap-5 md:grid-cols-2' : 'grid gap-px border border-line2 bg-line md:grid-cols-2'}>
      {items.map((item, i) => (
        <CaseCard
          key={item.slug}
          item={item}
          index={i}
          locale={locale}
          readLabel={readLabel}
          headingLevel={headingLevel}
          wide={odd && i === items.length - 1}
          glass={glass}
        />
      ))}
    </div>
  )
}
