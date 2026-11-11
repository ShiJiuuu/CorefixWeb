/**
 * Attaches a translated English body to the existing front matter.
 *
 * For every `content/news/en/_tmp-<slug>.body.md`:
 *   - slug / date / category / source are taken from the Simplified source
 *   - title / excerpt are taken from the English stub
 *   - the body replaces the file and `translated:` flips to true
 *
 *   node scripts/attach-en-body.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const ZH = path.join(ROOT, 'content', 'news', 'zh-cn')
const EN = path.join(ROOT, 'content', 'news', 'en')

const readMeta = (raw) => {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) throw new Error('missing front matter')
  const meta = {}
  for (const line of m[1].split(/\r?\n/)) {
    const at = line.indexOf(':')
    if (at === -1) continue
    meta[line.slice(0, at).trim()] = line.slice(at + 1).trim()
  }
  return { meta, body: raw.slice(m[0].length) }
}

const temps = fs.readdirSync(EN).filter((f) => f.startsWith('_tmp-') && f.endsWith('.body.md'))

for (const file of temps) {
  const slug = file.replace(/^_tmp-/, '').replace(/\.body\.md$/, '')
  const body = fs.readFileSync(path.join(EN, file), 'utf8').trim()

  const zh = readMeta(fs.readFileSync(path.join(ZH, `${slug}.md`), 'utf8')).meta
  const stubRaw = fs.readFileSync(path.join(EN, `${slug}.md`), 'utf8')
  const stub = readMeta(stubRaw).meta

  const front = [
    '---',
    `slug: ${zh.slug}`,
    `title: ${stub.title}`,
    `date: ${zh.date}`,
    `category: ${zh.category}`,
    `source: ${zh.source}`,
    `excerpt: ${stub.excerpt}`,
    'translated: true',
    '---',
    '',
  ].join('\n')

  fs.writeFileSync(path.join(EN, `${slug}.md`), `${front}${body}\n`, 'utf8')
  fs.unlinkSync(path.join(EN, file))
  console.log('attached', slug)
}

if (!temps.length) console.log('nothing to attach')
