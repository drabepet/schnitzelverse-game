// Where saves live: the browser's localStorage, plus a few restore points.
// Kept behind an interface so tests can use an in-memory store.

/** Why a restore point was taken. */
export type SnapshotReason = 'auto' | 'before-load' | 'before-reset' | 'before-restore' | 'chapter'

/** A restore point: a full save, when it was taken (wall clock, ms), and a short label (“Run 21 · 🌕 Moon base”). */
export interface Snapshot {
  at: number
  reason: SnapshotReason
  label: string
  data: string
}

/** Automatic restore points kept (newest first), and ones taken at a moment (before a load, a new chapter…). */
export const KEEP_AUTO = 4
export const KEEP_MOMENTS = 2

/** Add a restore point and drop the oldest of its kind past the limit. Newest first. */
export function withSnapshot(list: Snapshot[], snap: Snapshot): Snapshot[] {
  const all = [snap, ...list].sort((a, b) => b.at - a.at)
  const auto = all.filter((s) => s.reason === 'auto').slice(0, KEEP_AUTO)
  const moments = all.filter((s) => s.reason !== 'auto').slice(0, KEEP_MOMENTS)
  return [...auto, ...moments].sort((a, b) => b.at - a.at)
}

export interface SaveStorage {
  load(): string | null
  save(data: string): void
  clear(): void
  /** Restore points, newest first. */
  listSnapshots(): Snapshot[]
  /** Store the list (dropping the oldest when the browser is out of room). */
  writeSnapshots(list: Snapshot[]): void
  /** Keep a save that failed to load, so it is never silently lost. */
  keepBroken(data: string): void
  /** Ask the browser not to clear the save when it is short of space; true when it agrees. */
  requestPersistence?(): Promise<boolean>
}

export class LocalStorageSave implements SaveStorage {
  private readonly key: string
  constructor(key: string) {
    this.key = key
  }
  load(): string | null {
    try {
      return localStorage.getItem(this.key)
    } catch {
      return null
    }
  }
  save(data: string): void {
    try {
      localStorage.setItem(this.key, data)
    } catch (err) {
      console.error('Saving failed', err)
    }
  }
  clear(): void {
    try {
      localStorage.removeItem(this.key)
    } catch {
      // ignore
    }
  }
  listSnapshots(): Snapshot[] {
    try {
      const raw = localStorage.getItem(`${this.key}-snapshots`)
      if (raw) {
        const list = JSON.parse(raw) as Snapshot[]
        return Array.isArray(list) ? list.filter((s) => s && typeof s.data === 'string' && typeof s.at === 'number') : []
      }
      // The single backup copy from before restore points becomes the first one.
      const old = localStorage.getItem(`${this.key}-backup`)
      if (!old) return []
      let at = 0
      try {
        at = Number((JSON.parse(old) as { lastSaved?: number }).lastSaved) || 0
      } catch {
        // keep 0: still worth offering
      }
      const list: Snapshot[] = [{ at, reason: 'auto', label: 'Earlier backup', data: old }]
      this.writeSnapshots(list)
      localStorage.removeItem(`${this.key}-backup`)
      return list
    } catch {
      return []
    }
  }
  writeSnapshots(list: Snapshot[]): void {
    // Out of room: drop the oldest restore point and try again.
    for (let keep = list.length; keep >= 0; keep--) {
      try {
        localStorage.setItem(`${this.key}-snapshots`, JSON.stringify(list.slice(0, keep)))
        return
      } catch (err) {
        if (keep === 0) console.error('Could not store restore points', err)
      }
    }
  }
  keepBroken(data: string): void {
    try {
      localStorage.setItem(`${this.key}-broken`, data)
    } catch {
      // ignore: nothing more we can do
    }
  }
  async requestPersistence(): Promise<boolean> {
    try {
      if (!navigator.storage?.persist) return false
      if (await navigator.storage.persisted()) return true
      return await navigator.storage.persist()
    } catch {
      return false
    }
  }
}
