import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { CHAPTER3_FRANCHISES, CRITIC_STARS, REGIONS, STAR_PRICE, UPGRADES, VEHICLES } from './content'
import { newGame, type GameState } from './state'
import { tick } from './tick'
import { buyUpgrade, franchise, setFitOut } from './actions'
import { criticStars, farmGoalBonus, freshness, getMods, placePrice, regionPrice, vehicleCapacity } from './rules'
import { deserialize, serialize } from './save'

const place = (id: string) => REGIONS.find((r) => r.id === id)!
const vehicle = (id: string) => VEHICLES.find((v) => v.id === id)!

/** Chapter 3 with the city open, lots of hot schnitzel and orders there, and a van. */
function roadRun(): GameState {
  const s = newGame(0)
  s.prestige.franchises = CHAPTER3_FRANCHISES
  for (const id of ['nextTown', 'city', 'region', 'country'] as const) s.regions[id].unlocked = true
  for (const r of REGIONS) s.regions[r.id].orders = D(r.id === 'city' ? 1e9 : 0)
  s.items.hot = D(1e9)
  s.vehicles.van = 10
  return s
}

describe('food critics', () => {
  it('the hot share moves towards what arrives hot, over a few minutes', () => {
    const s = roadRun()
    // Plenty of fresh hot schnitzel every second (the kitchen keeps up).
    const run = (seconds: number) => {
      for (let i = 0; i < seconds; i++) {
        s.items.hot = D(1e9)
        s.items.cold = D(0)
        tick(s, 1)
      }
    }
    run(60)
    const after1min = s.regions.city.critic
    expect(after1min).toBeGreaterThan(0.1)
    run(1200)
    // A van keeps about exp(-60/1600) hot at the city.
    expect(s.regions.city.critic).toBeGreaterThan(after1min)
    expect(s.regions.city.critic).toBeCloseTo(freshness(vehicle('van'), place('city'), getMods(s)), 1)
  })

  it('stars follow the thresholds, and only from Chapter 3', () => {
    const s = roadRun()
    const city = place('city')
    s.regions.city.critic = CRITIC_STARS[0] - 0.01
    expect(criticStars(s, city)).toBe(0)
    s.regions.city.critic = CRITIC_STARS[0]
    expect(criticStars(s, city)).toBe(1)
    s.regions.city.critic = CRITIC_STARS[1]
    expect(criticStars(s, city)).toBe(2)
    s.regions.city.critic = 1
    expect(criticStars(s, city)).toBe(3)
    s.prestige.franchises = CHAPTER3_FRANCHISES - 1
    expect(criticStars(s, city)).toBe(0)
  })

  it('each star puts that place’s price up, and only that place’s', () => {
    const s = roadRun()
    const mods = getMods(s)
    s.regions.city.critic = 1
    expect(placePrice(s, place('city'), mods).toNumber()).toBeCloseTo(regionPrice(place('city'), mods).toNumber() * STAR_PRICE ** 3)
    expect(placePrice(s, place('region'), mods).toNumber()).toBe(regionPrice(place('region'), mods).toNumber())
  })

  it('cold deliveries (solar sails) earn no stars', () => {
    const s = newGame(0)
    s.prestige.franchises = 20
    s.milestones.planet = true
    // Open up to Mars only, so the cruiser flies there.
    for (const r of REGIONS.slice(0, REGIONS.indexOf(place('mars')) + 1)) s.regions[r.id].unlocked = true
    for (const r of REGIONS) s.regions[r.id].orders = D(r.id === 'mars' ? 1e9 : 0)
    s.vehicles.cruiser = 1
    s.items.hot = D(1e9)
    s.regions.mars.critic = 0.9
    for (let i = 0; i < 900; i++) tick(s, 1)
    expect(s.regions.mars.critic).toBeLessThan(0.1)
    expect(criticStars(s, place('mars'))).toBe(0)
  })
})

describe('fit-outs', () => {
  it('cargo carries twice as much and cools faster; express keeps food hot further', () => {
    const s = roadRun()
    const van = vehicle('van')
    const city = place('city')
    const cap = vehicleCapacity(s, van, getMods(s)).toNumber()
    const fresh = freshness(van, city, getMods(s))
    setFitOut(s, 'van', 'cargo')
    expect(vehicleCapacity(s, van, getMods(s)).toNumber()).toBeCloseTo(cap * 2)
    expect(freshness(van, city, getMods(s))).toBeLessThan(fresh)
    setFitOut(s, 'van', 'express')
    expect(vehicleCapacity(s, van, getMods(s)).toNumber()).toBeCloseTo(cap)
    expect(freshness(van, city, getMods(s))).toBeGreaterThan(fresh)
    // Only the van: the truck is as it was.
    expect(vehicleCapacity(s, vehicle('truck'), getMods(s)).toNumber()).toBe(0)
    expect(s.fitOutsTried).toEqual({ cargo: true, express: true })
  })

  it('the choice survives a franchise', () => {
    const s = roadRun()
    setFitOut(s, 'truck', 'cargo')
    s.regions.town.unlocked = true
    s.run.earned = D(1e12)
    s.stats.earned = D(1e12)
    s.prestige.unlocked = true
    expect(franchise(s)).toBe(true)
    expect(s.fitOuts.truck).toBe('cargo')
  })
})

describe('fleet gear and count goals', () => {
  it('has four rungs per vehicle, and a rung only helps its own vehicle', () => {
    const gear = UPGRADES.filter((u) => u.vehicle)
    expect(gear).toHaveLength(VEHICLES.length * 4)
    const s = roadRun()
    s.vehicles.truck = 5
    s.money = D(1e12)
    const rack = gear.find((u) => u.vehicle === 'van' && u.effects.some((e) => e.kind === 'vehicle' && e.capacity))!
    const van = vehicleCapacity(s, vehicle('van'), getMods(s)).toNumber()
    const truck = vehicleCapacity(s, vehicle('truck'), getMods(s)).toNumber()
    expect(buyUpgrade(s, rack.id)).toBe(true)
    expect(vehicleCapacity(s, vehicle('van'), getMods(s)).toNumber()).toBeGreaterThan(van)
    expect(vehicleCapacity(s, vehicle('truck'), getMods(s)).toNumber()).toBe(truck)
  })

  it('gear goes only on a vehicle you own', () => {
    const s = roadRun()
    s.money = D(1e12)
    const truckGear = UPGRADES.find((u) => u.vehicle === 'truck' && u.requires?.place === 'city')!
    expect(buyUpgrade(s, truckGear.id)).toBe(false)
    s.vehicles.truck = 1
    expect(buyUpgrade(s, truckGear.id)).toBe(true)
  })

  it('count goals make every vehicle of that kind carry more', () => {
    const s = roadRun()
    s.vehicles.van = 9
    const nine = vehicleCapacity(s, vehicle('van'), getMods(s)).toNumber() / 9
    s.vehicles.van = 10
    const ten = vehicleCapacity(s, vehicle('van'), getMods(s)).toNumber() / 10
    expect(ten / nine).toBeCloseTo(farmGoalBonus(10))
  })
})

describe('critics in old saves', () => {
  it('an older save loads with no stars and no fit-outs', () => {
    const old = JSON.parse(serialize(roadRun()))
    for (const r of Object.values(old.regions) as Record<string, unknown>[]) delete r.critic
    delete old.fitOuts
    delete old.fitOutsTried
    const s = deserialize(JSON.stringify(old))
    expect(s.regions.city.critic).toBe(0)
    expect(s.fitOuts).toEqual({})
  })

  it('the critics’ records add no bonus', async () => {
    const { BADGES } = await import('./badges')
    const { BADGE_BONUS } = await import('./badgeBonus')
    const critics = BADGES.filter((b) => b.category === 'critics')
    expect(critics.length).toBeGreaterThanOrEqual(8)
    for (const b of critics) expect(BADGE_BONUS[b.id]).toBeUndefined()
  })
})
