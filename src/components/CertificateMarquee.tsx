import type { Locale } from '@/lib/i18n'

type Lang = 'CN' | 'EN'

type Cert = {
  id: string
  name: Record<Locale, string>
}

/** The three systems in /public/iso-certification, each issued in a Chinese and an English version. */
const CERTS: Cert[] = [
  {
    id: 'QMS',
    name: {
      'zh-cn': '质量管理体系认证证书',
      'zh-tw': '品質管理系統認證證書',
      en: 'Quality Management System Certificate',
    },
  },
  {
    id: 'ITSMS',
    name: {
      'zh-cn': '信息技术服务管理体系认证证书',
      'zh-tw': '資訊技術服務管理系統認證證書',
      en: 'Information Technology Service Management System Certificate',
    },
  },
  {
    id: 'ISMS',
    name: {
      'zh-cn': '信息安全管理体系认证证书',
      'zh-tw': '資訊安全管理系統認證證書',
      en: 'Information Security Management System Certificate',
    },
  },
]

/**
 * One endless row of certificate scans. The list is rendered twice and the
 * track slides by exactly half its width, so the loop has no visible seam.
 * The animation is pure CSS: it starts with the page and keeps running while
 * the section is still off-screen (and it never pauses on hover). The row sits
 * inside the page container and is masked at both ends, so cards fade out
 * instead of being cut off at the edges.
 */
export default function CertificateMarquee({ locale, label }: { locale: Locale; label: string }) {
  const langs: Lang[] = locale === 'en' ? ['EN', 'CN'] : ['CN', 'EN']
  const slides = langs.flatMap((lang) =>
    CERTS.map((cert) => ({
      key: `${cert.id}-${lang}`,
      src: `/iso-certification/opt/${cert.id}-${lang}.webp`,
      alt: `${cert.name[locale]} (${lang})`,
    })),
  )

  const fade =
    'linear-gradient(to right, transparent 0, #000 clamp(28px, 6vw, 88px), #000 calc(100% - clamp(28px, 6vw, 88px)), transparent 100%)'

  return (
    <div
      className="overflow-hidden"
      style={{ maskImage: fade, WebkitMaskImage: fade }}
      role="group"
      aria-label={label}
    >
      <div className="flex w-max [animation:cf-marquee_30s_linear_infinite] motion-reduce:[animation:none]">
        {[...slides, ...slides].map((slide, i) => (
          <img
            key={`${slide.key}-${i}`}
            src={slide.src}
            alt={i < slides.length ? slide.alt : ''}
            aria-hidden={i < slides.length ? undefined : true}
            width={760}
            height={1075}
            loading="lazy"
            decoding="async"
            className="mr-3 h-[225px] w-auto shrink-0 border border-line bg-white sm:mr-[18px] sm:h-[270px] lg:h-[315px]"
          />
        ))}
      </div>
    </div>
  )
}
