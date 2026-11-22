import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { BRANCHES, CHAPTER_CAPS, PERKS } from './content'
import { newGame } from './state'
import { buyPerk, franchise, swapFork } from './actions'
import { canBuyPerk, getMods, perkCost, perkMaxLevel, perkMissing } from './rules'

const perk = (id: string) => PERKS.find((p) => p.id === id)!

describe('the family tree', () => {
  it('places every perk in exactly one branch, managers on top', () => {
    const placed = BRANCHES.flatMap((b) => [b.manager, ...b.rows.flat()])
    expect(new Set(placed).size).toBe(placed.length)
    expect([...placed].sort()).toEqual(PERKS.map((p) => p.id).sort())
    for (const b of BRANCHES) expect(perk(b.manager).manager).toBe(true)
  })

  it('perks open one another', () => {
    const s = newGame(0)
    s.prestige.crumbs = D(1000)
    expect(perkMissing(s, perk('betterPans')).map((m) => m.perk.id)).toEqual(['familyRecipe'])
    expect(buyPerk(s, 'betterPans')).toBe(false)
    buyPerk(s, 'familyRecipe')
    buyPerk(s, 'familyRecipe')
    expect(buyPerk(s, 'betterPans')).toBe(true)
  })

  it('a pick-one choice blocks the other side, and switches once per run', () => {
    const s = newGame(0)
    s.prestige.crumbs = D(1e6)
    Object.assign(s.prestige.perks, { familyRecipe: 10, betterPans: 10 })
    expect(buyPerk(s, 'thinAndFast')).toBe(true)
    expect(buyPerk(s, 'thinAndFast')).toBe(true)
    expect(canBuyPerk(s, perk('thickAndGolden'))).toBe(false)
    const kitchen = getMods(s).speed.fry
    expect(swapFork(s, 'thickAndGolden')).toBe(true)
    expect(s.prestige.perks.thickAndGolden).toBe(2)
    expect(s.prestige.perks.thinAndFast).toBeUndefined()
    // The modifiers follow the switch (the cache must notice).
    expect(getMods(s).speed.fry).toBeLessThan(kitchen)
    expect(swapFork(s, 'thinAndFast')).toBe(false)
    s.prestige.unlocked = true
    s.regions.town.unlocked = true
    s.stats.earned = D(1e9)
    s.run.earned = D(1e9)
    franchise(s)
    expect(swapFork(s, 'thinAndFast')).toBe(true)
  })

  it('capstones need their branch grown first', () => {
    const s = newGame(0)
    s.prestige.crumbs = D(1e12)
    expect(buyPerk(s, 'lardSecret')).toBe(false)
    Object.assign(s.prestige.perks, { familyRecipe: 25, betterPans: 25, crispMaster: 10 })
    expect(buyPerk(s, 'lardSecret')).toBe(true)
    expect(buyPerk(s, 'lardSecret')).toBe(false)
  })

  it('endless perks get dearer faster past level 25', () => {
    const s = newGame(0)
    s.prestige.perks.familyRecipe = 25
    const at25 = perkCost(s, perk('familyRecipe')).toNumber()
    s.prestige.perks.familyRecipe = 26
    expect(perkCost(s, perk('familyRecipe')).toNumber()).toBeCloseTo(at25 * 3, -3)
    s.prestige.perks.headStart = 5
    expect(perkCost(s, perk('headStart')).toNumber()).toBe(32)
  })

  it('endless perks top out per chapter, far above normal play', () => {
    const s = newGame(0)
    expect(perkMaxLevel(s, perk('familyRecipe'))).toBe(CHAPTER_CAPS[0])
    s.prestige.perks.familyRecipe = CHAPTER_CAPS[0]
    s.prestige.crumbs = D(1e30)
    expect(buyPerk(s, 'familyRecipe')).toBe(false)
    s.prestige.franchises = 2 // Chapter 2
    expect(buyPerk(s, 'familyRecipe')).toBe(true)
    expect(perkMaxLevel(s, perk('headStart'))).toBe(6)
  })

  it('perks bought before the tree existed stay, even without their prerequisites', () => {
    const s = newGame(0)
    s.prestige.perks.localLegend = 5
    expect(getMods(s).reputation).toBeGreaterThan(1)
    s.prestige.crumbs = D(1e6)
    expect(buyPerk(s, 'localLegend')).toBe(false)
  })
})
