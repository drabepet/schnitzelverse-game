import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { buyVehicle, canUnlockRegion, clickDeliver, franchise, unlockRegion } from './actions'
import { REGIONS } from './content'
import { canReach, chapter4Unlocked, getMods, upgradeVisible, vehicleVisible } from './rules'
import { UPGRADES, VEHICLES } from './content'
import { newGame, type GameState } from './state'
import { tick } from './tick'

/** A late game at the planet: every Earth place unlocked. */
function atThePlanet(): GameState {
  const s = newGame()
  s.prestige.franchises = 12
  s.prestige.unlocked = true
  s.reputation = D(1e15)
  s.money = D(1e18)
  for (const r of REGIONS) if (!r.space) unlockRegion(s, r.id)
  tick(s, 0.05) // milestones
  return s
}

describe('Chapter 4: the stars', () => {
  it('starts once the whole planet is reached, and stays unlocked', () => {
    const s = newGame()
    expect(chapter4Unlocked(s)).toBe(false)
    expect(vehicleVisible(s, VEHICLES.find((v) => v.id === 'rocket')!)).toBe(false)
    const late = atThePlanet()
    expect(chapter4Unlocked(late)).toBe(true)
    late.stats.earned = D(1e20)
    expect(franchise(late)).toBe(true)
    expect(chapter4Unlocked(late)).toBe(true)
    late.reputation = D(1e9)
    expect(upgradeVisible(late, UPGRADES.find((u) => u.id === 'zeroGFryer')!)).toBe(true)
  })

  it('space places need space vehicles: helpers and Earth vehicles stay home', () => {
    const s = atThePlanet()
    expect(canUnlockRegion(s, 'orbit')).toBe(true)
    unlockRegion(s, 'orbit')
    const orbit = REGIONS.find((r) => r.id === 'orbit')!
    expect(orbit.distance).toBeLessThanOrEqual(400)
    s.workers.kid = 100
    s.vehicles.truck = 10
    expect(canReach(s, orbit)).toBe(false)
    s.regions.orbit.orders = D(10)
    s.items.hot = D(10)
    expect(clickDeliver(s, 'orbit')).toBe(false)
    expect(buyVehicle(s, 'rocket')).toBe(true)
    expect(canReach(s, orbit)).toBe(true)
  })

  it('rockets deliver to space, hot', () => {
    const s = atThePlanet()
    unlockRegion(s, 'orbit')
    s.vehicles.rocket = 1
    for (const r of REGIONS) s.regions[r.id].orders = D(0)
    s.regions.orbit.orders = D(1000)
    s.items.hot = D(1000)
    const before = s.stats.served
    tick(s, 0.1)
    expect(s.stats.served.gt(before)).toBe(true)
    expect(s.regions.orbit.orders.lt(1000 + 20_000 * 0.1 * getMods(s).orders)).toBe(true)
  })
})
