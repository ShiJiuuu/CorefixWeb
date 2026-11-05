import type { CaseItem } from '@/content/types'

/**
 * One case card. Shared by the home section and /cases so the two never drift:
 * home renders it under an h2 section head, /cases under the page h1.
 */
export function CaseCard({
  item,
  index = 0,
  headingLevel: Heading = 'h3',
}: {
  item: CaseItem
  index?: number
  headingLevel?: 'h2' | 'h3'
}) {
  return (
    <article
      className="group bg-bg p-7 transition-colors hover:bg-bg2"
      data-reveal={String(index * 0.03)}
    >
      <p className="u-mono text-[10px] tracking-[0.14em] text-faint">{item.k}</p>
      <Heading className="mt-4 min-h-[90px] text-[19px] font-semibold leading-[1.55]">{item.h}</Heading>
      <p className="min-h-[78px] text-[13.5px] leading-[1.85] text-muted">{item.p}</p>
      <div className="mt-6 flex items-end justify-between border-t border-line pt-5">
        <div>
          <p className="u-mono text-[30px] font-semibold leading-none tracking-tight">{item.b}</p>
          <p className="mt-2 text-[10.5px] text-faint">{item.c}</p>
        </div>
        <span className="u-mono text-[13px] text-faint transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
    </article>
  )
}

/** Hairline grid of case cards; 1 / 2 / 3 columns depending on the breakpoint. */
export function CaseGrid({
  items,
  headingLevel = 'h3',
}: {
  items: CaseItem[]
  headingLevel?: 'h2' | 'h3'
}) {
  return (
    <div className="grid gap-px border border-line2 bg-line md:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <CaseCard key={item.k} item={item} index={i} headingLevel={headingLevel} />
      ))}
    </div>
  )
}
