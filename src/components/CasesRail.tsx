'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { CaseItem } from '@/content/types'

export default function CasesRail({
  items,
  hint,
  all,
  href,
}: {
  items: CaseItem[]
  hint: string
  all: string
  href: string
}) {
  const section = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const mm = gsap.matchMedia()
    mm.add('(min-width: 1024px)', () => {
      const el = section.current
      const tr = track.current
      if (!el || !tr) return
      const dist = () => Math.max(0, tr.scrollWidth - window.innerWidth + 120)
      const tween = gsap.to(tr, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: () => `+=${dist() + 240}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
        gsap.set(tr, { x: 0 })
      }
    })
    return () => mm.revert()
  }, [])

  return (
    <div
      ref={section}
      className="relative flex flex-col justify-center overflow-hidden border-b border-line2 bg-bg py-12 lg:h-[86vh] lg:py-0"
    >
      <div className="u-container w-full">
        <div className="mb-8 flex items-end justify-between gap-6 border-b border-line pb-4">
          <span className="u-mono text-[10.5px] tracking-[0.16em] text-faint">
            01 — {String(items.length).padStart(2, '0')}
          </span>
          <Link href={href} className="u-link">
            {all} <span className="text-faint">→</span>
          </Link>
        </div>
      </div>

      <div className="snap-x snap-mandatory overflow-x-auto pb-4 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
        <div ref={track} className="flex w-max will-change-transform">
          {items.map((c) => (
            <article
              key={c.k}
              className="w-[78vw] shrink-0 snap-start border-r border-line px-6 last:border-r-0 sm:w-[380px] lg:w-[380px] lg:px-7"
            >
              <p className="u-mono text-[10px] tracking-[0.14em] text-faint">{c.k}</p>
              <h3 className="mt-3.5 min-h-[88px] text-[18px] font-semibold leading-[1.5]">{c.h}</h3>
              <p className="min-h-[72px] text-[12.5px] leading-[1.85] text-muted">{c.p}</p>
              <p className="u-mono mt-6 text-[34px] font-semibold leading-none tracking-[-0.03em]">
                {c.b}
              </p>
              <p className="mt-2 text-[10.5px] tracking-[0.04em] text-faint">{c.c}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="u-container mt-4 flex items-center gap-4">
        <span className="u-mono text-[10px] tracking-[0.12em] text-faint">{hint}</span>
        <span className="relative h-px flex-1 bg-line2">
          <span className="absolute -top-[2px] left-[38%] h-[5px] w-16 bg-ink" />
        </span>
        <span className="u-mono text-[10px] tracking-[0.12em] text-faint">→</span>
      </div>
    </div>
  )
}
