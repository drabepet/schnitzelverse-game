import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { newGame } from './state'
import { advance, tick } from './tick'
import { buyIngredient, buyUpgrade, clickDeliver, clickStage, hireWorker, unlockRegion } from './actions'
import { deserialize, fromExportString, serialize, toExportString } from './save'
import { fmt } from './format'
import { BUFFER_SECONDS, MIN_BUFFERS } from './content'
import { stageBuffer } from './rules'

describe('kitchen', () => {
  it('turns ingredients into a hot schnitzel by hand', () => {
    const s = newGame(0)
    expect(clickStage(s, 'pound')).toBe(true)
    expect(clickStage(s, 'bread')).toBe(true)
    expect(clickStage(s, 'fry')).toBe(true)
    expect(s.items.hot.toNumber()).toBeCloseTo(1)
    expect(s.items.meat.toNumber()).toBeCloseTo(1)
    expect(s.items.oil.toNumber()).toBeCloseTo(2)
  })

  it('refuses to cook without inputs', () => {
    const s = newGame(0)
    s.items.meat = D(0)
    expect(clickStage(s, 'pound')).toBe(false)
    expect(s.items.cutlet.toNumber()).toBe(0)
  })

  it('staff are limited by the slowest input', () => {
    const s = newGame(0)
    s.money = D(1000)
    hireWorker(s, 'uncle')
    s.items.meat = D(0.1)
    tick(s, 10)
    expect(s.items.cutlet.toNumber()).toBeCloseTo(0.1)
    expect(s.items.meat.toNumber()).toBeCloseTo(0)
  })
})

describe('distribution', () => {
  it('delivers hot schnitzel for money and reputation', () => {
    const s = newGame(0)
    s.items.hot = D(1)
    s.regions.neighbours.orders = D(2)
    expect(clickDeliver(s, 'neighbours')).toBe(true)
    expect(s.money.toNumber()).toBeCloseTo(25)
    expect(s.reputation.toNumber()).toBeCloseTo(1)
    expect(s.stats.served.toNumber()).toBeCloseTo(1)
  })

  it('cannot deliver without orders', () => {
    const s = newGame(0)
    s.items.hot = D(5)
    expect(clickDeliver(s, 'neighbours')).toBe(false)
  })

  it('hot schnitzel cools down over time', () => {
    const s = newGame(0)
    s.items.hot = D(10)
    advance(s, 60)
    expect(s.items.hot.toNumber()).toBeLessThan(10)
    expect(s.items.hot.add(s.items.cold).toNumber()).toBeCloseTo(10)
  })

  it('regions need reputation and money to unlock', () => {
    const s = newGame(0)
    s.money = D(1000)
    expect(unlockRegion(s, 'friends')).toBe(false)
    s.reputation = D(20)
    expect(unlockRegion(s, 'friends')).toBe(true)
    expect(s.regions.friends.unlocked).toBe(true)
  })
})

describe('safety nets', () => {
  it("Mum's fridge rescues a broke player who cannot cook", () => {
    const s = newGame(0)
    s.money = D(1)
    for (const i of ['meat', 'flour', 'eggs', 'crumbs', 'oil'] as const) s.items[i] = D(0)
    advance(s, 2)
    expect(s.items.meat.toNumber()).toBe(0)
    advance(s, 5)
    expect(s.items.meat.toNumber()).toBeGreaterThanOrEqual(1)
    expect(s.stats.rescues).toBe(1)
  })

  it('does not rescue a player who can still afford ingredients', () => {
    const s = newGame(0)
    s.money = D(100)
    s.items.meat = D(0)
    advance(s, 30)
    expect(s.stats.rescues).toBe(0)
  })

  it('staff cook to order and stop at the buffer', () => {
    const s = newGame(0)
    s.money = D(1000)
    hireWorker(s, 'uncle')
    s.items.meat = D(100)
    advance(s, 120)
    // Nobody breads yet, so the automatic buffer is the minimum.
    expect(stageBuffer(s, 'pound').toNumber()).toBe(MIN_BUFFERS.pound)
    expect(s.items.cutlet.toNumber()).toBeCloseTo(MIN_BUFFERS.pound, 0)
    expect(s.items.meat.toNumber()).toBeCloseTo(100 - MIN_BUFFERS.pound, 0)
  })

  it('the buffer grows with the next step: a few seconds of what it can use', () => {
    const s = newGame(0)
    s.workers.grandma = 100 // breads 35/s
    expect(stageBuffer(s, 'pound').toNumber()).toBe(Math.ceil(35 * BUFFER_SECONDS))
  })

  it('buffers do not throttle long offline steps', () => {
    const s = newGame(0)
    s.money = D(1e9)
    s.reputation = D(1e6)
    for (const w of ['uncle', 'grandma', 'cousin', 'kid'] as const) for (let i = 0; i < 30; i++) hireWorker(s, w)
    buyUpgrade(s, 'shoppingList')
    s.regions.town.unlocked = true
    const fine = deserialize(serialize(s))
    advance(s, 600, 0.25)
    advance(fine, 600, 6)
    const ratio = fine.stats.served.div(s.stats.served).toNumber()
    expect(ratio).toBeGreaterThan(0.9)
    expect(ratio).toBeLessThan(1.1)
  })
})

describe('automation', () => {
  it('a fully staffed garage runs on its own', () => {
    const s = newGame(0)
    s.money = D(10_000)
    s.reputation = D(100)
    for (const w of ['uncle', 'grandma', 'cousin', 'kid'] as const) hireWorker(s, w)
    buyUpgrade(s, 'shoppingList')
    const before = s.stats.served
    advance(s, 600)
    expect(s.stats.served.sub(before).toNumber()).toBeGreaterThan(30)
    expect(s.milestones.firstServed).toBe(true)
  })

  it('buying packs costs money', () => {
    const s = newGame(0)
    expect(buyIngredient(s, 'meat')).toBe(true)
    expect(s.money.toNumber()).toBe(14)
    expect(s.items.meat.toNumber()).toBe(6)
  })
})

describe('saves', () => {
  it('round-trips through JSON and export strings', () => {
    const s = newGame(0)
    s.money = D('1e500')
    s.upgrades.foil = true
    s.log.push({ t: 1, text: 'Řízek s bramborovým salátem 🥔' })
    const back = deserialize(serialize(s))
    expect(back.money.eq(D('1e500'))).toBe(true)
    expect(back.upgrades.foil).toBe(true)
    const viaExport = fromExportString(toExportString(s))
    expect(viaExport.log.at(-1)?.text).toBe('Řízek s bramborovým salátem 🥔')
  })

  it('fills in missing fields from defaults', () => {
    const back = deserialize(JSON.stringify({ money: 'D:42' }))
    expect(back.money.toNumber()).toBe(42)
    expect(back.items.meat.toNumber()).toBe(2)
    expect(back.regions.neighbours.unlocked).toBe(true)
  })
})

describe('format', () => {
  it('formats small, large and huge numbers', () => {
    expect(fmt(5)).toBe('5')
    expect(fmt(1.234)).toBe('1.23')
    expect(fmt(1234)).toBe('1.23K')
    expect(fmt(5_600_000)).toBe('5.60M')
    expect(fmt(D('1e50'))).toBe('100.00Qid')
    expect(fmt(D('1e70'))).toBe('1.00e70')
  })
})
