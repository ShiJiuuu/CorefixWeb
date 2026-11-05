'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { localeLabel, locales, switchLocalePath, type Locale } from '@/lib/i18n'

export default function LocaleSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}/`

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-line2 p-0.5">
      {locales.map((l) => {
        const active = l === locale
        return (
          <Link
            key={l}
            href={switchLocalePath(pathname, l)}
            hrefLang={l}
            aria-current={active ? 'true' : undefined}
            className={`u-mono grid h-7 w-8 place-items-center rounded-full text-[10px] tracking-[0.06em] transition-colors ${
              active ? 'bg-ink text-invt' : 'text-muted hover:text-ink'
            }`}
          >
            {localeLabel[l]}
          </Link>
        )
      })}
    </div>
  )
}
