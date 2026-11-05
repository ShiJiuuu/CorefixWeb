import type { MetadataRoute } from 'next'
import { locales } from '@/lib/i18n'
import { absolute, languageAlternates, normalizePath } from '@/lib/seo'

/** Same information architecture as the routes, so adding a locale cannot desync the sitemap. */
const routes = ['/', '/capability/', '/network/', '/cases/', '/about/'] as const

const priority: Record<string, number> = {
  '/': 1,
  '/capability/': 0.9,
  '/network/': 0.9,
  '/cases/': 0.8,
  '/about/': 0.7,
}

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((path) => {
    const p = normalizePath(path)
    return locales.map((locale) => ({
      url: absolute(`/${locale}${p}`),
      changeFrequency: (p === '/' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
      priority: priority[p] ?? 0.5,
      alternates: { languages: languageAlternates(p) },
    }))
  })
}
