/**
 * One-off importer for the WeChat account archive.
 *
 * Reads the source folder of Markdown exports, downloads every remote image into
 * public/news/<slug>/, strips the WeChat header block (source / publish time /
 * original link) and writes a clean file with front matter into content/news/.
 *
 * Run: node scripts/import-wechat.mjs [sourceDir]
 */
import fs from 'node:fs'
import path from 'node:path'

const SRC = process.argv[2] || 'C:/Users/admin/Desktop/newrepo/公众号'
const OUT_MD = path.join(process.cwd(), 'content', 'news')
const OUT_IMG = path.join(process.cwd(), 'public', 'news')

const MANIFEST = [
  { match: '中国算力守护者', slug: 'china-compute-guardian', category: 'company' },
  { match: '维保中心盛大开业', slug: 'lingang-center-opening', category: 'company' },
  { match: 'WAIC', slug: 'waic-2026', category: 'company' },
  { match: '序言', slug: 'gpu-series-preface', category: 'tech' },
  { match: '第1讲', slug: 'gpu-series-01', category: 'tech' },
  { match: '第2讲', slug: 'gpu-series-02', category: 'tech' },
  { match: '第3讲', slug: 'gpu-series-03', category: 'tech' },
  { match: '第5讲', slug: 'gpu-series-05', category: 'tech' },
  { match: '认知篇', slug: 'ecc-repairable', category: 'tech' },
  { match: '疑难故障全解', slug: 'gpu-troubleshooting', category: 'guide' },
  { match: 'AI训练效率', slug: 'ai-training-efficiency', category: 'industry' },
  { match: '维修全流程揭秘', slug: 'repair-workflow', category: 'service' },
  { match: '单点故障维修案例', slug: 'single-point-failure', category: 'case' },
  { match: '机房漏水', slug: 'h200-water-damage', category: 'case' },
  { match: '四级故障分级响应', slug: 'four-level-response', category: 'service' },
  { match: '驻场运维实战案例', slug: 'onsite-ops-case', category: 'case' },
]

const EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

async function download(url, dest) {
  if (fs.existsSync(dest)) return
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const type = (res.headers.get('content-type') || '').split(';')[0].trim()
  const ext = EXT[type]
  if (!ext) throw new Error(`Unsupported image type ${type}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const finalDest = dest.replace(/\.bin$/, `.${ext}`)
  fs.writeFileSync(finalDest, buf)
  return `.${ext}`
}

function stripHeader(raw) {
  const titleLine = raw.match(/^#\s+(.+)$/m)
  if (!titleLine) throw new Error('no title line')
  const title = titleLine[1].trim()
  const rest = raw.slice(titleLine.index + titleLine[0].length)
  const lines = rest.split(/\r?\n/)

  let i = 0
  while (i < lines.length && lines[i].trim() === '') i++
  while (i < lines.length && lines[i].startsWith('>')) i++
  while (i < lines.length && lines[i].trim() === '') i++
  if (lines[i] && lines[i].trim() === '---') i++
  while (i < lines.length && lines[i].trim() === '') i++

  return { title, body: lines.slice(i).join('\n').trim() }
}

const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.md'))
fs.mkdirSync(OUT_MD, { recursive: true })

let total = 0
for (const file of files) {
  const entry = MANIFEST.find((m) => file.includes(m.match))
  if (!entry) {
    console.warn('skip (no manifest entry):', file)
    continue
  }

  const raw = fs.readFileSync(path.join(SRC, file), 'utf8')
  const { title, body } = stripHeader(raw)

  const dateMatch = raw.match(/发布时间\*{0,2}[：:]\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/)
  const sourceMatch = raw.match(/原文链接\*{0,2}[：:]\s*<?(https?:\/\/[^\s>]+)>?/)
  const date = dateMatch ? dateMatch[1] : '2026-01-01'
  const source = sourceMatch ? sourceMatch[1] : ''

  const dir = path.join(OUT_IMG, entry.slug)
  fs.mkdirSync(dir, { recursive: true })

  let out = body
  const images = [...body.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g)]
  let n = 0
  for (const m of images) {
    const [full, alt, url] = m
    n += 1
    const base = path.join(dir, `img-${String(n).padStart(2, '0')}.bin`)
    const ext = await download(url, base)
    if (!ext) {
      // already downloaded on a previous run — recover the extension from disk
      const existing = fs.readdirSync(dir).find((f) => f.startsWith(`img-${String(n).padStart(2, '0')}.`))
      if (!existing) throw new Error(`missing image ${n} for ${entry.slug}`)
      out = out.replace(full, `![${alt}](/news/${entry.slug}/${existing})`)
    } else {
      out = out.replace(full, `![${alt}](/news/${entry.slug}/img-${String(n).padStart(2, '0')}${ext})`)
    }
    total += 1
  }

  const front = [
    '---',
    `slug: ${JSON.stringify(entry.slug)}`,
    `title: ${JSON.stringify(title)}`,
    `date: ${JSON.stringify(date)}`,
    `category: ${JSON.stringify(entry.category)}`,
    `source: ${JSON.stringify(source)}`,
    '---',
    '',
  ].join('\n')

  fs.writeFileSync(path.join(OUT_MD, `${entry.slug}.md`), front + out + '\n', 'utf8')
  console.log(`${entry.slug.padEnd(24)} ${date}  ${images.length} img  ${title.slice(0, 30)}`)
}

console.log(`\ndone: ${files.length} files, ${total} images`)
