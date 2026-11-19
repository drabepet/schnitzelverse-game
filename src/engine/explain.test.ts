import { describe, expect, it } from 'vitest'
import { badgeBonus, explainMod, getMods } from './rules'
import { BADGE_BONUS } from './badgeBonus'
import { newGame } from './state'

describe('"Why?" breakdowns', () => {
  it('list every source, and multiply to the real modifier', () => {
    const s = newGame()
    s.upgrades.heavyMallet = true
    s.prestige.perks.betterPans = 2
    const factors = explainMod(s, 'pound')
    expect(factors.map((f) => f.name).length).toBe(2)
    const total = factors.reduce((t, f) => t * f.mult, 1)
    expect(total).toBeCloseTo(getMods(s).speed.pound, 9)
  })

  it('leave out sources that do not touch the number', () => {
    const s = newGame()
    s.prestige.perks.familyRecipe = 1
    expect(explainMod(s, 'fry')).toEqual([])
    expect(explainMod(s, 'price')).toHaveLength(1)
  })

  it('badge bonuses add up and count towards prices', () => {
    const s = newGame()
    const ids = Object.keys(BADGE_BONUS)
    expect(ids.length).toBeGreaterThan(0)
    for (const id of ids) s.badges[id] = 0
    const sum = Object.values(BADGE_BONUS).reduce((a, b) => a + b, 0)
    expect(badgeBonus(s)).toBeCloseTo(sum, 9)
    expect(getMods(s).price).toBeCloseTo(1 + sum, 9)
  })
})

describe('crispness', () => {
  it('is locked until the next town, then pays off', async () => {
    const { unlockRegion, setCrisp } = await import('./actions')
    const { crispness, stageInputs } = await import('./rules')
    const { D } = await import('./decimal')
    const s = newGame()
    expect(crispness(s)).toBe(0)
    s.prestige.franchises = 1
    s.reputation = D(1e9)
    s.money = D(1e9)
    for (const r of ['friends', 'street', 'block', 'district', 'town', 'nextTown'] as const) unlockRegion(s, r)
    expect(s.crisp.unlocked).toBe(true)
    expect(crispness(s)).toBeCloseTo(0.1, 9)
    const before = getMods(s).price
    setCrisp(s, 170, 2)
    expect(stageInputs(s, 'fry').oil).toBe(3)
    expect(getMods(s).price).toBeGreaterThan(before)
    setCrisp(s, 190, 0)
    expect(getMods(s).speed.fry).toBeCloseTo(1.3, 9)
    expect(crispness(s)).toBeLessThan(0.1)
    setCrisp(s, 999, 9)
    expect(s.crisp.temperature).toBe(190)
    expect(s.crisp.oil).toBe(2)
  })
})

describe('equipment descriptions', () => {
  it('name the exact farm buildings a group upgrade affects', async () => {
    const { describeEffect } = await import('./describe')
    const { UPGRADES } = await import('./content')
    const tractor = UPGRADES.find((u) => u.id === 'tractor')!
    const line = describeEffect(tractor.effects[0])
    expect(line).toContain('Wheat field')
    expect(line).toContain('Sunflower field')
    for (const u of UPGRADES) for (const e of u.effects) expect(describeEffect(e).length).toBeGreaterThan(5)
  })
})

describe('time formatting', () => {
  it('never prints scientific notation for far-away goals', async () => {
    const { fmtTime } = await import('./format')
    expect(fmtTime(90)).toBe('1m 30s')
    expect(fmtTime(3 * 86400 + 7200)).toBe('3d 2h')
    expect(fmtTime(1.5e47)).toBe('a very long time')
    expect(fmtTime(Infinity)).toBe('a very long time')
  })
})
