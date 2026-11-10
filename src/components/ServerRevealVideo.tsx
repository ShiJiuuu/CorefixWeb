'use client'

import { useEffect, useRef } from 'react'

/**
 * B300-3D演示模组 —— 首页 Hero 的全幅背景影片。
 *
 * Muted + inline so mobile browsers allow autoplay. The reveal plays once per entry and
 * holds the exploded frame; with `prefers-reduced-motion` it jumps straight to that frame.
 */
export default function ServerRevealVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')

    const holdLastFrame = () => {
      video.pause()
      const end = Number.isFinite(video.duration) ? Math.max(0, video.duration - 0.08) : 4.9
      video.currentTime = end
    }

    const replay = () => {
      if (video.ended || video.currentTime > 0.05) video.currentTime = 0
      void video.play().catch(() => {})
    }

    const sync = () => {
      if (reduce.matches) holdLastFrame()
      else replay()
    }

    const onMeta = () => {
      if (reduce.matches) holdLastFrame()
    }

    video.addEventListener('loadedmetadata', onMeta)
    reduce.addEventListener('change', sync)
    sync()

    const io = new IntersectionObserver(
      ([entry]) => {
        if (reduce.matches) return
        if (!entry.isIntersecting) return video.pause()
        if (video.ended) video.currentTime = 0
        void video.play().catch(() => {})
      },
      { threshold: 0.15 },
    )
    io.observe(video)

    return () => {
      video.removeEventListener('loadedmetadata', onMeta)
      reduce.removeEventListener('change', sync)
      io.disconnect()
    }
  }, [])

  return (
    <video
      ref={videoRef}
      className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      autoPlay
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src="/media/ServerReveal.mp4" type="video/mp4" />
    </video>
  )
}
