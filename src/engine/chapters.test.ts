import { describe, expect, it } from 'vitest'
import { CHAPTER2_FRANCHISES, CHAPTER3_FRANCHISES, REGION_INDEX } from './content'
import { newGame } from './state'
import { nextChapterGoal } from './rules'

describe('what opens the next chapter', () => {
  it('counts franchises for chapters 2 and 3', () => {
    const s = newGame()
    expect(nextChapterGoal(s)).toMatchObject({ chapter: 2, text: `0/${CHAPTER2_FRANCHISES} franchises`, progress: 0 })
    s.prestige.franchises = CHAPTER2_FRANCHISES + 1
    const goal = nextChapterGoal(s)!
    expect(goal.chapter).toBe(3)
    expect(goal.text).toBe(`${CHAPTER2_FRANCHISES + 1}/${CHAPTER3_FRANCHISES} franchises`)
    expect(goal.when).toBe(`after ${CHAPTER3_FRANCHISES} franchises`)
  })

  it('asks for a place for chapters 4, 5 and 6, and nothing after the last', () => {
    const s = newGame()
    s.prestige.franchises = CHAPTER3_FRANCHISES
    s.stats.bestPlace = REGION_INDEX.country
    const four = nextChapterGoal(s)!
    expect(four.chapter).toBe(4)
    expect(four.text).toMatch(/^reach .*planet/)
    expect(four.progress).toBeGreaterThan(0)
    expect(four.progress).toBeLessThan(1)
    s.milestones.planet = true
    expect(nextChapterGoal(s)!.chapter).toBe(5)
    s.milestones.solar = true
    const six = nextChapterGoal(s)!
    expect(six.chapter).toBe(6)
    expect(six.text).toMatch(/^reach .*Schnitzelverse/)
    s.stats.bestPlace = REGION_INDEX.schnitzelverse
    expect(nextChapterGoal(s)).toBeNull()
  })
})

describe('keep-a-copy note', () => {
  it('an older save starts suggesting it from its next chapter, not straight away', async () => {
    const { deserialize, serialize } = await import('./save')
    const s = newGame()
    s.prestige.franchises = CHAPTER3_FRANCHISES
    const raw = JSON.parse(serialize(s)) as Record<string, unknown>
    delete raw.copyNudgeChapter
    expect(deserialize(JSON.stringify(raw)).copyNudgeChapter).toBe(3)
    // A save that already has it keeps its own value.
    expect(deserialize(serialize(s)).copyNudgeChapter).toBe(1)
  })
})

describe('family chronicle', () => {
  it('every family line belongs to a milestone', async () => {
    const { FAMILY_LINES, MILESTONES } = await import('./content')
    const ids = new Set(MILESTONES.map((m) => m.id))
    for (const id of Object.keys(FAMILY_LINES)) expect(ids.has(id), id).toBe(true)
  })
})

describe('kitchen tales', () => {
  it('a tale for every chapter (Chapter 6 has five), each a few minutes’ read', async () => {
    const { CHAPTERS, TALES } = await import('./content')
    expect([...new Set(TALES.map((t) => t.chapter))]).toEqual(CHAPTERS.map((_, i) => i + 1))
    // Ids are unique and in reading order; 1–5 are the first five chapters' tales (older saves store those).
    expect(TALES.map((t) => t.id)).toEqual(TALES.map((_, i) => i + 1))
    expect(TALES.filter((t) => t.chapter === 6).map((t) => t.fed ?? 0)).toEqual([0, 0.25, 0.5, 0.75, 1])
    for (const t of TALES) {
      const words = t.paragraphs.join(' ').split(/\s+/).length
      expect(words).toBeGreaterThan(350)
      expect(words).toBeLessThan(700)
    }
  })

  it('reading and offering are remembered; older saves are not greeted with a card', async () => {
    const { markTaleRead, setTaleOffered } = await import('./actions')
    const { deserialize, serialize } = await import('./save')
    const { newGame } = await import('./state')
    const s = newGame(0)
    markTaleRead(s, 1)
    markTaleRead(s, 1)
    setTaleOffered(s, 3)
    setTaleOffered(s, 2)
    expect(s.talesRead).toEqual([1])
    expect(s.taleOffered).toBe(3)
    const old = JSON.parse(serialize(s))
    delete old.taleOffered
    old.prestige.franchises = 5 // Chapter 3
    expect(deserialize(JSON.stringify(old)).taleOffered).toBe(3)
  })
})
