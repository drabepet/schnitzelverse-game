import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { FUEL_PER_SCHNITZEL, REGIONS } from './content'
import { newGame, type GameState } from './state'
import { tick } from './tick'
import { buyFacility } from './actions'
import { fuelFor, supplyNeeds, getMods } from './rules'
import { deserialize, serialize } from './save'
import { runManagers } from './automation'

/** Chapter 4 with one cruiser, Mars open and plenty of hot schnitzel waiting there. */
function marsRun(): GameState {
  const s = newGame(0)
  s.prestige.franchises = 20
  s.milestones.planet = true
  for (const r of REGIONS) if (!r.deep) s.regions[r.id].unlocked = true
  // Only Mars has customers, so the cruiser flies there.
  for (const r of REGIONS) s.regions[r.id].orders = D(r.id === 'mars' ? 1e6 : 0)
  s.vehicles.cruiser = 1
  s.items.hot = D(1e6)
  return s
}

describe('star paprika', () => {
  it('trips past the Moon need fuel; closer ones never do', () => {
    const at = (id: string) => REGIONS.find((r) => r.id === id)!
    expect(fuelFor(at('moon'))).toBeNull()
    expect(fuelFor(at('mars'))).toBe('fold')
    expect(fuelFor(at('nextStar'))).toBe('deepFold')
  })

  it('without fuel the cruiser drifts on solar sails: the schnitzel arrives cold', () => {
    const s = marsRun()
    const flows = tick(s, 1)
    expect(flows.sails.toNumber()).toBeGreaterThan(0)
    expect(s.stats.servedCold.toNumber()).toBeCloseTo(s.stats.served.toNumber())
  })

  it('with fold paprika it flies fast and burns a pinch per schnitzel', () => {
    const s = marsRun()
    s.items.fold = D(1e6)
    const flows = tick(s, 1)
    expect(flows.sails.toNumber()).toBe(0)
    expect(s.stats.servedCold.toNumber()).toBeLessThan(s.stats.served.toNumber() * 0.5)
    expect(1e6 - s.items.fold.toNumber()).toBeCloseTo(s.stats.served.toNumber() * FUEL_PER_SCHNITZEL)
  })

  it('the dunes open with Mars, the distillery with the next star', () => {
    const s = marsRun()
    s.money = D(1e30)
    s.regions.mars.unlocked = false
    expect(buyFacility(s, 'paprikaDunes')).toBe(false)
    s.regions.mars.unlocked = true
    expect(buyFacility(s, 'paprikaDunes')).toBe(true)
    expect(buyFacility(s, 'paprikaDistillery')).toBe(false)
  })

  it('the fleet’s fuel shows up in what the farm must cover, and Grandpa builds for it', () => {
    const s = marsRun()
    expect(supplyNeeds(s, getMods(s)).fold).toBeGreaterThan(0)
    s.prestige.perks.farmManager = 1
    s.money = D(1e18)
    runManagers(s, 1)
    expect(s.facilities.paprikaDunes + s.facilities.paprikaMill).toBeGreaterThan(0)
  })

  it('an older save loads with no paprika yet', () => {
    const s = newGame(0)
    const old = JSON.parse(serialize(s))
    delete old.facilities.paprikaDunes
    delete old.items.fold
    const loaded = deserialize(JSON.stringify(old))
    expect(loaded.facilities.paprikaDunes).toBe(0)
    expect(loaded.items.fold.toNumber()).toBe(0)
  })
})

describe('star paprika records', () => {
  it('are records only: none adds a bonus', async () => {
    const { BADGES } = await import('./badges')
    const { BADGE_BONUS } = await import('./badgeBonus')
    const paprika = BADGES.filter((b) => b.category === 'paprika')
    expect(paprika.length).toBeGreaterThanOrEqual(10)
    for (const b of paprika) expect(BADGE_BONUS[b.id]).toBeUndefined()
  })

  it('count the paprika burned and the schnitzels flown on sails', () => {
    const s = marsRun()
    tick(s, 1)
    expect(s.stats.sailed.toNumber()).toBeGreaterThan(0)
    s.items.fold = D(1e6)
    tick(s, 1)
    expect(s.stats.paprikaBurned.toNumber()).toBeGreaterThan(0)
  })
})
