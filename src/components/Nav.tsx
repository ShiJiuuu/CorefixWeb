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

  const isActive = (href: string) => pathname.replace(/\/$/, '').endsWith(href)

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-bg/85 backdrop-blur-md transition-colors duration-300 ${
        solid ? 'border-line2' : 'border-line'
      }`}
    >
      <div className="u-container flex h-[84px] items-center justify-between gap-4 xl:gap-6">
        <Link href={`/${locale}/`} className="flex shrink-0 items-center gap-2.5" aria-label="集培优 COREFIX PRO">
          <img
            src="/logo-corefix.png"
            alt="集培优 COREFIX PRO"
            width={231}
            height={231}
            className="h-10 w-10 shrink-0 object-contain"
          />
          <span className="flex flex-col leading-none">
            <span className="text-[17px] font-semibold tracking-[0.08em]">集培优</span>
            <span className="u-mono mt-1 text-[8px] tracking-[0.22em] text-faint">COREFIX PRO</span>
          </span>
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

        {/* top-right dock */}
        <div className="flex shrink-0 items-center gap-3">
          <a
            href={`tel:${dict.common.phone}`}
            className="u-mono hidden whitespace-nowrap text-[12.5px] tracking-[0.02em] xl:block"
          >
            {dict.common.phone}
          </a>
          <div className="hidden items-center gap-2.5 md:flex">
            <LocaleSwitch locale={locale} />
          </div>
          <ThemeToggle />
          <Link
            href={`/${locale}/#contact`}
            className="hidden h-9 items-center border border-line2 px-4 text-[12.5px] font-semibold transition-colors hover:bg-ink hover:text-invt md:flex"
          >
            {dict.nav.cta}
          </Link>
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
        <div className="fixed inset-x-0 top-[84px] bottom-0 z-40 flex flex-col justify-between border-t border-line bg-bg px-5 py-8 lg:hidden">
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
            <Link
              href={`/${locale}/#contact`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-b border-line py-5 text-[22px] font-semibold"
            >
              {dict.nav.cta}
              <span className="u-mono text-[11px] text-faint">→</span>
            </Link>
          </nav>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <LocaleSwitch locale={locale} />
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
