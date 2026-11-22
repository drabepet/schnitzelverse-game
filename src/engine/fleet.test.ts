import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { CHAPTER3_FRANCHISES, REGIONS, VEHICLES } from './content'
import { newGame, type GameState } from './state'
import { buyPerk, buyVehicle, canUnlockRegion, clickDeliver, hireWorker, unlockRegion } from './actions'
import { canReach, deliveryCapacity, freshness, getMods } from './rules'
import { advance } from './tick'

const region = (id: string) => REGIONS.find((r) => r.id === id)!
const vehicle = (id: string) => VEHICLES.find((v) => v.id === id)!

/** A rich Chapter 3 game with every place up to `last` unlocked and only that place ordering. */
function roadGame(last: 'country' | 'continent' | 'planet'): GameState {
  const s = newGame(0)
  s.prestige.franchises = 10
  s.money = D(1e15)
  s.reputation = D(1e12)
  for (const r of REGIONS) {
    if (r.unlockCost > 0) unlockRegion(s, r.id)
    if (r.id === last) break
  }
  for (const r of REGIONS) s.regions[r.id].orders = D(0)
  s.items.hot = D(1e6)
  return s
}

describe('the fleet', () => {
  it('arrives with Chapter 3', () => {
    const s = newGame(0)
    s.money = D(1e12)
    expect(buyVehicle(s, 'van')).toBe(false)
    s.prestige.franchises = CHAPTER3_FRANCHISES
    expect(buyVehicle(s, 'van')).toBe(true)
    expect(deliveryCapacity(s, getMods(s)).toNumber()).toBe(25)
  })

  it('needs range: helpers and vans cannot reach the continent', () => {
    const s = roadGame('continent')
    expect(canReach(s, region('country'))).toBe(true)
    expect(canReach(s, region('continent'))).toBe(false)
    buyVehicle(s, 'van')
    expect(canReach(s, region('continent'))).toBe(false)
    buyVehicle(s, 'truck')
    expect(canReach(s, region('continent'))).toBe(true)
    expect(canReach(s, region('planet'))).toBe(false)
  })

  it('delivers far away only with a vehicle that can get there', () => {
    const s = roadGame('continent')
    for (let i = 0; i < 50; i++) hireWorker(s, 'kid')
    // New orders arrive at 1500/s; without a truck none of them are served.
    s.regions.continent.orders = D(1000)
    advance(s, 1)
    expect(s.regions.continent.orders.toNumber()).toBeCloseTo(2500)
    buyVehicle(s, 'truck') // 120/s
    advance(s, 1)
    expect(s.regions.continent.orders.toNumber()).toBeCloseTo(4000 - 120, 0)
  })

  it('you cannot carry it to another continent yourself', () => {
    const s = roadGame('continent')
    s.regions.continent.orders = D(10)
    expect(clickDeliver(s, 'continent')).toBe(false)
    s.regions.country.orders = D(10)
    expect(clickDeliver(s, 'country')).toBe(true)
  })

  it('long, slow trips arrive colder; planes keep it hot', () => {
    const s = roadGame('planet')
    const mods = getMods(s)
    expect(freshness(vehicle('van'), region('city'), mods)).toBeGreaterThan(freshness(vehicle('truck'), region('continent'), mods))
    expect(freshness(vehicle('plane'), region('continent'), mods)).toBeGreaterThan(
      freshness(vehicle('truck'), region('continent'), mods),
    )
  })

  it('the planet needs 10 franchises', () => {
    const s = roadGame('continent')
    s.prestige.franchises = 9
    expect(canUnlockRegion(s, 'planet')).toBe(false)
    s.prestige.franchises = 10
    expect(canUnlockRegion(s, 'planet')).toBe(true)
  })

  it('Fleet contracts gives vehicles at once and every run', () => {
    const s = newGame(0)
    s.prestige.crumbs = D(1000)
    expect(buyPerk(s, 'fleetContracts')).toBe(false) // hidden before Chapter 3
    s.prestige.franchises = CHAPTER3_FRANCHISES
    s.prestige.perks.thermos = 1 // its prerequisite in the family tree
    expect(buyPerk(s, 'fleetContracts')).toBe(true)
    expect(s.vehicles.plane).toBe(1)
  })
})
