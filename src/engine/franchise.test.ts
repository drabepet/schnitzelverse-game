import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { CRUMB_DIVISOR, HEAD_START_BASE, REGIONS } from './content'
import { newGame } from './state'
import { buyPerk, canUnlockRegion, franchise, hireWorker, unlockRegion } from './actions'
import { canFranchise, crumbProgress, earningsCrumbs, franchiseBlocker, getMods, pendingCrumbs, perkCost } from './rules'
import { deserialize } from './save'
import { advance } from './tick'
import { PERKS } from './content'

/** A game that has just reached the town with a given run income. */
function readyToFranchise(earned: number) {
  const s = newGame(0)
  s.money = D(1e9)
  s.reputation = D(1e9)
  for (const r of ['friends', 'street', 'block', 'district', 'town'] as const) unlockRegion(s, r)
  s.stats.earned = D(earned)
  return s
}

describe('franchise', () => {
  it('is locked until the town is reached', () => {
    const s = newGame(0)
    s.stats.earned = D(1e9)
    expect(canFranchise(s)).toBe(false)
    expect(franchise(s)).toBe(false)
  })

  it('reaching the town unlocks it', () => {
    const s = readyToFranchise(0)
    expect(s.prestige.unlocked).toBe(true)
    // Nothing earned yet, but the town is your furthest place: a frontier sale for 1.
    expect(pendingCrumbs(s).toNumber()).toBe(1)
    expect(canFranchise(s)).toBe(true)
  })

  it('gives sqrt(earned / divisor) Golden Crumbs', () => {
    const s = readyToFranchise(CRUMB_DIVISOR * 25)
    expect(pendingCrumbs(s).toNumber()).toBe(5)
    s.stats.earned = D(CRUMB_DIVISOR * 24.9)
    expect(pendingCrumbs(s).toNumber()).toBe(4)
  })

  it('resets the run and keeps permanent progress', () => {
    const s = readyToFranchise(CRUMB_DIVISOR * 16)
    hireWorker(s, 'grandma')
    s.upgrades.foil = true
    s.settings.buyAmount = 10
    s.stats.served = D(1234)
    expect(franchise(s)).toBe(true)

    expect(s.prestige.crumbs.toNumber()).toBe(4)
    expect(s.prestige.totalCrumbs.toNumber()).toBe(4)
    expect(s.prestige.franchises).toBe(1)
    expect(s.prestige.unlocked).toBe(true)
    expect(s.money.toNumber()).toBe(20)
    expect(s.reputation.toNumber()).toBe(0)
    expect(s.workers.grandma).toBe(0)
    expect(s.upgrades.foil).toBeUndefined()
    expect(s.regions.town.unlocked).toBe(false)
    expect(s.run.earned.toNumber()).toBe(0)
    expect(s.settings.buyAmount).toBe(10)
    expect(s.stats.served.toNumber()).toBe(1234)
  })

  it('crumbs come from lifetime earnings; short of your furthest place there is nothing to sell', () => {
    const s = readyToFranchise(CRUMB_DIVISOR * 25)
    s.regions.nextTown.unlocked = true // furthest place ever: the next town
    s.stats.bestPlace = REGIONS.findIndex((r) => r.id === 'nextTown')
    expect(franchise(s)).toBe(true)
    expect(s.prestige.crumbs.toNumber()).toBe(5)
    // Straight back to the town without earning anything new: nothing to collect.
    for (const r of ['friends', 'street', 'block', 'district', 'town'] as const) s.regions[r].unlocked = true
    expect(pendingCrumbs(s).toNumber()).toBe(0)
    expect(franchise(s)).toBe(false)
    // Lifetime earnings reach 36 × divisor: worth 6 in total, 1 new.
    s.stats.earned = D(CRUMB_DIVISOR * 36)
    expect(pendingCrumbs(s).toNumber()).toBe(1)
  })

  it('a frontier sale pays 5% of lifetime crumbs, as a bonus that does not delay earnings', () => {
    const s = readyToFranchise(CRUMB_DIVISOR * 400) // worth 20
    expect(franchise(s)).toBe(true)
    expect(s.prestige.totalCrumbs.toNumber()).toBe(20)
    // A huge run is already paid out; back at the furthest place (the town) we can still sell.
    for (const r of ['friends', 'street', 'block', 'district', 'town'] as const) s.regions[r].unlocked = true
    expect(earningsCrumbs(s).toNumber()).toBe(0)
    expect(pendingCrumbs(s).toNumber()).toBe(1) // max(1, 5% of 20)
    expect(franchise(s)).toBe(true)
    expect(s.prestige.bonusCrumbs.toNumber()).toBe(1)
    // The bonus doesn't count against earnings: 21² × divisor earned gives the 21st crumb.
    s.stats.earned = D(CRUMB_DIVISOR * 441)
    expect(earningsCrumbs(s).toNumber()).toBe(1)
  })

  it('remembers the furthest place ever reached', () => {
    const s = readyToFranchise(CRUMB_DIVISOR)
    expect(REGIONS[s.stats.bestPlace].id).toBe('town')
    expect(franchiseBlocker(s)).toBeNull()
  })

  it('later places need franchises', () => {
    const s = readyToFranchise(CRUMB_DIVISOR)
    expect(canUnlockRegion(s, 'nextTown')).toBe(false)
    s.prestige.franchises = 1
    expect(canUnlockRegion(s, 'nextTown')).toBe(true)
    expect(canUnlockRegion(s, 'city')).toBe(false)
  })
})

describe('perks', () => {
  it('cost Golden Crumbs and get more expensive', () => {
    const s = newGame(0)
    s.prestige.crumbs = D(3)
    const recipe = PERKS.find((p) => p.id === 'familyRecipe')!
    expect(buyPerk(s, 'familyRecipe')).toBe(true)
    expect(s.prestige.crumbs.toNumber()).toBe(2)
    expect(perkCost(s, recipe).toNumber()).toBe(2)
    expect(getMods(s).price).toBeCloseTo(1.25)
    expect(buyPerk(s, 'familyRecipe')).toBe(true)
    expect(buyPerk(s, 'familyRecipe')).toBe(false)
  })

  it('respect max level', () => {
    const s = newGame(0)
    s.prestige.crumbs = D(100)
    expect(buyPerk(s, 'auntieRemembers')).toBe(true)
    expect(buyPerk(s, 'auntieRemembers')).toBe(false)
    expect(s.upgrades.shoppingList).toBe(true)
  })

  it('start-of-run perks apply after a franchise', () => {
    const s = readyToFranchise(CRUMB_DIVISOR * 4)
    s.prestige.crumbs = D(100)
    buyPerk(s, 'headStart')
    buyPerk(s, 'loyalFamily')
    buyPerk(s, 'oldConnections')
    buyPerk(s, 'auntieRemembers')
    franchise(s)
    expect(s.money.toNumber()).toBe(20 + HEAD_START_BASE)
    expect(s.workers.uncle).toBe(1)
    expect(s.workers.kid).toBe(1)
    expect(s.regions.friends.unlocked).toBe(true)
    expect(s.regions.street.unlocked).toBe(false)
    expect(s.upgrades.shoppingList).toBe(true)
  })

  it('Old connections bought mid-run never unlocks expensive places for free', () => {
    const s = readyToFranchise(0)
    s.regions.town.unlocked = false
    s.prestige.crumbs = D(100)
    buyPerk(s, 'oldConnections')
    expect(s.regions.town.unlocked).toBe(false)
    expect(s.regions.friends.unlocked).toBe(true)
  })

  it('Head start pays out immediately when bought', () => {
    const s = newGame(0)
    s.prestige.crumbs = D(100)
    buyPerk(s, 'headStart')
    expect(s.money.toNumber()).toBe(20 + HEAD_START_BASE)
    buyPerk(s, 'headStart')
    expect(s.money.toNumber()).toBe(20 + HEAD_START_BASE * 5)
  })

  it('Loyal family is affordable with the first crumb', () => {
    const s = newGame(0)
    s.prestige.crumbs = D(1)
    expect(buyPerk(s, 'loyalFamily')).toBe(true)
  })
})

describe("Auntie's reserve", () => {
  it('keeps money in the till', () => {
    const s = newGame(0)
    s.upgrades.shoppingList = true
    s.money = D(30)
    s.items.flour = D(2)
    advance(s, 0.25)
    expect(s.money.toNumber()).toBeGreaterThanOrEqual(25)
  })

  it('still buys one pack when an ingredient runs out completely', () => {
    const s = newGame(0)
    s.upgrades.shoppingList = true
    s.money = D(20)
    s.items.meat = D(0)
    advance(s, 0.25)
    expect(s.items.meat.toNumber()).toBe(4)
    expect(s.money.toNumber()).toBe(14)
  })
})

describe('old saves', () => {
  it('credit earnings and unlock the franchise for saves that reached the town', () => {
    const old = { money: 'D:5', stats: { earned: 'D:200000', playtime: 3000 }, milestones: { town: true } }
    const s = deserialize(JSON.stringify(old))
    expect(s.prestige.unlocked).toBe(true)
    expect(s.run.earned.toNumber()).toBe(200000)
    expect(canFranchise(s)).toBe(true)
  })
})

describe('records', () => {
  it('remember the fastest run to the town and count this run’s deliveries', () => {
    const s = readyToFranchise(0)
    expect(s.stats.bestTownTime).toBe(0) // reached at run time 0 counts as "not yet"
    s.regions.town.unlocked = false
    s.run.time = 600
    unlockRegion(s, 'town')
    expect(s.stats.bestTownTime).toBe(600)
    s.regions.town.unlocked = false
    s.run.time = 900
    unlockRegion(s, 'town')
    expect(s.stats.bestTownTime).toBe(600)

    s.items.hot = D(2)
    s.items.cold = D(1)
    s.regions.neighbours.orders = D(3)
    advance(s, 0.01)
    hireWorker(s, 'kid')
    advance(s, 20)
    expect(s.run.served.toNumber()).toBeGreaterThan(0)
    expect(s.run.servedCold.toNumber()).toBeGreaterThanOrEqual(0)
  })
})

describe('next Golden Crumb progress', () => {
  it('goes from 0 to 1 between two crumbs', () => {
    const s = newGame(0)
    s.stats.earned = D(CRUMB_DIVISOR * 4) // exactly 2 crumbs' worth
    expect(crumbProgress(s).fraction).toBeCloseTo(0)
    expect(crumbProgress(s).remaining.toNumber()).toBe(CRUMB_DIVISOR * 5) // 3² - 2²
    s.stats.earned = D(CRUMB_DIVISOR * 6.5) // halfway to 9
    expect(crumbProgress(s).fraction).toBeCloseTo(0.5)
  })
})

describe('run history', () => {
  it('records each finished run and the personal bests', async () => {
    const { newGame } = await import('./state')
    const { franchise } = await import('./actions')
    const { D } = await import('./decimal')
    const s = newGame(0)
    s.prestige.unlocked = true
    s.regions.town.unlocked = true
    s.stats.earned = D(1e7)
    s.run.earned = D(1e7)
    s.run.served = D(5000)
    s.run.time = 1800
    expect(franchise(s)).toBe(true)
    expect(s.stats.runs).toHaveLength(1)
    const r = s.stats.runs[0]
    expect(r.time).toBe(1800)
    expect(r.served).toBe(5000)
    expect(r.crumbs).toBeGreaterThan(0)
    expect(s.stats.bestSale.toNumber()).toBe(r.crumbs)
    expect(s.stats.bestRunServed.toNumber()).toBe(5000)
    expect(s.stats.longestRun).toBe(1800)
  })
})
