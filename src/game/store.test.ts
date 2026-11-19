import { describe, expect, it } from 'vitest'
import { GameStore } from './store'
import type { SaveStorage } from './storage'
import { serialize } from '../engine/save'
import { newGame } from '../engine/state'
import { D } from '../engine/decimal'

class MemoryStorage implements SaveStorage {
  main: string | null = null
  backupData: string | null = null
  broken: string | null = null
  load = () => this.main
  save = (d: string) => void (this.main = d)
  clear = () => void (this.main = null)
  loadBackup = () => this.backupData
  saveBackup = (d: string) => void (this.backupData = d)
  keepBroken = (d: string) => void (this.broken = d)
}

describe('save safety', () => {
  it('backs up on save and falls back to the backup when the save is damaged', () => {
    const mem = new MemoryStorage()
    const good = newGame()
    good.money = D(1234)
    mem.main = serialize(good)
    const store = new GameStore(mem)
    store.save()
    expect(mem.backupData).not.toBeNull()

    mem.main = '{ this is not json'
    const again = new GameStore(mem)
    expect(again.state.money.toNumber()).toBeGreaterThanOrEqual(1234)
    expect(again.saveNotice).toMatch(/backup/)
    expect(mem.broken).toBe('{ this is not json')
  })

  it('starts fresh but keeps the broken save when there is no backup', () => {
    const mem = new MemoryStorage()
    mem.main = 'garbage'
    const store = new GameStore(mem)
    expect(store.state.stats.served.toNumber()).toBe(0)
    expect(store.saveNotice).toMatch(/could not be loaded/)
    expect(mem.broken).toBe('garbage')
  })

  it('a hard reset can be undone with the backup', () => {
    const mem = new MemoryStorage()
    const store = new GameStore(mem)
    store.state.money = D(999)
    store.hardReset()
    expect(store.state.money.toNumber()).toBe(20)
    expect(store.restoreBackup()).toBe(true)
    expect(store.state.money.toNumber()).toBe(999)
  })
})
