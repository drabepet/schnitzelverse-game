// Runs the engine in real time: the game loop, autosave, offline progress,
// and a tiny subscribe/notify API for React.
import { useSyncExternalStore } from 'react'
import type { Decimal } from '../engine/decimal'
import { FACILITIES, type FacilityId } from '../engine/content'
import { newGame, type GameState } from '../engine/state'
import { advance, type Flows } from '../engine/tick'
import { deserialize, fromExportString, serialize, toExportString } from '../engine/save'
import { offlineCap } from '../engine/rules'
import { LocalStorageSave, type SaveStorage } from './storage'

const TICK_MS = 50
const AUTOSAVE_MS = 10_000
/** The backup copy is refreshed this often (wall clock). */
const BACKUP_MS = 10 * 60_000
const OFFLINE_MIN_SECONDS = 30

export type Rates = Record<Exclude<keyof Flows, 'farm'>, number>

export interface OfflineReport {
  /** Seconds actually simulated (after the cap). */
  seconds: number
  cappedFrom: number
  served: Decimal
  earned: Decimal
}

export class GameStore {
  state: GameState
  /** Smoothed per-second rates for display. */
  rates: Rates = { pound: 0, bread: 0, fry: 0, deliver: 0, income: 0 }
  /** Smoothed reputation gained per second. */
  reputationRate = 0
  private lastReputation: Decimal | null = null
  /** Smoothed output per second of each kind of farm building. */
  farmRates: Partial<Record<FacilityId, number>> = {}
  offlineReport: OfflineReport | null = null
  /** A message about the save itself (restored from backup…), shown once. */
  saveNotice: string | null = null
  private lastBackup = 0

  private readonly storage: SaveStorage
  private version = 0
  private listeners = new Set<() => void>()
  private lastFrame = 0
  private timers: number[] = []

  constructor(storage: SaveStorage) {
    this.storage = storage
    this.state = this.load()
  }

  // ---------------------------------------------------------- loop

  start(): void {
    if (this.timers.length) return
    this.lastFrame = performance.now()
    this.timers.push(window.setInterval(() => this.frame(), TICK_MS))
    this.timers.push(window.setInterval(() => this.save(), AUTOSAVE_MS))
    document.addEventListener('visibilitychange', this.onVisibility)
    window.addEventListener('beforeunload', this.onUnload)
  }

  stop(): void {
    this.timers.forEach((t) => window.clearInterval(t))
    this.timers = []
    document.removeEventListener('visibilitychange', this.onVisibility)
    window.removeEventListener('beforeunload', this.onUnload)
  }

  private frame(): void {
    const now = performance.now()
    const dt = Math.min((now - this.lastFrame) / 1000, offlineCap(this.state))
    this.lastFrame = now
    // Background tabs get throttled; a long gap is simply simulated in steps.
    const flows = advance(this.state, dt, dt > 5 ? 1 : 0.25)
    const smoothing = 1 - Math.exp(-dt / 1.5)
    for (const key of Object.keys(this.rates) as (keyof Rates)[]) {
      const perSecond = dt > 0 ? flows[key].toNumber() / dt : 0
      this.rates[key] += (perSecond - this.rates[key]) * smoothing
    }
    // Reputation per second; a franchise resets reputation, so ignore drops.
    const rep = this.state.reputation
    const gained = this.lastReputation && rep.gte(this.lastReputation) ? rep.sub(this.lastReputation).toNumber() : 0
    this.lastReputation = rep
    this.reputationRate += ((dt > 0 ? gained / dt : 0) - this.reputationRate) * smoothing
    for (const f of FACILITIES) {
      const perSecond = dt > 0 ? (flows.farm[f.id]?.toNumber() ?? 0) / dt : 0
      const prev = this.farmRates[f.id] ?? 0
      this.farmRates[f.id] = prev + (perSecond - prev) * smoothing
    }
    this.notify()
  }

  private onVisibility = () => {
    if (document.visibilityState === 'hidden') this.save()
  }
  private onUnload = () => this.save()

  // ---------------------------------------------------------- actions

  /** Run a player action against the state and refresh the UI. */
  act<T>(fn: (state: GameState) => T): T {
    const result = fn(this.state)
    this.notify()
    return result
  }

  // ---------------------------------------------------------- saving

  private load(): GameState {
    const raw = this.storage.load()
    if (!raw) return newGame()
    try {
      const state = deserialize(raw)
      this.catchUp(state)
      return state
    } catch (err) {
      console.error('Could not load save', err)
      this.storage.keepBroken(raw)
    }
    // The main save is damaged: fall back to the backup copy.
    const backup = this.storage.loadBackup()
    if (backup) {
      try {
        const state = deserialize(backup)
        this.catchUp(state)
        this.saveNotice = 'Your save was damaged, so the backup from up to 10 minutes earlier was loaded.'
        return state
      } catch (err) {
        console.error('Could not load the backup either', err)
      }
    }
    this.saveNotice = 'Your save could not be loaded, so a new game started. The damaged save was kept aside.'
    return newGame()
  }

  /** Copy the current save to the backup slot (also before risky actions). */
  backup(): void {
    this.storage.saveBackup(serialize(this.state))
    this.lastBackup = Date.now()
  }

  /** Go back to the backup copy. Returns false when there is none. */
  restoreBackup(): boolean {
    const backup = this.storage.loadBackup()
    if (!backup) return false
    this.state = deserialize(backup)
    this.offlineReport = null
    this.save()
    this.notify()
    return true
  }

  dismissSaveNotice(): void {
    this.saveNotice = null
    this.notify()
  }

  private catchUp(state: GameState): void {
    const away = (Date.now() - state.lastSaved) / 1000
    if (away < OFFLINE_MIN_SECONDS) return
    // Capped, so leaving for a month doesn't break the economy (Night shift raises it).
    const seconds = Math.min(away, offlineCap(state))
    const before = { served: state.stats.served, earned: state.stats.earned }
    advance(state, seconds, Math.max(1, seconds / 5000))
    this.offlineReport = {
      seconds,
      cappedFrom: away,
      served: state.stats.served.sub(before.served),
      earned: state.stats.earned.sub(before.earned),
    }
  }

  save(): void {
    this.state.lastSaved = Date.now()
    const data = serialize(this.state)
    this.storage.save(data)
    if (Date.now() - this.lastBackup > BACKUP_MS) {
      // Only back up a save that loads again, so the backup is always good.
      try {
        deserialize(data)
        this.storage.saveBackup(data)
        this.lastBackup = Date.now()
      } catch (err) {
        console.error('Not backing up a save that does not load', err)
      }
    }
  }

  exportSave(): string {
    this.save()
    return toExportString(this.state)
  }

  /** Throws if the text is not a valid save. */
  importSave(text: string): void {
    const imported = fromExportString(text)
    this.backup()
    this.state = imported
    this.offlineReport = null
    this.save()
    this.notify()
  }

  hardReset(): void {
    this.backup()
    this.state = newGame()
    this.offlineReport = null
    this.save()
    this.notify()
  }

  dismissOfflineReport(): void {
    this.offlineReport = null
    this.notify()
  }

  // ---------------------------------------------------------- react glue

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  getVersion = () => this.version
  private notify(): void {
    this.version++
    this.listeners.forEach((l) => l())
  }
}

export const store = new GameStore(new LocalStorageSave('schnitzelverse-save'))

/** Re-render the calling component whenever the game changes. */
export function useGame(): GameStore {
  useSyncExternalStore(store.subscribe, store.getVersion)
  return store
}
