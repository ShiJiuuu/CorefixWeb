'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

function animateCount(el: HTMLElement) {
  const raw = el.dataset.count || el.textContent || ''
  const m = raw.match(/^(\D*)([\d.]+)([\s\S]*)$/)
  if (!m) return
  const [, pre, numStr, suf] = m
  const target = parseFloat(numStr)
  const dec = (numStr.split('.')[1] || '').length
  const obj = { v: 0 }
  el.textContent = `${pre}${(0).toFixed(dec)}${suf}`
  gsap.to(obj, {
    v: target,
    duration: 1.5,
    ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    onUpdate: () => {
      el.textContent = `${pre}${obj.v.toFixed(dec)}${suf}`
    },
  })
}

export default function ScrollEffects() {
  const pathname = usePathname()

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let lenis: Lenis | null = null
    let raf: ((t: number) => void) | null = null

    if (!reduce) {
      lenis = new Lenis({ duration: 1.05, smoothWheel: true, touchMultiplier: 1.6 })
      lenis.on('scroll', ScrollTrigger.update)
      raf = (time: number) => lenis?.raf(time * 1000)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
    }

    const ctx = gsap.context(() => {
      // hero intro
      const lines = gsap.utils.toArray<HTMLElement>('[data-hero-line]')
      const fades = gsap.utils.toArray<HTMLElement>('[data-hero-fade]')
      if (lines.length) {
        if (reduce) {
          gsap.set(lines, { yPercent: 0 })
          gsap.set(fades, { opacity: 1, y: 0 })
        } else {
          gsap.set(lines, { yPercent: 115 })
          gsap.set(fades, { opacity: 0, y: 18 })
          const tl = gsap.timeline({ delay: 0.12 })
          tl.to(lines, { yPercent: 0, duration: 1.05, stagger: 0.08, ease: 'power3.out' }).to(
            fades,
            { opacity: 1, y: 0, duration: 0.85, stagger: 0.07, ease: 'power2.out' },
            0.35,
          )
        }
      }

      // scroll reveals
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        if (reduce) {
          gsap.set(el, { opacity: 1, y: 0 })
          return
        }
        const delay = parseFloat(el.dataset.reveal || '0')
        gsap.fromTo(
          el,
          { y: 26, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            delay,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          },
        )
      })

      // counters
      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        if (reduce) return
        animateCount(el)
      })

      // process / progress lines
      gsap.utils.toArray<HTMLElement>('[data-line]').forEach((el) => {
        if (reduce) {
          gsap.set(el, { scaleX: 1 })
          return
        }
        gsap.fromTo(
          el,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: { trigger: el.parentElement, start: 'top 85%', end: 'bottom 60%', scrub: true },
          },
        )
      })
    })

    // in-page anchors
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest('a')
      if (!a) return
      const href = a.getAttribute('href') || ''
      if (!href.startsWith('#') || href.length < 2) return
      const target = document.querySelector(href)
      if (!target) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(target as HTMLElement, { offset: -84 })
      else (target as HTMLElement).scrollIntoView({ behavior: 'smooth' })
    }
    document.addEventListener('click', onClick)

    const t = window.setTimeout(() => ScrollTrigger.refresh(), 320)
    window.addEventListener('load', () => ScrollTrigger.refresh())

    return () => {
      window.clearTimeout(t)
      document.removeEventListener('click', onClick)
      ctx.revert()
      if (raf) gsap.ticker.remove(raf)
      lenis?.destroy()
    }
  }, [pathname])

  return null
}
