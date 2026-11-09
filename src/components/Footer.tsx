import type { Dict } from '@/content/types'
import SocialLinks from './SocialLinks'

export default function Footer({ dict }: { dict: Dict }) {
  return (
    <footer className="border-t border-black/10 bg-[linear-gradient(to_bottom,#47561b_0%,#2b3510_45%,#0a0a0a_100%)]">
      <div className="footer-green u-container flex flex-col gap-10 py-12 md:flex-row md:flex-wrap lg:flex-nowrap lg:gap-11">
        {/* brand + slogan + social */}
        <div className="md:w-full md:shrink-0 lg:w-auto lg:min-w-0 lg:flex-[1.5]">
          <div className="mb-5 flex items-center gap-2.5">
            <img
              src="/logo-corefix.png"
              alt="集培优 COREFIX PRO"
              width={231}
              height={231}
              className="h-9 w-9 shrink-0 object-contain"
            />
            <span className="text-[17px] font-semibold leading-none tracking-[0.08em]">集培优</span>
          </div>

          <p className="text-[18px] font-semibold leading-[1.5] tracking-[0.02em]">
            {dict.footer.slogan.zh}
          </p>
          <p className="u-mono mt-2 text-[10px] leading-[1.7] tracking-[0.12em] text-faint">
            {dict.footer.slogan.en}
          </p>

          <SocialLinks items={dict.footer.social} />
        </div>

        {/* contact — moved out of the brand column */}
        <div className="md:w-[calc(50%_-_1.25rem)] md:shrink-0 lg:w-auto lg:min-w-0 lg:flex-[1.5]">
          <p className="text-[16px] font-semibold leading-[1.5] text-ink">
            {dict.footer.company}
          </p>
          <p className="mt-4 text-[13.5px] font-semibold leading-[1.85] text-ink2">
            <span className="font-normal text-faint">{dict.footer.labels.address}</span>
            {dict.footer.address}
          </p>
          <p className="mt-1.5 text-[13.5px] leading-[1.85] text-ink2">
            <span className="font-normal text-faint">{dict.footer.labels.phone}</span>
            <a href={`tel:${dict.footer.phone}`} className="u-mono font-semibold hover:text-ink">
              {dict.footer.phone}
            </a>
          </p>
        </div>

        {dict.footer.cols.map((col) => (
          <div
            key={col.t}
            className="md:w-[calc(50%_-_1.25rem)] md:shrink-0 lg:w-auto lg:min-w-0 lg:flex-[0.95]"
          >
            <h4 className="u-label mb-4 font-medium">{col.t}</h4>
            <ul className="space-y-1 text-[13.5px] text-ink2">
              {col.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="u-container flex flex-col gap-2 border-t border-white/15 py-5 md:flex-row md:items-center md:justify-between">
        <p className="u-mono text-[10.5px] tracking-[0.04em] text-white/55">{dict.footer.copyright}</p>
        <p className="u-mono text-[10.5px] tracking-[0.04em] text-white/55">{dict.footer.icp}</p>
      </div>
    </footer>
  )
}
