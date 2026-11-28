import { describe, expect, it } from 'vitest'
import { PERK_BY_ID, UPGRADES, WORD_OF_MOUTH_MAX } from './content'
import { newGame } from './state'
import { fromExportString, serialize, deserialize } from './save'
import { applyEndgamePicks } from './actions'
import { canBuyPerk, canSwapFork, customerDemand, endgameLocked, EVERYONE_ORDERS, epilogueOpen, explainMod, fedShare, getMods, ordersCapped, upgradeUnlocked } from './rules'
import { tick } from './tick'

/** A game just past the Schnitzelverse (3d 21h, 38 franchises), exported from the real game. */
const saves = import.meta.glob<string>('../../tools/saves/finale.txt', { query: '?raw', import: 'default', eager: true })
const finale = () => fromExportString(Object.values(saves)[0])
const upgrade = (id: string) => UPGRADES.find((u) => u.id === id)!

describe('the epilogue: Now, the lemon', () => {
  it('Word of mouth stops at its top level, so orders have a most', () => {
    expect(PERK_BY_ID.wordOfMouth.maxLevel).toBe(WORD_OF_MOUTH_MAX)
    const s = finale()
    s.prestige.crumbs = s.prestige.crumbs.mul(1e9)
    s.prestige.perks.wordOfMouth = WORD_OF_MOUTH_MAX
    expect(canBuyPerk(s, PERK_BY_ID.wordOfMouth)).toBe(false)
    // Everyone in every universe: a few quadrillion orders a second.
    expect(EVERYONE_ORDERS).toBeGreaterThan(1e15)
    expect(EVERYONE_ORDERS).toBeLessThan(1e16)
  })

  it('reaches everyone only with every order boost in place', () => {
    const s = finale()
    applyEndgamePicks(s)
    expect(customerDemand(s, getMods(s))).toBeLessThan(EVERYONE_ORDERS)
    expect(ordersCapped(s)).toBe(false)
    // The finale run never bought the constellation (customers weren't the limit).
    s.upgrades.constellationAds = true
    expect(customerDemand(s, getMods(s)) / EVERYONE_ORDERS).toBeCloseTo(1, 6)
    expect(ordersCapped(s)).toBe(true)
    expect(explainMod(s, 'orders').some((f) => f.name === 'Everyone has ordered')).toBe(false)
  })

  it('Chapter 6 picks Gossip queen for good', () => {
    const s = finale()
    // The finale save went with Darling of the press, 5 levels.
    expect(s.prestige.perks.pressDarling).toBe(5)
    const legend = s.prestige.perks.localLegend ?? 0
    tick(s, 1)
    expect(s.prestige.perks.gossipQueen).toBe(5)
    expect(s.prestige.perks.pressDarling).toBeUndefined()
    // Local legend +1 makes up for some of the press's reputation, once.
    expect(s.prestige.perks.localLegend).toBe(legend + 1)
    tick(s, 1)
    expect(s.prestige.perks.localLegend).toBe(legend + 1)
    expect(endgameLocked(s, PERK_BY_ID.gossipQueen)).toBe('picked')
    expect(endgameLocked(s, PERK_BY_ID.pressDarling)).toBe('retired')
    expect(canSwapFork(s, PERK_BY_ID.pressDarling)).toBe(false)
    s.prestige.crumbs = s.prestige.crumbs.mul(1e9)
    expect(canBuyPerk(s, PERK_BY_ID.pressDarling)).toBe(false)
    // Before Chapter 6 the choice stays free.
    const early = newGame(0)
    expect(endgameLocked(early, PERK_BY_ID.gossipQueen)).toBe(null)
  })

  it('leaves a fresh game alone', () => {
    const s = newGame(0)
    expect(ordersCapped(s)).toBe(false)
    expect(explainMod(s, 'orders').some((f) => f.name === 'Everyone has ordered')).toBe(false)
    expect(epilogueOpen(s)).toBe(false)
  })

  it('opens Grandma’s standards one rung at a time, from the Schnitzelverse', () => {
    const s = finale()
    expect(epilogueOpen(s)).toBe(true)
    expect(upgradeUnlocked(s, upgrade('standards_kitchen_1'))).toBe(true)
    expect(upgradeUnlocked(s, upgrade('standards_kitchen_2'))).toBe(false)
    s.upgrades.standards_kitchen_1 = true
    expect(upgradeUnlocked(s, upgrade('standards_kitchen_2'))).toBe(true)
    // Not before the Schnitzelverse in this run.
    s.regions.schnitzelverse.unlocked = false
    expect(upgradeUnlocked(s, upgrade('standards_farm_1'))).toBe(false)
  })

  it('a rung doubles the kitchen', () => {
    const s = finale()
    const before = getMods(s).speed.fry
    s.upgrades.standards_kitchen_1 = true
    expect(getMods(s).speed.fry / before).toBeCloseTo(2)
  })

  it('tracks the best share fed and keeps it in the save', () => {
    const s = finale()
    const now = fedShare(s)
    expect(now).toBeGreaterThan(0.001)
    expect(now).toBeLessThan(0.02)
    for (let i = 0; i < 61; i++) tick(s, 1)
    expect(s.stats.bestFed).toBeGreaterThan(0.001)
    const back = deserialize(serialize(s))
    expect(back.stats.bestFed).toBe(s.stats.bestFed)
    expect(back.lemonSeen).toBe(false)
  })
})
