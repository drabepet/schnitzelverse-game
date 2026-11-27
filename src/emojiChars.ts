/**
 * Which characters in a piece of text should be drawn by the bundled emoji font (Noto),
 * so the game looks the same on every system instead of using each system's own emoji.
 *
 * Shared by `tools/emoji-font.ts` (which builds the font subset) and `src/emojiFont.test.ts`
 * (which fails when new content uses an emoji the subset doesn't have yet).
 *
 * A character counts as an emoji when it is shown as an emoji by default (⭐, 🔥), when it is
 * followed by the emoji selector U+FE0F (⚙️ as opposed to a plain ⚙), or when it is part of a
 * joined sequence (🧑‍🍳). Plain symbols such as ★, ✓ or → stay in the text font.
 */

const VS16 = '️'

const PRESENTATION = /\p{Emoji_Presentation}/u
const PICTO_THEN_VS16 = /(\p{Extended_Pictographic}|\p{Emoji})️/gu
const ZWJ_SEQUENCE = /\p{Extended_Pictographic}️?(?:‍\p{Extended_Pictographic}️?)+/gu
const MODIFIER = /\p{Emoji_Modifier}/u

/** The single code points (as strings) in `text` that the emoji font should draw. */
export function emojiIn(text: string): Set<string> {
  const found = new Set<string>()
  for (const ch of text) {
    if (ch.codePointAt(0)! < 0x80) continue
    if (PRESENTATION.test(ch) || MODIFIER.test(ch)) found.add(ch)
  }
  for (const m of text.matchAll(PICTO_THEN_VS16)) {
    found.add(m[1])
    found.add(VS16)
  }
  for (const m of text.matchAll(ZWJ_SEQUENCE)) for (const ch of m[0]) found.add(ch)
  for (const ch of found) if (ch.codePointAt(0)! < 0x80) found.delete(ch)
  return found
}

const graphemes = new Intl.Segmenter('en', { granularity: 'grapheme' })

/**
 * The emoji in `text` as the player sees them: whole joined sequences (🧑‍🍳 is one), without the
 * U+FE0F selector. These are what the emoji font needs one picture each for.
 */
export function emojiSequences(text: string): Set<string> {
  const found = new Set<string>()
  for (const { segment } of graphemes.segment(text)) {
    if (![...emojiIn(segment)].some((ch) => ch !== VS16 && ch !== '‍')) continue
    found.add(segment.replaceAll(VS16, ''))
  }
  return found
}

/** Code point of a single character as uppercase hex, the form the font list uses. */
export function hex(ch: string): string {
  return ch.codePointAt(0)!.toString(16).toUpperCase()
}
