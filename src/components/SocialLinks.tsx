'use client'

import { useEffect, useState } from 'react'
import type { SocialLink } from '@/content/types'
import SocialIcon from './SocialIcons'

/**
 * Footer platform buttons: each one opens its QR code / contact card in a lightbox.
 * Images live in public/social and are referenced from the dictionary.
 */
export default function SocialLinks({ items }: { items: SocialLink[] }) {
  const [open, setOpen] = useState<SocialLink | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <>
      <div className="flex items-center gap-2 pt-4">
        {items.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setOpen(s)}
            title={s.label}
            aria-label={s.label}
            aria-haspopup="dialog"
            className="grid h-8 w-8 place-items-center rounded-full border border-line2 text-ink2 transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-invt"
          >
            <SocialIcon id={s.id} />
          </button>
        ))}
      </div>

      {open && (
        <div
          role="presentation"
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={open.label}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[340px] overflow-hidden rounded-2xl border border-line2 bg-bg shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="u-label">{open.label}</p>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Close"
                autoFocus
                className="u-mono -mr-1 grid h-7 w-7 place-items-center rounded-full text-[16px] leading-none text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <img
                src={open.image}
                alt={open.label}
                className="mx-auto block max-h-[64vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
