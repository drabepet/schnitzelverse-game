import { describe, expect, it } from 'vitest'
import { facilityLook, shopLook, staffTitle, workerLook } from './names'
import { getMods, shopSupplyRate } from './rules'
import { SHOP_SUPPLY_RATE } from './content'
import { newGame } from './state'

describe('names that grow with the business', () => {
  it('helpers start as family and become staff, machines, then sci-fi', () => {
    const s = newGame()
    expect(workerLook(s, 'uncle').name).toBe('Uncle with a mallet')
    expect(staffTitle(s, 'making')).toContain('Family')
    // Crews are promoted by their equipment…
    s.upgrades.tenderizingCrew = true
    expect(workerLook(s, 'uncle').name).toBe('Tenderizing crew')
    expect(workerLook(s, 'uncle').original).toBe('Uncle with a mallet')
    expect(workerLook(s, 'grandma').name).toBe('Grandma')
    s.upgrades.breadingLine = s.upgrades.crumbCascade = s.upgrades.breadingBots = s.upgrades.crumbNebula = true
    expect(workerLook(s, 'grandma').name).toBe('Zero-g crumb nebula')
    // …the panel title by the kitchen's speed.
    s.workers.uncle = s.workers.grandma = s.workers.cousin = 100_000
    expect(staffTitle(s, 'making')).toContain('Orbital')
  })

  it('farm buildings follow the farm’s promotions', () => {
    const s = newGame()
    s.prestige.franchises = 2
    expect(facilityLook(s, 'pigFarm').name).toBe('Pig farm')
    s.upgrades.hydroponics = true
    expect(facilityLook(s, 'pigFarm').name).toBe('Orbital pig habitat')
    s.upgrades.terraforming = true
    expect(facilityLook(s, 'pigFarm').name).toBe('Pig planet')
  })
})

describe('crew equipment', () => {
  it('multiplies its own step only', async () => {
    const { getMods } = await import('./rules')
    const s = newGame()
    s.upgrades.hydraulicPresses = true
    const m = getMods(s)
    expect(m.speed.pound).toBe(4)
    expect(m.speed.bread).toBe(1)
  })
})

describe('the corner shop grows slowly', () => {
  it('each shop upgrade adds a small step, and the bigger ones rename the shop', () => {
    const s = newGame(0)
    expect(shopLook(s).name).toContain('corner shop')
    expect(shopSupplyRate(getMods(s))).toBe(SHOP_SUPPLY_RATE)
    s.upgrades.miniMarket = true
    expect(shopLook(s).name).toContain('mini-market')
    expect(shopSupplyRate(getMods(s))).toBeCloseTo(SHOP_SUPPLY_RATE * 1.3)
    s.upgrades.supermarket = true
    expect(shopLook(s).name).toContain('supermarket')
    s.upgrades.galacticGrocer = true
    expect(shopLook(s).emoji).toBe('🛸')
  })
})
