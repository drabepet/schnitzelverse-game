import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { CHAPTER2_FRANCHISES, PERKS, SHOP_SHELF_SECONDS, SHOP_SUPPLY_RATE } from './content'
import { newGame } from './state'
import { buyFacility, buyIngredient, buyPerk, canUnlockRegion, franchise, hireWorker, unlockRegion } from './actions'
import { canBuyPerk, chapter2Unlocked, farmSupply, getMods, supplyNeeds } from './rules'
import { advance } from './tick'

function farmGame() {
  const s = newGame(0)
  s.prestige.franchises = CHAPTER2_FRANCHISES
  s.money = D(1e9)
  return s
}

describe('corner shop shelves', () => {
  it('start full and limit how much you can buy', () => {
    const s = newGame(0)
    s.money = D(1e9)
    const full = SHOP_SUPPLY_RATE * SHOP_SHELF_SECONDS
    expect(s.shelves.meat.toNumber()).toBe(full)
    buyIngredient(s, 'meat', 10_000)
    expect(s.items.meat.toNumber()).toBe(2 + full) // starter fridge + the whole shelf
    expect(s.shelves.meat.toNumber()).toBe(0)
    expect(s.stats.soldOut).toBeGreaterThan(0)
  })

  it('refill over time', () => {
    const s = newGame(0)
    s.shelves.eggs = D(0)
    advance(s, 10)
    expect(s.shelves.eggs.toNumber()).toBeCloseTo(SHOP_SUPPLY_RATE * 10)
  })
})

describe('the farm', () => {
  it('opens at the Chapter 2 franchise count', () => {
    const s = newGame(0)
    s.money = D(1e9)
    expect(chapter2Unlocked(s)).toBe(false)
    expect(buyFacility(s, 'coop')).toBe(false)
    s.prestige.franchises = CHAPTER2_FRANCHISES
    expect(buyFacility(s, 'coop')).toBe(true)
    expect(s.facilities.coop).toBe(1)
  })

  it('runs whole chains: wheat → flour, pigs → meat', () => {
    const s = farmGame()
    s.autoBuy.target = 1000
    buyFacility(s, 'wheatField')
    buyFacility(s, 'mill')
    buyFacility(s, 'pigFarm')
    buyFacility(s, 'butcher')
    const flour = s.items.flour.toNumber()
    const meat = s.items.meat.toNumber()
    advance(s, 10)
    expect(s.items.flour.toNumber()).toBeGreaterThan(flour + 50)
    expect(s.items.meat.toNumber()).toBeGreaterThan(meat + 50) // 8 meat per pig
  })

  it('fills stock first, so Auntie does not need to shop', () => {
    const s = farmGame()
    s.upgrades.shoppingList = true
    for (const f of ['wheatField', 'mill', 'bakery', 'sunflowers', 'oilPress', 'coop', 'pigFarm', 'butcher'] as const) {
      buyFacility(s, f)
    }
    advance(s, 30)
    const money = s.money.toNumber()
    advance(s, 30)
    expect(s.money.toNumber()).toBe(money)
    expect(s.items.meat.toNumber()).toBeGreaterThan(10)
  })

  it('does not overproduce farm goods', () => {
    const s = farmGame()
    buyFacility(s, 'wheatField')
    advance(s, 600)
    expect(s.items.wheat.toNumber()).toBeLessThanOrEqual(51)
  })

  it('Farm deeds is hidden until the farm, then gives buildings each run', () => {
    const s = newGame(0)
    s.prestige.crumbs = D(1000)
    const deeds = PERKS.find((p) => p.id === 'farmDeeds')!
    expect(canBuyPerk(s, deeds)).toBe(false)
    s.prestige.franchises = CHAPTER2_FRANCHISES
    s.prestige.unlocked = true
    expect(buyPerk(s, 'farmDeeds')).toBe(true)
    expect(s.facilities.coop).toBe(1)
    s.stats.earned = D(1e12)
    franchise(s)
    expect(s.facilities.coop).toBe(1)
    expect(s.facilities.butcher).toBe(1)
  })

  it('farm supply follows the chain upstream', () => {
    const s = farmGame()
    buyFacility(s, 'pigFarm') // 1 pig/s
    buyFacility(s, 'butcher')
    buyFacility(s, 'butcher') // could do 2 pigs/s, but only gets 1
    expect(farmSupply(s, 'meat', getMods(s))).toBe(8)
    expect(farmSupply(s, 'eggs', getMods(s))).toBe(0)
  })

  it('supply needs follow the slowest kitchen step, not each step at full speed', () => {
    const s = farmGame()
    for (let i = 0; i < 10; i++) hireWorker(s, 'cousin') // frying could do 3.5/s
    hireWorker(s, 'uncle')
    hireWorker(s, 'grandma') // breading only 0.35/s
    hireWorker(s, 'kid')
    const need = supplyNeeds(s, getMods(s))
    expect(need.oil).toBeCloseTo(0.3) // delivery 0.3/s is the slowest step
    expect(need.meat).toBeCloseTo(0.3)
  })

  it('reports what each building actually made', () => {
    const s = farmGame()
    buyFacility(s, 'coop')
    s.items.eggs = D(0)
    const flows = advance(s, 1)
    expect(flows.farm.coop?.toNumber()).toBeCloseTo(5)
  })

  it('Mrs. Horáková only suggests growing your own once the farm exists', () => {
    const s = newGame(0)
    s.money = D(1e6)
    for (let i = 0; i < 500; i++) buyIngredient(s, 'meat', 10)
    advance(s, 0.25)
    expect(s.milestones.soldOut).toBeUndefined()
    s.prestige.franchises = CHAPTER2_FRANCHISES
    advance(s, 0.25)
    expect(s.milestones.soldOut).toBe(true)
  })

  it('the region and the country need more franchises', () => {
    const s = farmGame()
    s.reputation = D(1e9)
    for (const r of ['friends', 'street', 'block', 'district', 'town', 'nextTown', 'city'] as const) unlockRegion(s, r)
    expect(canUnlockRegion(s, 'region')).toBe(false)
    s.prestige.franchises = 4
    expect(canUnlockRegion(s, 'region')).toBe(true)
    unlockRegion(s, 'region')
    expect(canUnlockRegion(s, 'country')).toBe(false)
    s.prestige.franchises = 6
    expect(canUnlockRegion(s, 'country')).toBe(true)
  })
})
