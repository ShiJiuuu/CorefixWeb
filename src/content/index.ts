import type { Dict } from './types'
import type { Locale } from '@/lib/i18n'
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

export type { Dict }
