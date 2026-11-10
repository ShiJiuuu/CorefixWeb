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
      className="group grid h-11 w-11 shrink-0 place-items-center rounded-full"
    >
      <span className="grid h-10 w-10 place-items-center text-muted transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-105 group-hover:text-ink">
        {/* sun — current theme is light */}
        <svg
          className="dark:hidden"
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4.4" />
          <path d="M12 2v3.3M12 18.7v3.3M2 12h3.3M18.7 12h3.3M4.6 4.6l2.3 2.3M17.1 17.1l2.3 2.3M19.4 4.6l-2.3 2.3M6.9 17.1l-2.3 2.3" />
        </svg>
        {/* moon — current theme is dark */}
        <svg
          className="hidden dark:block"
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
        </svg>
      </span>
    </button>
  )
}
