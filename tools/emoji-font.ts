// Builds the bundled emoji font from Google's Noto emoji pictures, cut down to the emoji the game
// uses, so emoji look the same in every browser and on every system.
//
//   node tools/emoji-font.ts        # run again whenever the emoji test asks for it
//
// Two files come out, one per colour-font format, and the CSS lets each browser load the one it
// can draw: COLRv1 (Chrome, Edge, Firefox) and OpenType-SVG (Safari). Same pictures in both.
//
// Needs Python with nanoemoji, fontTools and brotli (`pip install nanoemoji brotli`); set PYTHON to
// that Python if it isn't `python3` (nanoemoji and ninja are taken from the same folder).
// Downloads the pictures once into node_modules/.cache. Writes src/assets/emoji/, src/emoji-font.css
// and public/licenses/noto-emoji.txt.
//
// Our own pictures: an SVG in art/emoji/ named like Noto's (emoji_u1f373.svg for 🍳, 128×128) is used
// instead of Noto's picture for that emoji, everywhere in the game. See docs/EMOJI_ART.md.
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { emojiSequences } from '../src/emojiChars.ts'

/** googlefonts/noto-emoji main on 2026-11-27 (Unicode 18 release). Pinned so rebuilds don't change the art. */
const NOTO_COMMIT = '99701e07d3d1fe1bdbcdb14964547f0fd592966f'
const NOTO = `https://raw.githubusercontent.com/googlefonts/noto-emoji/${NOTO_COMMIT}`
const PYTHON = process.env.PYTHON ?? 'python3'
const ROOT = join(import.meta.dirname, '..')
const OUT_DIR = join(ROOT, 'src/assets/emoji')
const CACHE = join(ROOT, 'node_modules/.cache/noto-emoji', NOTO_COMMIT)
const OWN = join(ROOT, 'art/emoji')
const FAMILY = 'Schnitzel Emoji'

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    if (e.isDirectory()) return sourceFiles(p)
    return /\.(ts|tsx|css)$/.test(e.name) && e.name !== 'emoji-font.css' ? [p] : []
  })
}

const noto = (seq: string) => `emoji_u${[...seq].map((c) => c.codePointAt(0)!.toString(16)).join('_')}.svg`

async function download(url: string, path: string): Promise<boolean> {
  if (existsSync(path)) return true
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url).catch(() => null)
    if (!res) continue
    if (res.status === 404) return false
    if (res.ok) {
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, Buffer.from(await res.arrayBuffer()))
      return true
    }
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
  }
  throw new Error(`Download failed: ${url}`)
}

// 1. Every emoji the game shows, and a picture for each: ours if art/emoji/ has one, else Noto's.
const used = new Set<string>()
for (const file of sourceFiles(join(ROOT, 'src'))) for (const seq of emojiSequences(readFileSync(file, 'utf8'))) used.add(seq)
const all = [...used].sort((a, b) => noto(a).localeCompare(noto(b)))
const sequences: string[] = []
const notInFont: string[] = []
const own = all.filter((seq) => existsSync(join(OWN, noto(seq))))
const picture = (seq: string) => (own.includes(seq) ? join(OWN, noto(seq)) : join(CACHE, noto(seq)))
for (const seq of all) (own.includes(seq) || (await download(`${NOTO}/2D/svg/${noto(seq)}`, join(CACHE, noto(seq)))) ? sequences : notInFont).push(seq)
await download(`${NOTO}/LICENSE`, join(CACHE, 'LICENSE'))

// 2. Build the two fonts with nanoemoji.
const build = join(ROOT, 'node_modules/.cache/emoji-font-build')
rmSync(build, { recursive: true, force: true })
mkdirSync(join(build, 'svg'), { recursive: true })
for (const seq of sequences) copyFileSync(picture(seq), join(build, 'svg', noto(seq)))
const svgs = sequences.map((seq) => join(build, 'svg', noto(seq)))
const env = { ...process.env, PATH: `${dirname(PYTHON)}:${process.env.PATH}` }
const formats = { colr: 'glyf_colr_1', svg: 'picosvg' } as const
for (const [name, format] of Object.entries(formats)) {
  execFileSync(
    join(dirname(PYTHON), 'nanoemoji'),
    ['--color_format', format, '--family', FAMILY, '--build_dir', join(build, name), '--output_file', `${name}.ttf`, ...svgs],
    { env, stdio: ['ignore', 'ignore', 'pipe'] },
  )
}

// 3. Let U+FE0F (the emoji selector) draw nothing in this font, then compress to WOFF2.
mkdirSync(OUT_DIR, { recursive: true })
for (const f of readdirSync(OUT_DIR)) if (f.endsWith('.woff2')) rmSync(join(OUT_DIR, f))
const finish = `
import sys
from fontTools.ttLib import TTFont
font = TTFont(sys.argv[1])
blank = font.getBestCmap()[0x200D]
for table in font['cmap'].tables:
    if table.isUnicode():
        table.cmap[0xFE0F] = blank
font.flavor = 'woff2'
font.save(sys.argv[2])
`
for (const name of Object.keys(formats))
  execFileSync(PYTHON, ['-I', '-c', finish, join(build, name, `${name}.ttf`), join(OUT_DIR, `noto-${name}.woff2`)])

// 4. The list the test checks against, the licence, and the CSS.
writeFileSync(
  join(OUT_DIR, 'emoji-font.json'),
  JSON.stringify({ source: `${NOTO}/2D/svg`, licence: 'Apache-2.0', own, sequences, notInFont }, null, 2) + '\n',
)
mkdirSync(join(ROOT, 'public/licenses'), { recursive: true })
copyFileSync(join(CACHE, 'LICENSE'), join(ROOT, 'public/licenses/noto-emoji.txt'))

const chars = new Set(sequences.flatMap((s) => [...s]))
chars.add('️')
const range = [...chars]
  .map((c) => c.codePointAt(0)!)
  .sort((a, b) => a - b)
  .map((c) => `U+${c.toString(16).toUpperCase()}`)
  .join(', ')
writeFileSync(
  join(ROOT, 'src/emoji-font.css'),
  `/* Generated by tools/emoji-font.ts: do not edit by hand, run \`node tools/emoji-font.ts\`.
   Noto Emoji pictures by Google, Apache License 2.0 (public/licenses/noto-emoji.txt), cut down to the
   emoji this game uses. Each browser loads the first file it can draw: COLRv1 (Chrome, Edge, Firefox)
   or OpenType-SVG (Safari); the last line is for browsers that don't know tech(). unicode-range keeps
   every other character in the text font. font-display: block hides only the emoji for the moment the
   font takes to load (main.tsx starts it early), instead of flashing the system's emoji first. */
@font-face {
  font-family: '${FAMILY}';
  src:
    url('./assets/emoji/noto-colr.woff2') format('woff2') tech(color-COLRv1),
    url('./assets/emoji/noto-svg.woff2') format('woff2') tech(color-SVG),
    url('./assets/emoji/noto-svg.woff2') format('woff2');
  font-display: block;
  unicode-range: ${range};
}
`,
)

const kb = (f: string) => `${(statSync(join(OUT_DIR, f)).size / 1024).toFixed(0)} KB`
console.log(`${sequences.length} emoji → ${relative(ROOT, OUT_DIR)}/noto-colr.woff2 (${kb('noto-colr.woff2')}), noto-svg.woff2 (${kb('noto-svg.woff2')})`)
if (own.length) console.log(`Our own pictures: ${own.join(' ')}`)
if (notInFont.length) console.log(`Not in Noto (shown with the system font): ${notInFont.join(' ')}`)
