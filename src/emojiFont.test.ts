import { describe, expect, it } from 'vitest'
import { emojiIn, emojiSequences } from './emojiChars'
import font from './assets/emoji/emoji-font.json'

const sources = import.meta.glob<string>(['./**/*.{ts,tsx,css}', '!./emoji-font.css'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

describe('bundled emoji font', () => {
  it('has a picture for every emoji the game uses (else run: node tools/emoji-font.ts)', () => {
    const known = new Set([...font.sequences, ...font.notInFont])
    const missing = new Map<string, string>()
    for (const [file, text] of Object.entries(sources))
      for (const seq of emojiSequences(text)) if (!known.has(seq)) missing.set(seq, file)
    expect(Object.fromEntries(missing)).toEqual({})
  })

  it('tells emoji from plain symbols', () => {
    const got = (s: string) => [...emojiIn(s)].sort()
    expect(got('🔥 hot')).toEqual(['🔥'])
    expect(got('⚙️ gear, ⚙ plain')).toEqual(['⚙', '️'].sort())
    expect(got('★ ✓ → ▶ 1️⃣')).toEqual(['️'])
    expect(got('🧑‍🍳')).toEqual(['🧑', '‍', '🍳'].sort())
  })

  it('treats a joined emoji as one picture', () => {
    expect([...emojiSequences('Cook 🧑‍🍳, gear ⚙️, star ★')]).toEqual(['🧑‍🍳', '⚙'])
  })
})
