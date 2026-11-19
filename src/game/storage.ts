// Where saves live: the browser's localStorage, plus a backup copy. Kept behind
// an interface so tests can use an in-memory store.
export interface SaveStorage {
  load(): string | null
  save(data: string): void
  clear(): void
  /** A second, older copy to fall back on if the main save gets damaged. */
  loadBackup(): string | null
  saveBackup(data: string): void
  /** Keep a save that failed to load, so it is never silently lost. */
  keepBroken(data: string): void
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
  loadBackup(): string | null {
    try {
      return localStorage.getItem(`${this.key}-backup`)
    } catch {
      return null
    }
  }
  saveBackup(data: string): void {
    try {
      localStorage.setItem(`${this.key}-backup`, data)
    } catch (err) {
      console.error('Backup failed', err)
    }
  }
  keepBroken(data: string): void {
    try {
      localStorage.setItem(`${this.key}-broken`, data)
    } catch {
      // ignore: nothing more we can do
    }
  }
}
