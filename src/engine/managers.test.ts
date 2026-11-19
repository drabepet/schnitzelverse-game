import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { managerActive, runManagers, savingFor, setManager } from './automation'
import { advance } from './tick'
import { newGame, type GameState } from './state'

function withManagers(...ids: Parameters<typeof managerActive>[1][]): GameState {
  const s = newGame()
  for (const id of ids) s.prestige.perks[id] = 1
  return s
}

describe('managers', () => {
  it('do nothing until bought', () => {
    const s = newGame()
    s.money = D(1e6)
    runManagers(s, 5)
    expect(Object.values(s.workers).every((n) => n === 0)).toBe(true)
  })

  it('the family manager hires for the slowest step, spending at most 10% per hire', () => {
    const s = withManagers('familyManager')
    s.money = D(10_000)
    runManagers(s, 1)
    const hired = Object.values(s.workers).reduce((a, b) => a + b, 0)
    expect(hired).toBeGreaterThan(0)
    expect(s.money.gt(1000)).toBe(true)
  })

  it('can be switched off', () => {
    const s = withManagers('familyManager')
    setManager(s, 'familyManager', false)
    s.money = D(10_000)
    runManagers(s, 1)
    expect(Object.values(s.workers).every((n) => n === 0)).toBe(true)
    setManager(s, 'familyManager', true)
    expect(managerActive(s, 'familyManager')).toBe(true)
  })

  it('the quartermaster buys cheap equipment', () => {
    const s = withManagers('quartermaster')
    s.money = D(1e5)
    s.reputation = D(1e6)
    runManagers(s, 1)
    expect(Object.keys(s.upgrades).length).toBeGreaterThan(0)
  })

  it('the estate agent unlocks places and makes the others save for the next one', () => {
    const s = withManagers('estateAgent', 'familyManager')
    s.reputation = D(1e9)
    s.money = D(1e3)
    s.run.earned = D(1e6)
    s.run.time = 3600
    runManagers(s, 1)
    expect(s.regions.friends.unlocked).toBe(true)
    expect(savingFor(s)).not.toBeNull()
    const hired = Object.values(s.workers).reduce((a, b) => a + b, 0)
    expect(hired).toBe(0)
  })

  it('the farm manager builds farm buildings in chapter 2', () => {
    const s = withManagers('farmManager')
    s.prestige.franchises = 2
    s.workers.uncle = 20
    s.workers.grandma = 20
    s.workers.cousin = 20
    s.workers.kid = 20
    s.money = D(1e7)
    runManagers(s, 1)
    const built = Object.values(s.facilities).reduce((a, b) => a + b, 0)
    expect(built).toBeGreaterThan(0)
  })

  it('a managed game keeps growing on its own', () => {
    const s = withManagers('familyManager', 'quartermaster', 'estateAgent')
    s.workers.uncle = 1
    s.workers.grandma = 1
    s.workers.cousin = 1
    s.workers.kid = 1
    s.upgrades.shoppingList = true
    advance(s, 1800, 0.25)
    expect(Object.values(s.workers).reduce((a, b) => a + b, 0)).toBeGreaterThan(8)
    expect(s.regions.friends.unlocked).toBe(true)
  })
})

describe('knocking on doors', () => {
  it('adds one order to the neighbours only, then needs a breather', async () => {
    const { knockOnDoors, knockWait } = await import('./actions')
    const { tick } = await import('./tick')
    const s = newGame()
    s.regions.friends.unlocked = true
    expect(knockOnDoors(s)).toBe(true)
    expect(s.regions.neighbours.orders.toNumber()).toBe(1)
    expect(s.regions.friends.orders.toNumber()).toBe(0)
    expect(knockOnDoors(s)).toBe(false)
    expect(knockWait(s)).toBeGreaterThan(4)
    for (let i = 0; i < 60; i++) tick(s, 0.1)
    expect(knockOnDoors(s)).toBe(true)
  })
})
