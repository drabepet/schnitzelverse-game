import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { FACILITIES, FARM_GOAL_MULT, UPGRADES } from './content'
import { FARM_PLACES, RUNG_MULT } from './farmGear'
import { newGame } from './state'
import { canBuyUpgrade, facilityCapacity, farmGoalBonus, getMods, nextFarmGoal, upgradeUnlocked } from './rules'
import { buyUpgrade } from './actions'

const gear = UPGRADES.filter((u) => u.building)

describe('farm gear', () => {
  it('every building has one rung per place, and every chain a farm hand', () => {
    // From the place each building opens at: the town for the farm, Mars or the next star for star paprika.
    for (const f of FACILITIES) {
      const from = FARM_PLACES.indexOf((f.requires?.place ?? 'town') as (typeof FARM_PLACES)[number])
      expect(gear.filter((u) => u.building === f.id)).toHaveLength(FARM_PLACES.length - from)
    }
    expect(UPGRADES.filter((u) => u.chain)).toHaveLength(5)
    expect(new Set(UPGRADES.map((u) => u.id)).size).toBe(UPGRADES.length)
  })

  it('a rung unlocks once its place is reached in this run', () => {
    const s = newGame(0)
    s.prestige.franchises = 2
    s.money = D(1e30)
    const rung = UPGRADES.find((u) => u.id === 'pigFarm_continent')!
    expect(upgradeUnlocked(s, rung)).toBe(false)
    s.regions.continent.unlocked = true
    expect(canBuyUpgrade(s, rung)).toBe(true)
  })

  it('speeds up its own building, on top of group equipment', () => {
    const s = newGame(0)
    s.prestige.franchises = 2
    s.facilities.pigFarm = 5
    const pigs = FACILITIES.find((f) => f.id === 'pigFarm')!
    const before = facilityCapacity(s, pigs, getMods(s)).toNumber()
    s.regions.town.unlocked = true
    s.money = D(1e9)
    expect(buyUpgrade(s, 'pigFarm_town')).toBe(true)
    expect(facilityCapacity(s, pigs, getMods(s)).toNumber()).toBeCloseTo(before * RUNG_MULT.town)
  })

  it('links help another chain, quality raises the price', () => {
    const manure = UPGRADES.find((u) => u.id === 'pigFarm_region')!
    expect(manure.effects.every((e) => e.kind === 'building' && e.facility !== 'pigFarm')).toBe(true)
    const paddock = UPGRADES.find((u) => u.id === 'pigFarm_country')!
    expect(paddock.effects[0].kind).toBe('price')
  })
})

describe('count goals', () => {
  it('each goal reached makes the building faster', () => {
    expect(farmGoalBonus(9)).toBe(1)
    expect(farmGoalBonus(10)).toBe(FARM_GOAL_MULT)
    expect(farmGoalBonus(30)).toBeCloseTo(FARM_GOAL_MULT ** 2)
    expect(nextFarmGoal(30)).toBe(50)
    expect(nextFarmGoal(1e9)).toBeNull()
  })
})
