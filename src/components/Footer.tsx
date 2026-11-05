import Link from 'next/link'
import type { Locale } from '@/lib/i18n'
import type { Dict } from '@/content/types'

export default function Footer({ locale, dict }: { locale: Locale; dict: Dict }) {
  return (
    <footer className="border-t border-line2">
      <div className="u-container grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr_1.2fr] lg:gap-11">
        <div>
          <div className="mb-5 flex items-center gap-2.5">
            <img
              src="/logo-corefix.png"
              alt="集培优 COREFIX PRO"
              width={231}
              height={231}
              className="h-9 w-9 shrink-0 object-contain"
            />
            <span className="flex flex-col leading-none">
              <span className="text-[17px] font-semibold tracking-[0.08em]">集培优</span>
              <span className="u-mono mt-1 text-[8px] tracking-[0.22em] text-faint">COREFIX PRO</span>
            </span>
          </div>
          <div className="space-y-1 text-[13px] leading-[2.1] text-muted">
            {dict.footer.address.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p>
              <a href={`tel:${dict.footer.phone}`} className="u-mono hover:text-ink">
                {dict.footer.phone}
              </a>
            </p>
          </div>
        </div>

        {dict.footer.cols.map((col) => (
          <div key={col.t}>
            <h4 className="u-label mb-4 font-medium">{col.t}</h4>
            <ul className="space-y-1 text-[13.5px] text-ink2">
              {col.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="u-container flex flex-col gap-2 border-t border-line py-5 md:flex-row md:items-center md:justify-between">
        <p className="u-mono text-[10.5px] tracking-[0.04em] text-faint">{dict.footer.copyright}</p>
        <p className="u-mono text-[10.5px] tracking-[0.04em] text-faint">{dict.footer.icp}</p>
      </div>

      <div className="u-container flex items-center justify-between pb-6">
        <Link href={`/${locale}/`} className="u-mono text-[10px] tracking-[0.16em] text-faint hover:text-ink">
          ← {dict.common.back}
        </Link>
        <span className="u-mono text-[10px] tracking-[0.16em] text-faint">SHANGHAI · CHINA</span>
      </div>
    </footer>
  )
}
