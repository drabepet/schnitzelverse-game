// Builds an art brief for replacing the game's emoji with our own pictures: every emoji the game
// shows, what it stands for in the game, where it is used, and its current picture as a PNG.
//
//   node tools/emoji-brief.ts            # writes emoji-brief/ (git-ignored), open emoji-brief/index.html
//
// Pictures: png/game/ is the bundled emoji font (Noto, Apache 2.0); png/system/ is this computer's own
// emoji (Apple on a Mac), for reference only. Needs Chrome (Playwright's `chrome` channel) and python3.
import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { emojiIn } from '../src/emojiChars.ts'

const ROOT = join(import.meta.dirname, '..')
const OUT = join(ROOT, 'emoji-brief')
const SIZE = 512

type Use = { area: string; label: string; line: string; where: string }
type Entry = { seq: string; file: string; codepoints: string; uses: Use[]; core: boolean; start: boolean; order: number; name?: string; split?: boolean }

/** Files under content areas that are flavour rather than the screen the player works in. */
const FLAVOUR = /(badges|badgesExtra|badgeChecks|tales|story|changelog|Tales|Badge|Paprika|Finale|Moments|names)\b/
/** The game's main things (ingredients, kitchen steps, family, places, vehicles, farm): the first batch to draw. */
const START_AREAS = ['items', 'kitchen', 'staff', 'regions', 'fleet', 'farm', 'franchise']

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    if (e.isDirectory()) return sourceFiles(p)
    return /\.(ts|tsx)$/.test(e.name) && !/\.test\.ts$/.test(e.name) ? [p] : []
  })
}

function areaOf(file: string): string {
  const rel = relative(join(ROOT, 'src'), file).replace(/\.(ts|tsx)$/, '')
  if (rel.startsWith('ui/')) return `screen: ${rel.slice(3)}`
  return rel.replace(/^engine\/(data\/)?/, '')
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** What this occurrence names: the `name:` of its object, the tuple's title, or the words after it. */
function labelFor(lines: string[], i: number, seq: string): string {
  const line = lines[i]
  const tuple = line.match(new RegExp(`'${esc(seq)}\\uFE0F?',\\s*'([^']+)'`))
  if (tuple) return tuple[1]
  const sameLine = line.match(/\bname:\s*'([^']+)'/)
  if (sameLine) return sameLine[1]
  if (/\bemoji:\s*'/.test(line)) {
    for (let d = 1; d <= 4; d++) {
      for (const j of [i - d, i + d]) {
        const m = lines[j]?.match(/^\s*name:\s*'([^']+)'/)
        if (m) return m[1]
      }
    }
  }
  const after = line.match(new RegExp(`${esc(seq)}\\uFE0F?\\s+([A-Za-z0-9][^<>'"\`{}]{1,48})`))
  if (after) return after[1].trim()
  return ''
}

// 1. Every emoji (as the player sees it, joined sequences whole) and where it is used.
const graphemes = new Intl.Segmenter('en', { granularity: 'grapheme' })
const entries = new Map<string, Entry>()
for (const file of sourceFiles(join(ROOT, 'src'))) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return // comments are not on screen
    for (const { segment } of graphemes.segment(line)) {
      if (![...emojiIn(segment)].some((ch) => ch !== '️' && ch !== '‍')) continue
      const seq = segment.replace(/️/g, '')
      const codepoints = [...seq].map((c) => c.codePointAt(0)!.toString(16)).join('-')
      const e = entries.get(seq) ?? { seq, file: `${codepoints}.png`, codepoints, uses: [], core: false, start: false, order: Infinity }
      const area = areaOf(file)
      e.uses.push({ area, label: labelFor(lines, i, seq), line: line.trim().slice(0, 160), where: `${relative(ROOT, file)}:${i + 1}` })
      if (!FLAVOUR.test(area)) e.core = true
      const startArea = START_AREAS.indexOf(area)
      if (startArea >= 0) {
        e.start = true
        e.order = Math.min(e.order, startArea * 10_000 + i)
      }
      entries.set(seq, e)
    }
  })
}

// 2. Unicode names, so each picture's subject is clear even without seeing it.
const allChars = [...new Set([...entries.keys()].flatMap((s) => [...s]))]
const names: Record<string, string> = JSON.parse(
  execFileSync('python3', ['-I', '-c', 'import sys,json,unicodedata as u;print(json.dumps({c:u.name(c,"?").lower() for c in sys.argv[1]}))', allChars.join('')], {
    encoding: 'utf8',
  }),
)
for (const e of entries.values())
  e.name = [...e.seq]
    .filter((c) => c !== '‍')
    .map((c) => names[c])
    .join(' + ')

// The first batch in the order the game introduces things (ingredients, kitchen, family, places…), the rest by use.
const list = [...entries.values()].sort((a, b) => Number(b.start) - Number(a.start) || a.order - b.order || Number(b.core) - Number(a.core) || b.uses.length - a.uses.length || a.codepoints.localeCompare(b.codepoints))

// 3. Pictures: draw each emoji big in Chrome, with the bundled font and with the system font.
rmSync(OUT, { recursive: true, force: true })
for (const dir of ['png/game', 'png/system']) mkdirSync(join(OUT, dir), { recursive: true })
const woff2 = readFileSync(join(ROOT, 'src/assets/emoji/noto-colr.woff2')).toString('base64')
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage()
await page.setContent(`<style>@font-face{font-family:Tw;src:url(data:font/woff2;base64,${woff2})}</style><p style="font-family:Tw">🍳</p>`)
await page.evaluate(() => document.fonts.load('40px Tw', '🍳'))
for (const e of list) {
  const [tw, sys, split] = await page.evaluate(
    ([seq, size]) => {
      const draw = (family: string) => {
        const c = document.createElement('canvas')
        c.width = c.height = size
        const x = c.getContext('2d')!
        x.font = `${size * 0.8}px ${family}`
        const m = x.measureText(seq)
        const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight
        const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
        const scale = Math.min(1, (size * 0.92) / Math.max(w, h))
        x.setTransform(scale, 0, 0, scale, size / 2, size / 2)
        x.fillText(seq, -(m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2, (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2)
        return { url: c.toDataURL('image/png'), width: m.width }
      }
      const one = draw('Tw, sans-serif')
      return [one.url, draw('sans-serif').url, one.width > size * 0.8 * 1.4] as const
    },
    [e.seq, SIZE] as const,
  )
  e.split = split
  writeFileSync(join(OUT, 'png/game', e.file), Buffer.from(tw.split(',')[1], 'base64'))
  writeFileSync(join(OUT, 'png/system', e.file), Buffer.from(sys.split(',')[1], 'base64'))
}
await browser.close()

// 4. The brief: a contact sheet, a spreadsheet and the art spec (docs/EMOJI_ART.md, copied as README.md).
const h = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const usesText = (e: Entry) =>
  [...new Map([...e.uses].sort((a, b) => Number(START_AREAS.includes(b.area)) - Number(START_AREAS.includes(a.area))).map((u) => [`${u.area}|${u.label}`, u])).values()].map((u) => (u.label ? `${u.area}: ${u.label}` : u.area))

const csvCell = (s: string) => `"${s.replace(/"/g, '""')}"`
writeFileSync(
  join(OUT, 'emoji.csv'),
  ['emoji,file,codepoints,unicode_name,group,times_used,splits_in_chrome,used_for,first_place_in_code']
    .concat(
      list.map((e) =>
        [e.seq, e.file, e.codepoints, e.name!, e.start ? 'start here' : e.core ? 'core' : 'badges & stories', String(e.uses.length), e.split ? 'yes' : '', usesText(e).join(' | '), e.uses[0].where]
          .map(csvCell)
          .join(','),
      ),
    )
    .join('\n') + '\n',
)

const card = (e: Entry) => `<article class="card${e.split ? ' split' : ''}" id="${e.codepoints}">
  <div class="pics"><figure><img src="png/game/${e.file}" alt="" loading="lazy"><figcaption>in the game now</figcaption></figure>
  <figure><img src="png/system/${e.file}" alt="" loading="lazy"><figcaption>this computer</figcaption></figure></div>
  <h3>${h(e.name!)}</h3>
  <p class="meta"><code>${e.file}</code> · used ${e.uses.length}×${e.split ? ' · <b>shows as two pictures in Chrome</b>' : ''}</p>
  <ul>${usesText(e)
    .slice(0, 8)
    .map((u) => `<li>${h(u)}</li>`)
    .join('')}${usesText(e).length > 8 ? `<li class="more">and ${usesText(e).length - 8} more</li>` : ''}</ul>
</article>`

const start = list.filter((e) => e.start)
const core = list.filter((e) => e.core && !e.start)
const flavour = list.filter((e) => !e.core)
writeFileSync(
  join(OUT, 'index.html'),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Schnitzelverse emoji brief</title>
<style>
:root{--bg:#1f1a16;--panel:#2a231d;--text:#f3e9dc;--muted:#b9a894;--accent:#e3a33a;--line:#3d332a;color-scheme:dark}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.45 system-ui,sans-serif}
main{max-width:1400px;margin:0 auto;padding:24px 16px}
h1{margin:0 0 4px}h2{margin:32px 0 6px;color:var(--accent)}.lead{color:var(--muted);max-width:75ch}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px}
.card.split{border-color:#c0563a}
.pics{display:flex;gap:8px}figure{margin:0;flex:1;text-align:center}
img{width:100%;max-width:96px;aspect-ratio:1;background:#3a3029;border-radius:10px}
figcaption{font-size:11px;color:var(--muted)}
h3{font-size:15px;margin:8px 0 2px;text-transform:capitalize}
.meta{font-size:12px;color:var(--muted);margin:0 0 6px}code{font-size:11px}
ul{margin:0;padding-left:18px;font-size:13px}li.more{color:var(--muted);list-style:none;margin-left:-18px}
</style></head><body><main>
<h1>Schnitzelverse emoji brief</h1>
<p class="lead">${list.length} different emoji are on screen in the game today. <b>Start here</b> (${start.length}) are the game's main things: ingredients, kitchen steps, family, places, vehicles and the farm. <b>Everything else on the main screens</b> (${core.length}) is gear, upgrades and buttons. <b>Badges &amp; stories</b> (${flavour.length}) appear only in records, tales and the story. Each card shows the picture in the game now (Noto), this computer’s own emoji, and what the game uses it for. Files and the art spec are in README.md next to this page.</p>
<h2>Start here (${start.length})</h2><div class="grid">${start.map(card).join('\n')}</div>
<h2>Everything else on the main screens (${core.length})</h2><div class="grid">${core.map(card).join('\n')}</div>
<h2>Badges &amp; stories (${flavour.length})</h2><div class="grid">${flavour.map(card).join('\n')}</div>
</main></body></html>
`,
)

writeFileSync(join(OUT, 'README.md'), readFileSync(join(ROOT, 'docs/EMOJI_ART.md')))
console.log(`${list.length} emoji (${start.length} to start with, ${core.length} more on the main screens) → ${relative(ROOT, OUT)}/index.html`)
const split = list.filter((e) => e.split).map((e) => e.seq)
if (split.length) console.log(`Shown as two pictures in Chrome: ${split.join(' ')}`)
