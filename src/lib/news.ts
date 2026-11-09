import fs from 'node:fs'
import path from 'node:path'
import { marked } from 'marked'

export type NewsCategory = 'company' | 'tech' | 'guide' | 'industry' | 'service' | 'case'

export type NewsArticle = {
  slug: string
  title: string
  /** ISO date, e.g. 2026-06-16 */
  date: string
  category: NewsCategory
  /** Link back to the original WeChat post. */
  source: string
  excerpt: string
  html: string
}

const DIR = path.join(process.cwd(), 'content', 'news')

function parseFrontMatter(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) throw new Error('news: missing front matter')

  const meta: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const at = line.indexOf(':')
    if (at === -1) continue
    const key = line.slice(0, at).trim()
    let value = line.slice(at + 1).trim()
    if (value.startsWith('"')) value = JSON.parse(value)
    meta[key] = value
  }

  return { meta, body: raw.slice(match[0].length).trim() }
}

/** First real paragraph, used as the summary on the index and in the meta description. */
function excerptOf(body: string) {
  for (const block of body.split(/\n{2,}/)) {
    let text = block.trim()
    if (!text || /^(#|\||```|!\[|---)/.test(text)) continue
    // blockquotes are allowed as a fallback: image-only posts lead with a note
    text = text.replace(/^>\s?/gm, '').trim()
    if (!text || /^(#|\||```|!\[|---)/.test(text)) continue

    const plain = text
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*_`>#]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (plain.length >= 40) return plain.length > 108 ? `${plain.slice(0, 108)}…` : plain
  }
  return ''
}

let cache: NewsArticle[] | null = null

/** All articles, newest first. Read once per build from content/news/*.md. */
export function getAllNews(): NewsArticle[] {
  if (cache) return cache

  cache = fs
    .readdirSync(DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(DIR, file), 'utf8')
      const { meta, body } = parseFrontMatter(raw)
      return {
        slug: meta.slug,
        title: meta.title,
        date: meta.date,
        category: meta.category as NewsCategory,
        source: meta.source ?? '',
        excerpt: excerptOf(body),
        html: marked.parse(body, { gfm: true, async: false }) as string,
      }
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  return cache
}

export function getNewsSlugs() {
  return getAllNews().map((a) => a.slug)
}

export function getNews(slug: string) {
  return getAllNews().find((a) => a.slug === slug)
}

/** 2026-06-16 → 2026.06.16 */
export function formatNewsDate(date: string) {
  return date.replace(/-/g, '.')
}
