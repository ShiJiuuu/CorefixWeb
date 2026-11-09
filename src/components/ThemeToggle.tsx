'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const KEY = 'cf-theme'

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
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="group flex h-9 items-center gap-2 rounded-full bg-accent p-1 text-[#0a0a0a] transition-transform duration-300 hover:scale-[1.03] sm:pl-3 sm:pr-1"
    >
      <span className="u-mono hidden text-[9.5px] font-semibold tracking-[0.14em] sm:inline">
        {dark ? 'DARK' : 'LIGHT'}
      </span>
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0a0a0a]">
        {dark ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A9CB39" strokeWidth="1.8">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A9CB39" strokeWidth="1.8">
            <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
          </svg>
        )}
      </span>
    </button>
  )
}
