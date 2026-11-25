// Runs the engine in real time: the game loop, autosave, offline progress,
// and a tiny subscribe/notify API for React.
import { useSyncExternalStore } from 'react'
import type { Decimal } from '../engine/decimal'
import { FACILITIES, REGIONS, type FacilityId, type RegionId } from '../engine/content'
import { newGame, type GameState } from '../engine/state'
import { advance, type Flows } from '../engine/tick'
import { deserialize, fromExportString, serialize, toExportString } from '../engine/save'
import { furthestPlace, offlineCap } from '../engine/rules'
import type { RouteRates } from '../engine/routes'
import { LocalStorageSave, withSnapshot, type SaveStorage, type Snapshot, type SnapshotReason } from './storage'

const TICK_MS = 50
const AUTOSAVE_MS = 10_000
/** An automatic restore point is taken this often (wall clock). */
const SNAPSHOT_MS = 15 * 60_000
const OFFLINE_MIN_SECONDS = 30

export type Rates = Record<Exclude<keyof Flows, 'farm' | 'routes'>, number>

export interface OfflineReport {
  /** Seconds actually simulated (after the cap). */
  seconds: number
  cappedFrom: number
  /** The cap that applied (s). */
  cap: number
  served: Decimal
  earned: Decimal
  /** What the family did meanwhile (see familyDigest). */
  family: FamilyDigest
}

/** What the family bought while you were away, worked out from the business before and after. */
export interface FamilyDigest {
  hired: number
  built: number
  vehicles: number
  equipment: number
  /** Places opened (ids), nearest first. */
  places: RegionId[]
  /** Money the managers spent. */
  spent: number
  /** Times Mum sold the business, and the Golden Crumbs it brought. */
  sales: number
  crumbs: Decimal
}

/** The counts a digest compares. */
export function businessCounts(s: GameState) {
  const sum = (o: Record<string, number>) => Object.values(o).reduce((n, x) => n + x, 0)
  return {
    hired: sum(s.workers),
    built: sum(s.facilities),
    vehicles: sum(s.vehicles),
    equipment: Object.keys(s.upgrades).length,
    places: new Set(REGIONS.filter((r) => s.regions[r.id].unlocked).map((r) => r.id)),
    spent: sum(s.run.managerSpent as Record<string, number>),
    franchises: s.prestige.franchises,
    crumbs: s.prestige.totalCrumbs,
  }
}

/**
 * Before and after a stretch of play: what the family bought. A sale starts a
 * new run, so after one only the sales are counted (the run's own numbers restart).
 */
export function familyDigest(before: ReturnType<typeof businessCounts>, s: GameState): FamilyDigest {
  const after = businessCounts(s)
  const sales = after.franchises - before.franchises
  const sameRun = sales === 0
  const grew = (a: number, b: number) => (sameRun ? Math.max(0, a - b) : 0)
  return {
    hired: grew(after.hired, before.hired),
    built: grew(after.built, before.built),
    vehicles: grew(after.vehicles, before.vehicles),
    equipment: grew(after.equipment, before.equipment),
    places: sameRun ? [...after.places].filter((id) => !before.places.has(id)) : [],
    spent: grew(after.spent, before.spent),
    sales,
    crumbs: after.crumbs.sub(before.crumbs),
  }
}

/** “12 min ago”, “3 days ago” (wall clock). */
export function ago(at: number, now = Date.now()): string {
  if (!at) return 'some time ago'
  const s = Math.max(0, (now - at) / 1000)
  if (s < 90) return 'just now'
  if (s < 90 * 60) return `${Math.round(s / 60)} min ago`
  if (s < 36 * 3600) return `${Math.round(s / 3600)} h ago`
  return `${Math.round(s / 86400)} days ago`
}

export class GameStore {
  state: GameState
  /** Smoothed per-second rates for display. */
  rates: Rates = { pound: 0, bread: 0, fry: 0, deliver: 0, income: 0, sails: 0 }
  /** Smoothed reputation gained per second. */
  reputationRate = 0
  private lastReputation: Decimal | null = null
  /** Smoothed output per second of each kind of farm building. */
  farmRates: Partial<Record<FacilityId, number>> = {}
  /** Smoothed schnitzels per second along each delivery route (routes.ts). */
  routeRates: RouteRates = {}
  offlineReport: OfflineReport | null = null
  /** A message about the save itself (restored from backup…), shown once. */
  saveNotice: string | null = null
  /** Whether the browser promised to keep the save (null until it answers). */
  persisted: boolean | null = null

  private readonly storage: SaveStorage
  private version = 0
  private listeners = new Set<() => void>()
  private lastFrame = 0
  /** When the screen last redrew from a tick (Settings → display speed). */
  private lastDraw = 0
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
    void this.storage.requestPersistence?.().then((ok) => {
      this.persisted = ok
      this.notify()
    })
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
    for (const key of new Set([...Object.keys(this.routeRates), ...Object.keys(flows.routes)])) {
      const perSecond = dt > 0 ? (flows.routes[key]?.toNumber() ?? 0) / dt : 0
      const next = (this.routeRates[key] ?? 0) + (perSecond - (this.routeRates[key] ?? 0)) * smoothing
      if (next < 1e-4 && !flows.routes[key]) delete this.routeRates[key]
      else this.routeRates[key] = next
    }
    // The game runs every tick; the screen redraws as often as the player chose.
    if (now - this.lastDraw >= 1000 / this.state.settings.updateRate - TICK_MS / 2) {
      this.lastDraw = now
      this.notify()
    }
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
    // The main save is damaged: fall back to the newest restore point that loads.
    for (const snap of this.storage.listSnapshots()) {
      try {
        const state = deserialize(snap.data)
        this.catchUp(state)
        this.saveNotice = `Your save was damaged, so the restore point from ${ago(snap.at)} was loaded.`
        return state
      } catch (err) {
        console.error('Could not load a restore point either', err)
      }
    }
    this.saveNotice = 'Your save could not be loaded, so a new game started. The damaged save was kept aside.'
    return newGame()
  }

  /** Restore points, newest first. */
  snapshots(): Snapshot[] {
    return this.storage.listSnapshots()
  }

  /** Take a restore point of the game as it is now (only a save that loads again). */
  snapshot(reason: SnapshotReason): void {
    const data = serialize(this.state)
    try {
      deserialize(data)
    } catch (err) {
      console.error('Not keeping a restore point that does not load', err)
      return
    }
    const place = REGIONS[furthestPlace(this.state)]
    const label = `Run ${this.state.prestige.franchises + 1} · ${place.emoji} ${place.name}`
    const list = this.storage.listSnapshots()
    // The same moment twice (a reload before the note was answered): one is enough.
    const same = list.find((x) => x.reason === reason)
    if (reason !== 'auto' && same && same.label === label && Date.now() - same.at < 10 * 60_000) return
    // The time is also the restore point's name: keep it unique, even within one millisecond.
    const at = Math.max(Date.now(), (list[0]?.at ?? 0) + 1)
    this.storage.writeSnapshots(withSnapshot(list, { at, reason, label, data }))
  }

  /** Go back to a restore point (keeping the game as it is now as one more). Returns false when it's gone. */
  restoreSnapshot(at: number): boolean {
    const snap = this.storage.listSnapshots().find((x) => x.at === at)
    if (!snap) return false
    const state = deserialize(snap.data)
    this.snapshot('before-restore')
    this.state = state
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
    const cap = offlineCap(state)
    const seconds = Math.min(away, cap)
    const before = { served: state.stats.served, earned: state.stats.earned }
    const counts = businessCounts(state)
    advance(state, seconds, Math.max(1, seconds / 5000))
    this.offlineReport = {
      seconds,
      cappedFrom: away,
      cap,
      served: state.stats.served.sub(before.served),
      earned: state.stats.earned.sub(before.earned),
      family: familyDigest(counts, state),
    }
  }

  save(): void {
    this.state.lastSaved = Date.now()
    const data = serialize(this.state)
    this.storage.save(data)
    // An automatic restore point every so often (not on every reload: the newest one counts).
    const lastAuto = this.storage.listSnapshots().find((x) => x.reason === 'auto')
    if (!lastAuto || Date.now() - lastAuto.at > SNAPSHOT_MS) this.snapshot('auto')
  }

  exportSave(): string {
    this.save()
    return toExportString(this.state)
  }

  /** Throws if the text is not a valid save. */
  importSave(text: string): void {
    const imported = fromExportString(text)
    this.snapshot('before-load')
    this.state = imported
    this.offlineReport = null
    this.save()
    this.notify()
  }

  hardReset(): void {
    this.snapshot('before-reset')
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
