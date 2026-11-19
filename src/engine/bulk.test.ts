import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { hireWorker } from './actions'
import { bulkBuy, workerCost } from './rules'
import { newGame } from './state'

describe('buying in bulk', () => {
  it('×10 costs the sum of ten single purchases', () => {
    const plan = bulkBuy(15, 1.15, 3, D(1e9), 10)
    let sum = 0
    for (let i = 3; i < 13; i++) sum += 15 * 1.15 ** i
    expect(plan.count).toBe(10)
    expect(plan.cost.toNumber()).toBeCloseTo(sum, 6)
  })

  it('Max buys exactly as many as the money covers', () => {
    const money = D(1000)
    const plan = bulkBuy(15, 1.15, 0, money, 'max')
    expect(plan.affordable).toBe(true)
    expect(bulkBuy(15, 1.15, 0, money, plan.count + 1 as 10).cost.gt(money)).toBe(true)
  })

  it('Max shows the price of one when nothing is affordable', () => {
    const plan = bulkBuy(15, 1.15, 0, D(5), 'max')
    expect(plan.count).toBe(1)
    expect(plan.affordable).toBe(false)
  })

  it('handles flat prices', () => {
    expect(bulkBuy(2, 1, 0, D(9), 'max').count).toBe(4)
  })

  it('hiring ×10 adds ten helpers and charges the total', () => {
    const s = newGame()
    s.money = D(10_000)
    const before = workerCost(s, 'uncle')
    expect(hireWorker(s, 'uncle', 10)).toBe(true)
    expect(s.workers.uncle).toBe(10)
    expect(s.money.lt(D(10_000).sub(before.mul(10)))).toBe(true)
    expect(hireWorker(s, 'uncle', 10)).toBe(true)
    s.money = D(1)
    expect(hireWorker(s, 'uncle', 'max')).toBe(false)
  })
})
