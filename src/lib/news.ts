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
  /** Card cover: an explicit front-matter `cover:` path, or the first image in the body. */
  cover: string
  /** Whole minutes, estimated from the body when `readTime:` is absent. */
  readTime: number
  html: string
}

const DIR = path.join(process.cwd(), 'content', 'news')
const COVER_DIR = path.join(process.cwd(), 'public', 'news-covers')

const MD_IMAGE = /!\[[^\]]*\]\(\s*<?([^)\s>]+)[^)]*\)/i
const HTML_IMAGE = /<img[^>]+src=["']([^"']+)["']/i

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

/** Front matter wins; otherwise the first image the author put in the body. */
function coverOf(meta: Record<string, string>, body: string) {
  const declared = (meta.cover || '').trim()
  if (declared) return declared
  const md = body.match(MD_IMAGE)
  if (md) return md[1]
  const html = body.match(HTML_IMAGE)
  if (html) return html[1]
  return ''
}

/**
 * A cover large enough for the 900 × 675 card, built by scripts/build-news-covers.mjs.
 * Falls back to the original image when the thumbnail pipeline has not run.
 */
function cardCover(slug: string, cover: string) {
  if (!cover || /^(https?:)?\/\//i.test(cover) || cover.startsWith('data:')) return cover
  return fs.existsSync(path.join(COVER_DIR, `${slug}.webp`)) ? `/news-covers/${slug}.webp` : cover
}

/** Chinese prose reads at roughly 380 characters a minute; count both scripts. */
function estimateReadTime(body: string) {
  const text = body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|~-]/g, ' ')
  const cjk = (text.match(/[\u3400-\u9fff]/g) || []).length
  const words = (text.match(/[A-Za-z0-9]+/g) || []).length
  return Math.max(2, Math.round(cjk / 380 + words / 220))
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
      const declaredRead = Number.parseInt(meta.readTime || '', 10)
      const cover = coverOf(meta, body)
      return {
        slug: meta.slug,
        title: meta.title,
        date: meta.date,
        category: meta.category as NewsCategory,
        source: meta.source ?? '',
        excerpt: excerptOf(body),
        cover: cardCover(meta.slug, cover),
        readTime: Number.isFinite(declaredRead) && declaredRead > 0 ? declaredRead : estimateReadTime(body),
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
