'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import LocaleSwitch from './LocaleSwitch'
import ThemeToggle from './ThemeToggle'
import type { Locale } from '@/lib/i18n'
import type { Dict } from '@/content/types'

export default function Nav({ locale, dict }: { locale: Locale; dict: Dict }) {
  const pathname = usePathname() || ''
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Sub-paths count as active too: /zh-cn/cases/<slug>/ keeps 客户案例 underlined.
  const isActive = (href: string) => {
    const path = pathname.replace(/\/$/, '')
    return path === `/${locale}${href}` || path.startsWith(`/${locale}${href}/`)
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-bg/55 backdrop-blur-xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow] duration-300 supports-[backdrop-filter]:bg-bg/50 ${
        solid
          ? 'border-line2 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.45)]'
          : 'border-line'
      }`}
    >
      <div className="u-container flex h-[var(--dock-h)] items-center gap-4 xl:gap-6">
        <Link href={`/${locale}/`} className="mr-auto flex shrink-0 items-center gap-2.5" aria-label="集培优 COREFIX PRO">
          <img
            src="/logo-corefix.png"
            alt="集培优 COREFIX PRO"
            width={231}
            height={231}
            className="h-10 w-10 shrink-0 object-contain"
          />
          <span className="text-[17px] font-semibold leading-none tracking-[0.08em]">集培优</span>
        </Link>

        <nav className="hidden min-w-0 items-center gap-5 text-[13.5px] lg:flex xl:gap-8">
          {dict.nav.links.map((l) => {
            const active = isActive(l.href)
            return (
              <Link
                key={l.href}
                href={`/${locale}${l.href}/`}
                className={`relative whitespace-nowrap py-2 transition-colors ${
                  active ? 'text-ink' : 'text-ink2 hover:text-ink'
                }`}
              >
                {l.label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-px w-full origin-left bg-ink transition-transform duration-300 ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </Link>
            )
          })}
        </nav>

        {/* hairline divider between the links and the controls */}
        <span aria-hidden="true" className="hidden h-5 w-px shrink-0 bg-line2 lg:block" />

        {/* top-right dock */}
        <div className="flex shrink-0 items-center gap-3">
          <ThemeToggle />
          <div className="hidden items-center md:flex">
            <LocaleSwitch locale={locale} />
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="menu"
            aria-expanded={open}
            className="grid h-9 w-9 place-items-center border border-line2 lg:hidden"
          >
            <span className="flex flex-col gap-[5px]">
              <span
                className={`block h-[1.5px] w-4 bg-ink transition-transform ${open ? 'translate-y-[6.5px] rotate-45' : ''}`}
              />
              <span className={`block h-[1.5px] w-4 bg-ink transition-opacity ${open ? 'opacity-0' : ''}`} />
              <span
                className={`block h-[1.5px] w-4 bg-ink transition-transform ${open ? '-translate-y-[6.5px] -rotate-45' : ''}`}
              />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-x-0 top-[var(--dock-h)] bottom-0 z-40 flex flex-col justify-between border-t border-line bg-bg px-5 py-8 lg:hidden">
          <nav className="flex flex-col">
            {dict.nav.links.map((l) => (
              <Link
                key={l.href}
                href={`/${locale}${l.href}/`}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-line py-5 text-[22px] font-semibold"
              >
                {l.label}
                <span className="u-mono text-[11px] text-faint">→</span>
              </Link>
            ))}
          </nav>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <LocaleSwitch locale={locale} placement="up" />
            </div>
            <a href={`tel:${dict.common.phone}`} className="u-mono text-[13px]">
              {dict.common.phone}
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
