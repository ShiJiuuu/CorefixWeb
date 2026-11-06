'use client'

import { useEffect, useState } from 'react'

/**
 * Looping hero background film. Muted and inline so mobile browsers are allowed to
 * autoplay; when the visitor asks for reduced motion we fall back to a still frame.
 */
export default function HeroVideo() {
  const [reduce, setReduce] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduce(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  if (reduce) {
    return (
      <img
        src="/media/hero-poster.jpg"
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover"
      />
    )
  }

  return (
    <video
      className="h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster="/media/hero-poster.jpg"
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src="/media/hero.mp4" type="video/mp4" />
    </video>
  )
}
