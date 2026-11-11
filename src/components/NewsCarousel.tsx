'use client'

import Link from 'next/link'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

export type NewsCardItem = {
  slug: string
  title: string
  /** Already formatted for display, e.g. 2026.08.18 */
  date: string
  /** Localized category label. */
  category: string
  excerpt: string
  /** Card-sized cover (900 × 675 WebP); empty string falls back to the typographic cover. */
  cover: string
  readTime: number
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * One card. Memoized because the parent re-renders on every scroll frame to update
 * the counter and the progress rail; the cards themselves never change.
 */
const NewsCard = memo(function NewsCard({
  item,
  index,
  locale,
  readMore,
}: {
  item: NewsCardItem
  index: number
  locale: string
  readMore: string
}) {
  return (
    <Link
      href={`/${locale}/news/${item.slug}/`}
      data-news-card
      className="news-card group flex snap-start flex-col overflow-hidden rounded-[2px] border border-line2 bg-card transition-colors duration-200 hover:border-ink"
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-bg2">
        {item.cover ? (
          <img
            src={item.cover}
            alt=""
            loading={index < 4 ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            className="h-full w-full object-cover grayscale transition-[transform,filter] duration-700 ease-out group-hover:scale-[1.035] group-hover:brightness-[1.03]"
          />
        ) : (
          <div className="u-gridbg flex h-full w-full items-end bg-bg2 px-5 pb-3">
            <span className="u-mono text-[clamp(64px,7vw,104px)] leading-[0.8] tracking-[-0.06em] text-line2">
              {pad(index + 1)}
            </span>
          </div>
        )}

        <span
          className={`absolute left-4 top-4 border px-2 py-1 text-[9px] leading-none tracking-[0.14em] ${
            item.cover
              ? 'border-white/45 bg-black/40 text-white backdrop-blur-sm'
              : 'border-line2 bg-bg/80 text-ink'
          }`}
        >
          {item.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 lg:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="u-mono text-[10px] leading-none tracking-[0.1em] text-muted">
            {item.date}
            <span className="mx-1.5 text-faint">·</span>
            {item.readTime} MIN READ
          </p>
          <span className="u-mono shrink-0 text-[10px] leading-none tracking-[0.12em] text-faint">
            {pad(index + 1)}
          </span>
        </div>

        <h3 className="mt-3 line-clamp-2 text-[16.5px] font-semibold leading-[1.55] tracking-[-0.01em] sm:text-[18px] xl:text-[19px]">
          {item.title}
        </h3>

        {item.excerpt ? (
          <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-[1.8] text-muted sm:text-[13px]">
            {item.excerpt}
          </p>
        ) : null}

        <div className="mt-auto pt-5">
          <span className="u-mono flex items-center justify-between border-t border-line pt-4 text-[10px] tracking-[0.14em]">
            <span>{readMore}</span>
            <span className="text-[12px] transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </span>
        </div>
      </div>
    </Link>
  )
})

/**
 * Homepage enterprise-news carousel.
 *
 * The track is a native horizontal scroller with CSS scroll-snap — touch, trackpad
 * and keyboard all work without a carousel library. There is no autoplay: the only
 * JavaScript is the arrows and the counter/progress readout, both derived from
 * `scrollLeft`, so they can never drift from what is actually on screen.
 */
export default function NewsCarousel({
  locale,
  items,
  eyebrow,
  title,
  desc,
  allLabel,
  readMore,
  prevLabel,
  nextLabel,
}: {
  locale: string
  items: NewsCardItem[]
  eyebrow: string
  title: string
  desc: string
  allLabel: string
  readMore: string
  prevLabel: string
  nextLabel: string
}) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [leading, setLeading] = useState(0)
  const [progress, setProgress] = useState(0)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [reduce, setReduce] = useState(false)

  const total = items.length

  /* ---------- motion preference ---------- */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduce(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  /* ---------- counter + progress follow the real scroll position ---------- */
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    let raf = 0

    const read = () => {
      raf = 0
      const cards = el.querySelectorAll<HTMLElement>('[data-news-card]')
      const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 0
      const max = el.scrollWidth - el.clientWidth
      const index = step > 0 ? Math.round(el.scrollLeft / step) : 0
      setLeading(Math.min(Math.max(index, 0), Math.max(total - 1, 0)))
      setProgress(max > 2 ? Math.min(1, Math.max(0, el.scrollLeft / max)) : 0)
      setAtStart(el.scrollLeft <= 2)
      setAtEnd(max <= 2 || el.scrollLeft >= max - 2)
    }

    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(read)
    }

    read()
    el.addEventListener('scroll', onScroll, { passive: true })
    const ro = new ResizeObserver(onScroll)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)

    return () => {
      el.removeEventListener('scroll', onScroll)
      ro.disconnect()
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [total])

  const scrollByCard = useCallback(
    (dir: 1 | -1) => {
      const el = trackRef.current
      if (!el) return
      const cards = el.querySelectorAll<HTMLElement>('[data-news-card]')
      const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 0
      if (!step) return
      el.scrollBy({ left: dir * step, behavior: reduce ? 'auto' : 'smooth' })
    },
    [reduce],
  )

  if (!total) return null

  return (
    <section
      id="news"
      aria-labelledby="news-title"
      className="border-t border-line2 bg-bg py-16 lg:py-24"
    >
      <div className="u-container">
        <div
          className="flex flex-col gap-6 border-b border-line2 pb-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16"
          data-reveal
        >
          <div className="max-w-[760px]">
            <p className="u-label">{eyebrow}</p>
            <h2
              id="news-title"
              className="mt-4 text-[clamp(34px,4vw,50px)] font-semibold leading-[1.15] tracking-[-0.02em]"
            >
              {title}
            </h2>
            <p className="mt-4 max-w-[580px] text-[14.5px] leading-[1.9] text-muted sm:text-[15px]">
              {desc}
            </p>
          </div>

          <div className="flex justify-end lg:flex-none lg:pb-1">
            <Link href={`/${locale}/news/`} className="u-link">
              {allLabel} <span className="text-faint">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* full-bleed track: the first card lines up with the container, then bleeds to the edge */}
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={title}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
          e.preventDefault()
          scrollByCard(e.key === 'ArrowLeft' ? -1 : 1)
        }}
        className="news-track mx-auto mt-9 flex w-full max-w-[1920px] snap-x snap-mandatory items-stretch gap-4 overflow-x-auto overscroll-x-contain py-2 sm:gap-5 lg:mt-10 xl:gap-6"
      >
        {items.map((item, i) => (
          <NewsCard key={item.slug} item={item} index={i} locale={locale} readMore={readMore} />
        ))}
      </div>

      <div className="u-container">
        <div className="mt-8 flex items-center gap-4 sm:gap-6 lg:mt-10">
          <span className="u-mono shrink-0 whitespace-nowrap text-[10px] tracking-[0.12em] text-faint">
            <b className="text-[13px] font-medium text-ink">{pad(leading + 1)}</b>
            <span className="mx-1">/</span>
            {pad(total)}
          </span>

          <div className="relative h-px flex-1 bg-line2" aria-hidden="true">
            <span
              className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-200 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>


          <div className="ml-auto flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={atStart}
              aria-label={prevLabel}
              className="grid h-10 w-10 place-items-center border border-line2 text-[13px] leading-none text-ink transition-colors hover:border-inv hover:bg-inv hover:text-invt disabled:cursor-default disabled:border-line disabled:text-faint disabled:hover:bg-transparent disabled:hover:text-faint sm:h-11 sm:w-11"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              disabled={atEnd}
              aria-label={nextLabel}
              className="grid h-10 w-10 place-items-center border border-line2 text-[13px] leading-none text-ink transition-colors hover:border-inv hover:bg-inv hover:text-invt disabled:cursor-default disabled:border-line disabled:text-faint disabled:hover:bg-transparent disabled:hover:text-faint sm:h-11 sm:w-11"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
