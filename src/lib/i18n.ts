export const locales = ['zh-cn', 'zh-tw', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'zh-cn'

export const localeLabel: Record<Locale, string> = {
  'zh-cn': '简',
  'zh-tw': '繁',
  en: 'EN',
}

export function isLocale(v: string): v is Locale {
  return (locales as readonly string[]).includes(v)
}

/** Rewrite a path for another locale, keeping the sub-path. */
export function switchLocalePath(pathname: string, next: Locale): string {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return `/${next}/`
  parts[0] = next
  return `/${parts.join('/')}/`
}
