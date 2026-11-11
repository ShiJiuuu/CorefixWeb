import type { Metadata } from 'next'
import { locales, type Locale } from './i18n'

/** hreflang values must be BCP-47, not the route codes. */
export const hreflang: Record<Locale, string> = {
  'zh-cn': 'zh-CN',
  'zh-tw': 'zh-TW',
  en: 'en',
}

/**
 * Origin used for canonical / Open Graph / sitemap URLs.
 * Set NEXT_PUBLIC_SITE_URL at build time (e.g. https://www.example.com); when it is
 * empty the site keeps emitting root-relative URLs, which is only correct for a
 * single-origin deployment that never moves.
 */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '')

/** Make a root-relative path absolute when an origin is configured. */
export function absolute(path: string): string {
  return siteUrl ? `${siteUrl}${path}` : path
}

/** Normalise '/capability' | 'capability/' | '/' to '/capability/'. */
export function normalizePath(path = '/'): string {
  const trimmed = path.replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : '/'
}

/**
 * Canonical + hreflang for one route in one locale. The path is locale-less, so the
 * same call yields /zh-cn/capability/ and /en/capability/ with matching alternates.
 */
export function languageAlternates(path = '/'): Record<string, string> {
  const p = normalizePath(path)
  const languages: Record<string, string> = {}
  for (const l of locales) languages[hreflang[l]] = absolute(`/${l}${p}`)
  return languages
}

export function alternates(locale: Locale, path = '/') {
  return { canonical: absolute(`/${locale}${normalizePath(path)}`), languages: languageAlternates(path) }
}

/**
 * Company name used in tab titles and share cards. It has to follow the locale:
 * an English page titled with Chinese characters reads as a broken page in search
 * results and social cards.
 */
export const SITE_TITLES: Record<Locale, string> = {
  'zh-cn': '上海集培优信息科技有限公司',
  'zh-tw': '上海集培優信息科技有限公司',
  en: 'COREFIX PRO',
}

export const siteTitle = (locale: Locale) => SITE_TITLES[locale]

/** Default for the non-localised entry points (the `/` hand-off and the 404). */
export const SITE_TITLE = SITE_TITLES['zh-cn']

/** Shared per-page metadata so every route ships canonical, hreflang and Open Graph. */
export function pageMetadata({
  locale,
  path = '/',
  description,
  title,
}: {
  locale: Locale
  path?: string
  description: string
  /** Defaults to the locale's company name; case/news pages pass their own headline. */
  title?: string
}): Metadata {
  const resolved = title ?? siteTitle(locale)
  return {
    title: resolved,
    description,
    alternates: alternates(locale, path),
    openGraph: {
      title: resolved,
      siteName: siteTitle(locale),
      description,
      url: absolute(`/${locale}${normalizePath(path)}`),
      locale: hreflang[locale],
      type: 'website',
    },
  }
}

export const routes = ['/', '/capability/', '/network/', '/cases/', '/about/'] as const
