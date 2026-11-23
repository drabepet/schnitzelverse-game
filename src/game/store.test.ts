import { describe, expect, it } from 'vitest'
import { businessCounts, familyDigest, GameStore } from './store'
import { KEEP_AUTO, KEEP_MOMENTS, withSnapshot, type SaveStorage, type Snapshot } from './storage'
import { serialize } from '../engine/save'
import { newGame } from '../engine/state'
import { D } from '../engine/decimal'
import { franchise, hireWorker } from '../engine/actions'
import { REGIONS } from '../engine/content'

class MemoryStorage implements SaveStorage {
  main: string | null = null
  points: Snapshot[] = []
  broken: string | null = null
  load = () => this.main
  save = (d: string) => void (this.main = d)
  clear = () => void (this.main = null)
  listSnapshots = () => this.points
  writeSnapshots = (list: Snapshot[]) => void (this.points = list)
  keepBroken = (d: string) => void (this.broken = d)
}

const point = (at: number, reason: Snapshot['reason']): Snapshot => ({ at, reason, label: `#${at}`, data: '{}' })

describe('restore points', () => {
  it('keep the newest automatic ones and the newest moments, newest first', () => {
    let list: Snapshot[] = []
    for (let at = 1; at <= 10; at++) list = withSnapshot(list, point(at, at % 3 === 0 ? 'before-load' : 'auto'))
    const auto = list.filter((p) => p.reason === 'auto').map((p) => p.at)
    const moments = list.filter((p) => p.reason !== 'auto').map((p) => p.at)
    expect(auto).toEqual([10, 8, 7, 5].slice(0, KEEP_AUTO))
    expect(moments).toEqual([9, 6].slice(0, KEEP_MOMENTS))
    expect(list.map((p) => p.at)).toEqual([...list.map((p) => p.at)].sort((a, b) => b - a))
  })

  it('a save takes an automatic one, but not again straight away', () => {
    const mem = new MemoryStorage()
    const store = new GameStore(mem)
    store.save()
    store.save()
    expect(mem.points.filter((p) => p.reason === 'auto')).toHaveLength(1)
    expect(mem.points[0].label).toMatch(/^Run 1 · /)
  })

  it('a damaged save falls back to the newest restore point that loads', () => {
    const mem = new MemoryStorage()
    const good = newGame()
    good.money = D(1234)
    mem.main = serialize(good)
    const store = new GameStore(mem)
    store.save()
    mem.points = [point(Date.now() + 1, 'auto'), ...mem.points] // a broken one on top: skipped
    mem.points[0].data = '{ nope'

    mem.main = '{ this is not json'
    const again = new GameStore(mem)
    expect(again.state.money.toNumber()).toBeGreaterThanOrEqual(1234)
    expect(again.saveNotice).toMatch(/restore point/)
    expect(mem.broken).toBe('{ this is not json')
  })

  it('the same moment is kept once (e.g. a reload before the new-chapter note was answered)', () => {
    const mem = new MemoryStorage()
    const store = new GameStore(mem)
    store.snapshot('chapter')
    store.snapshot('chapter')
    expect(mem.points.filter((p) => p.reason === 'chapter')).toHaveLength(1)
  })

  it('starts fresh but keeps the broken save when there is nothing to fall back on', () => {
    const mem = new MemoryStorage()
    mem.main = 'garbage'
    const store = new GameStore(mem)
    expect(store.state.stats.served.toNumber()).toBe(0)
    expect(store.saveNotice).toMatch(/could not be loaded/)
    expect(mem.broken).toBe('garbage')
  })

  it('starting over can be undone, and going back keeps the present as one more', () => {
    const mem = new MemoryStorage()
    const store = new GameStore(mem)
    store.state.money = D(999)
    store.hardReset()
    expect(store.state.money.toNumber()).toBe(20)
    const before = mem.points.find((p) => p.reason === 'before-reset')!
    expect(store.restoreSnapshot(before.at)).toBe(true)
    expect(store.state.money.toNumber()).toBe(999)
    expect(mem.points.some((p) => p.reason === 'before-restore')).toBe(true)
  })
})

describe('welcome back: what the family did', () => {
  it('counts what grew in this run', () => {
    const s = newGame()
    s.money = D(1e9)
    const before = businessCounts(s)
    hireWorker(s, 'uncle', 10)
    const next = REGIONS.find((r) => !s.regions[r.id].unlocked)!
    s.regions[next.id].unlocked = true
    s.run.managerSpent.familyManager = 500
    const f = familyDigest(before, s)
    expect(f.hired).toBe(10)
    expect(f.places).toEqual([next.id])
    expect(f.spent).toBe(500)
    expect(f.sales).toBe(0)
  })

  it('after a sale, only the sale counts', () => {
    const s = newGame()
    s.prestige.unlocked = true
    s.stats.earned = D(1e9)
    s.money = D(1e9)
    const before = businessCounts(s)
    hireWorker(s, 'uncle', 10)
    expect(franchise(s)).toBe(true)
    const f = familyDigest(before, s)
    expect(f.sales).toBe(1)
    expect(f.crumbs.toNumber()).toBeGreaterThan(0)
    expect(f.hired).toBe(0)
    expect(f.places).toEqual([])
  })
})
