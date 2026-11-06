import type { Dict } from './types'
import { locales, type Locale } from '@/lib/i18n'
import { zhCN } from './zh-cn'
import { zhTW } from './zh-tw'
import { en } from './en'

export const dictionaries: Record<Locale, Dict> = {
  'zh-cn': zhCN,
  'zh-tw': zhTW,
  en,
}

export function getDict(locale: string): Dict {
  return dictionaries[locale as Locale] ?? zhCN
}

/** zh-cn is the source of truth for case slugs; every other locale must match it exactly. */
export const caseSlugs = zhCN.cases.items.map((c) => c.slug)

const signature = (items: { slug: string }[]) =>
  items
    .map((i) => i.slug)
    .sort()
    .join('|')

const expected = signature(zhCN.cases.items)
const drifted = locales.filter((l) => signature(dictionaries[l].cases.items) !== expected)

if (drifted.length) {
  throw new Error(
    `[content] case slugs differ from zh-cn in: ${drifted.join(', ')}. ` +
      `Every locale must define the same slugs (${expected}).`,
  )
}

export type { Dict }
