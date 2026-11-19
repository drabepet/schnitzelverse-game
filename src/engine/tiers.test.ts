import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { UPGRADES } from './content'
import { newGame } from './state'
import { buyVehicle, cookAll, hireWorker, missingForCookAll, quickRestock } from './actions'
import { currentTier, upgradePillar } from './tiers'
import { advance } from './tick'

const upgrade = (id: string) => UPGRADES.find((u) => u.id === id)!

describe('pipeline tab names', () => {
  it('start as corner shop → garage → on foot', () => {
    const s = newGame(0)
    expect(currentTier(s, 'prep').name).toBe('Corner shop')
    expect(currentTier(s, 'making').name).toBe('Garage')
    expect(currentTier(s, 'distribution').name).toBe('On foot')
  })

  it('the garage becomes a house once the kitchen makes 2 per second', () => {
    const s = newGame(0)
    s.money = D(1e9)
    for (let i = 0; i < 6; i++) for (const w of ['uncle', 'grandma', 'cousin'] as const) hireWorker(s, w)
    expect(currentTier(s, 'making').name).toBe('House')
  })

  it('delivery goes from on foot to bike to airline', () => {
    const s = newGame(0)
    s.money = D(1e15)
    hireWorker(s, 'kid')
    expect(currentTier(s, 'distribution').name).toBe('Bike courier')
    s.prestige.franchises = 10
    buyVehicle(s, 'plane')
    expect(currentTier(s, 'distribution').name).toBe('Global airline')
  })

  it('the farm renames the prep tab', () => {
    const s = newGame(0)
    s.prestige.franchises = 2
    expect(currentTier(s, 'prep').name).toBe('Farm')
  })

  it('promotions are badges', () => {
    const s = newGame(0)
    s.money = D(1e9)
    hireWorker(s, 'kid')
    advance(s, 0.25)
    expect(s.badges['tier-distribution-1']).toBeDefined()
  })
})

describe('equipment goes to the tab it improves', () => {
  it('sorts upgrades by what they do', () => {
    expect(upgradePillar(upgrade('heavyMallet'))).toBe('making')
    expect(upgradePillar(upgrade('lard'))).toBe('making')
    expect(upgradePillar(upgrade('cashAndCarry'))).toBe('prep')
    expect(upgradePillar(upgrade('tractor'))).toBe('prep')
    expect(upgradePillar(upgrade('foil'))).toBe('distribution')
    expect(upgradePillar(upgrade('neonSign'))).toBe('distribution')
    expect(upgradePillar(upgrade('gpsRouting'))).toBe('distribution')
  })
})

describe('quick actions', () => {
  it('cook all three steps in one click, restock', () => {
    const s = newGame(0)
    expect(cookAll(s)).toBe(true)
    expect(s.items.hot.toNumber()).toBeCloseTo(1)
    s.items.oil = D(0)
    expect(missingForCookAll(s)).toEqual(['oil'])
    expect(cookAll(s)).toBe(false)
    s.items.meat = D(0)
    expect(quickRestock(s)).toBe(true)
    expect(s.items.meat.toNumber()).toBe(4)
  })
})
