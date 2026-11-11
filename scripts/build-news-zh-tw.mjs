/**
 * Generates the Traditional Chinese edition of every news article with OpenCC
 * (cn → twp), so `content/news/zh-tw/` never drifts from the Simplified source.
 *
 * Front matter keys (slug / date / category / source / cover / readTime) are
 * copied verbatim; only `title` and the body are converted.
 *
 *   node scripts/build-news-zh-tw.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import OpenCC from 'opencc-js'

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'content', 'news', 'zh-cn')
const OUT = path.join(ROOT, 'content', 'news', 'zh-tw')

const toTW = OpenCC.Converter({ from: 'cn', to: 'twp' })

fs.mkdirSync(OUT, { recursive: true })

for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith('.md'))) {
  const raw = fs.readFileSync(path.join(SRC, file), 'utf8')
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) throw new Error(`no front matter: ${file}`)

  const meta = match[1]
    .split(/\r?\n/)
    .map((line) => {
      const at = line.indexOf(':')
      if (at === -1) return line
      const key = line.slice(0, at).trim()
      const value = line.slice(at + 1).trim()
      if (key === 'title' && value.startsWith('"')) return `${key}: ${JSON.stringify(toTW(JSON.parse(value)))}`
      return line
    })
    .join('\n')

  const body = toTW(raw.slice(match[0].length))
  fs.writeFileSync(path.join(OUT, file), `---\n${meta}\n---\n${body}`, 'utf8')
}

console.log(`zh-tw: ${fs.readdirSync(OUT).length} articles`)
