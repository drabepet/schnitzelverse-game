import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { STAGE_IDS, UPGRADES } from './content'
import { FARM_PLACES } from './farmGear'
import { KITCHEN_LINK_MULT, KITCHEN_RUNG_MULT } from './kitchenGear'
import { newGame } from './state'
import { canBuyUpgrade, farmGoalBonus, getMods, taskCapacity, upgradeUnlocked } from './rules'
import { buyUpgrade } from './actions'
import { stationOf } from './tiers'

const gear = UPGRADES.filter((u) => u.station)

describe('kitchen gear', () => {
  it('every station has one rung per place, each in its own column', () => {
    for (const id of STAGE_IDS) expect(gear.filter((u) => u.station === id)).toHaveLength(FARM_PLACES.length)
    for (const u of gear) expect(stationOf(u)).toBe(u.station)
    expect(new Set(UPGRADES.map((u) => u.id)).size).toBe(UPGRADES.length)
  })

  it('a rung unlocks once its place is reached in this run', () => {
    const s = newGame(0)
    s.money = D(1e30)
    const rung = UPGRADES.find((u) => u.id === 'bread_city')!
    expect(upgradeUnlocked(s, rung)).toBe(false)
    s.regions.city.unlocked = true
    expect(canBuyUpgrade(s, rung)).toBe(true)
  })

  it('speeds up its own step; a link speeds up the next one', () => {
    const s = newGame(0)
    s.workers.uncle = 5
    s.workers.grandma = 5
    s.money = D(1e12)
    for (const r of ['town', 'region'] as const) s.regions[r].unlocked = true
    const pound = taskCapacity(s, 'pound', getMods(s)).toNumber()
    const bread = taskCapacity(s, 'bread', getMods(s)).toNumber()
    expect(buyUpgrade(s, 'pound_town')).toBe(true)
    expect(taskCapacity(s, 'pound', getMods(s)).toNumber()).toBeCloseTo(pound * KITCHEN_RUNG_MULT.town)
    expect(buyUpgrade(s, 'pound_region')).toBe(true) // paper-thin cutlets: breading goes faster
    expect(taskCapacity(s, 'bread', getMods(s)).toNumber()).toBeCloseTo(bread * KITCHEN_LINK_MULT)
  })

  it('quality rungs raise the price', () => {
    expect(UPGRADES.find((u) => u.id === 'fry_country')!.effects[0].kind).toBe('price')
  })
})

describe('kitchen count goals', () => {
  it('more helpers at a station make every one of them faster', () => {
    const s = newGame(0)
    s.workers.cousin = 9
    const nine = taskCapacity(s, 'fry', getMods(s)).toNumber() / 9
    s.workers.cousin = 10
    const ten = taskCapacity(s, 'fry', getMods(s)).toNumber() / 10
    expect(ten / nine).toBeCloseTo(farmGoalBonus(10))
  })
})
