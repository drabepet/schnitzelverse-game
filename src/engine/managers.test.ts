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

describe('Mum saving up', () => {
  /** A run at the block, the district (needs ⭐2,500) next, earning ~$10/s. */
  function atTheBlock() {
    const s = withManagers('estateAgent', 'familyManager')
    for (const r of ['friends', 'street', 'block'] as const) s.regions[r].unlocked = true
    s.reputation = D(1e6)
    s.run.time = 600
    s.run.earned = D(6000)
    return s
  }

  it('does not pause anyone when the place is far away', async () => {
    const { savingStatus } = await import('./automation')
    const s = atTheBlock()
    s.money = D(1000) // district: $7,500, ~11 minutes away at $10/s
    expect(savingStatus(s)).toBeNull()
    runManagers(s, 1)
    expect(Object.values(s.workers).reduce((a, b) => a + b, 0)).toBeGreaterThan(0)
  })

  it('pauses the others only when the money is a few minutes away', async () => {
    const { savingStatus } = await import('./automation')
    const s = atTheBlock()
    s.money = D(6000) // $1,500 to go, ~2.5 minutes
    const saving = savingStatus(s)
    expect(saving?.region.id).toBe('district')
    expect(saving!.eta).toBeLessThan(300)
    runManagers(s, 1)
    expect(Object.values(s.workers).reduce((a, b) => a + b, 0)).toBe(0)
    expect(s.money.toNumber()).toBe(6000)
  })
})

describe('Grandma and equipment', () => {
  /** 30 kids on bikes, delivery is the slowest step, the cargo bike (delivery ×3, $5K) is unlocked. */
  function thirtyKids() {
    const s = withManagers('familyManager')
    s.workers.kid = 30
    Object.assign(s.workers, { uncle: 200, grandma: 200, cousin: 200 })
    for (const r of ['friends', 'street', 'block', 'district', 'town'] as const) s.regions[r].unlocked = true
    s.reputation = D(1e6)
    s.upgrades.shoppingList = true
    s.upgrades.bikeBasket = true // the cheaper ×2 would win otherwise
    s.run.time = 600
    s.run.earned = D(600_000) // $1,000/s
    return s
  }

  it('buys equipment instead of another helper when it does more per dollar', async () => {
    const { familyNextStep } = await import('./automation')
    const s = thirtyKids()
    s.money = D(50_000)
    expect(familyNextStep(s)?.kind).toBe('equip')
    runManagers(s, 1)
    expect(s.upgrades.cargoBike).toBe(true)
  })

  it('waits for it rather than hiring when it is a few minutes away', async () => {
    const { familyNextStep } = await import('./automation')
    const s = thirtyKids()
    s.money = D(1_000)
    const step = familyNextStep(s)
    expect(step?.kind).toBe('wait')
    runManagers(s, 1)
    expect(s.workers.kid).toBe(30)
  })
})

describe('Grandpa and farm equipment', () => {
  /** A big kitchen, a full farm except 20 pig farms: meat is short, Better feed (animals ×2, $400K) is unlocked. */
  function shortOfPigs() {
    const s = withManagers('farmManager')
    s.prestige.franchises = 2
    s.reputation = D(1e6)
    Object.assign(s.workers, { uncle: 1000, grandma: 1000, cousin: 1000, kid: 1000 })
    for (const f of Object.keys(s.facilities) as (keyof typeof s.facilities)[]) s.facilities[f] = 200
    s.facilities.pigFarm = 20
    s.upgrades.shoppingList = true
    s.run.time = 600
    s.run.earned = D(6e6) // $10K/s
    return s
  }

  it('buys farm equipment instead of another building when it does more per dollar', async () => {
    const { farmNextStep } = await import('./automation')
    const s = shortOfPigs()
    s.money = D(1e6)
    const step = farmNextStep(s)
    expect(step?.kind).toBe('equip')
    expect(step?.kind === 'equip' && step.upgrade.id).toBe('betterFeed')
    runManagers(s, 1)
    expect(s.upgrades.betterFeed).toBe(true)
    expect(s.facilities.pigFarm).toBe(20)
  })

  it('waits for it when it is a few minutes away', async () => {
    const { farmNextStep } = await import('./automation')
    const s = shortOfPigs()
    s.money = D(100_000)
    expect(farmNextStep(s)?.kind).toBe('wait')
    runManagers(s, 1)
    expect(s.facilities.pigFarm).toBe(20)
  })
})
