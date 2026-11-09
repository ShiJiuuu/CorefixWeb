'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { localeLabel, locales, switchLocalePath, type Locale } from '@/lib/i18n'

/** Language names are written in their own language, not translated. */
const fullLabel: Record<Locale, string> = {
  'zh-cn': '简体中文',
  'zh-tw': '繁體中文',
  en: 'English',
}

/**
 * Globe button + dropdown. The trigger is icon-only so the dock stays compact;
 * the panel opens down by default and up when used at the bottom of the mobile menu.
 */
export default function LocaleSwitch({
  locale,
  placement = 'down',
}: {
  locale: Locale
  placement?: 'down' | 'up'
}) {
  const pathname = usePathname() || `/${locale}/`
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      trigger.current?.focus()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // Close when the route (and therefore the locale) changes.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Language"
        className={`grid h-9 w-9 place-items-center text-ink transition-opacity hover:opacity-60 ${
          open ? 'opacity-60' : ''
        }`}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3.6 9h16.8M3.6 15h16.8" />
          <path d="M12 3c2.4 2.7 3.6 5.8 3.6 9s-1.2 6.3-3.6 9c-2.4-2.7-3.6-5.8-3.6-9S9.6 5.7 12 3Z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Language"
          className={`absolute right-0 z-50 w-44 border border-line2 bg-bg p-1 shadow-[0_20px_44px_-26px_rgba(0,0,0,0.5)] ${
            placement === 'up' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'
          }`}
          style={{ animation: 'cf-pop .16s ease-out both' }}
        >
          {locales.map((l) => {
            const active = l === locale
            return (
              <Link
                key={l}
                href={switchLocalePath(pathname, l)}
                hrefLang={l}
                role="menuitem"
                aria-current={active ? 'true' : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between gap-4 px-3 py-2 text-[12.5px] transition-colors hover:bg-bg2 ${
                  active ? 'font-semibold text-ink' : 'text-muted'
                }`}
              >
                <span>{fullLabel[l]}</span>
                {active ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#A9CB39"
                    strokeWidth="2.4"
                    aria-hidden="true"
                  >
                    <path d="M4 12.5 9.5 18 20 6.5" />
                  </svg>
                ) : (
                  <span className="u-mono text-[9.5px] tracking-[0.06em] text-faint">
                    {localeLabel[l]}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
