'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const KEY = 'cf-theme'

/**
 * Theme button: a single black disc with a lime moon/sun — no track, no sliding.
 * Icon is driven by the `dark:` class on <html> so there is no post-hydration
 * flicker; React state only feeds `aria-checked`.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const pathname = usePathname()

  // Re-apply on mount and after every route change: navigating between locales re-renders the
  // root <html>, which drops the imperatively added `dark` class even though the choice is stored.
  useEffect(() => {
    let stored: string | null = null
    try {
      stored = localStorage.getItem(KEY)
    } catch {}
    if (stored !== 'dark' && stored !== 'light') {
      // No stored choice (e.g. ?theme=dark): mirror whatever the bootstrap script decided.
      setDark(document.documentElement.classList.contains('dark'))
      return
    }
    const isDark = stored === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    setDark(isDark)
  }, [pathname])

  function toggle() {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem(KEY, next ? 'dark' : 'light')
    } catch {}
    setDark(next)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Toggle color theme"
      onClick={toggle}
      className="group grid h-9 w-9 shrink-0 place-items-center rounded-full"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0a0a0a] transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-105 dark:ring-1 dark:ring-white/25">
        {/* moon — light mode */}
        <svg
          className="dark:hidden"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#A9CB39"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
        </svg>
        {/* sun — dark mode */}
        <svg
          className="hidden dark:block"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#A9CB39"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" />
        </svg>
      </span>
    </button>
  )
}
