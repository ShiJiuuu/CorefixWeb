/**
 * Build homepage news covers.
 *
 * The news posts live as Markdown in content/news/, with the cover being either
 * an explicit `cover:` front-matter path or the first image in the body. Those
 * original images are the full-size WeChat exports (some > 1 MB), which is far
 * too heavy for a homepage carousel; this script crops them to a 4:3 card cover
 * (900 × 675 WebP) under public/news-covers/.
 *
 * Run automatically before `dev` and `build` (see package.json). Safe to run
 * repeatedly: files are only rebuilt when the Markdown or source image changed.
 *
 *   node scripts/build-news-covers.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const MD_DIR = path.join(ROOT, 'content', 'news')
const OUT_DIR = path.join(ROOT, 'public', 'news-covers')
const W = 900
const H = 675

const FIRST_IMAGE = /!\[[^\]]*\]\(\s*<?([^)\s>]+)[^)]*\)/i
const HTML_IMAGE = /<img[^>]+src=["']([^"']+)["']/i

function frontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return {}
  const meta = {}
  for (const line of match[1].split(/\r?\n/)) {
    const at = line.indexOf(':')
    if (at === -1) continue
    const key = line.slice(0, at).trim()
    let value = line.slice(at + 1).trim()
    if (value.startsWith('"')) {
      try {
        value = JSON.parse(value)
      } catch {}
    }
    meta[key] = value
  }
  return { meta, body: raw.slice(match[0].length) }
}

function coverOf(meta, body) {
  const declared = (meta.cover || '').trim()
  if (declared) return declared
  const md = body.match(FIRST_IMAGE)
  if (md) return md[1]
  const html = body.match(HTML_IMAGE)
  if (html) return html[1]
  return ''
}

let sharp
try {
  ;({ default: sharp } = await import('sharp'))
} catch {
  console.warn('[covers] sharp is unavailable — homepage will fall back to the original images.')
  process.exit(0)
}

if (!fs.existsSync(MD_DIR)) {
  console.warn('[covers] content/news not found; nothing to do.')
  process.exit(0)
}
fs.mkdirSync(OUT_DIR, { recursive: true })

const files = fs.readdirSync(MD_DIR).filter((f) => f.endsWith('.md'))
let built = 0
let skipped = 0
let missing = 0

for (const file of files) {
  const mdPath = path.join(MD_DIR, file)
  const raw = fs.readFileSync(mdPath, 'utf8')
  const { meta, body } = frontMatter(raw)
  const slug = (meta.slug || path.basename(file, '.md')).trim()
  const cover = coverOf(meta, body)

  if (!cover || /^(https?:)?\/\//i.test(cover) || cover.startsWith('data:')) {
    missing++
    continue
  }

  const srcPath = path.join(ROOT, 'public', cover.replace(/^\//, ''))
  if (!fs.existsSync(srcPath)) {
    console.warn(`[covers] missing source for ${slug}: ${cover}`)
    missing++
    continue
  }

  const outPath = path.join(OUT_DIR, `${slug}.webp`)
  const newest = Math.max(fs.statSync(srcPath).mtimeMs, fs.statSync(mdPath).mtimeMs)
  if (fs.existsSync(outPath) && fs.statSync(outPath).mtimeMs >= newest) {
    skipped++
    continue
  }

  try {
    await sharp(srcPath)
      .rotate()
      .resize(W, H, {
        fit: 'cover',
        position: (meta.coverPos || 'attention').trim(),
      })
      .webp({ quality: 80 })
      .toFile(outPath)
    built++
  } catch (err) {
    console.warn(`[covers] failed for ${slug}: ${err.message}`)
    missing++
  }
}

console.log(`[covers] ${built} built, ${skipped} up to date, ${missing} without a usable cover.`)
