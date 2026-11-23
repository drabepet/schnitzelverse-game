import type { GameState } from '../engine/state'
import { store } from '../game/store'

/**
 * Compute something from the game state once per frame, however many
 * components ask for it. The store's version changes whenever the state does
 * (every tick and every action), so a cached value is never stale.
 */
export function perFrame<T>(fn: (s: GameState) => T): (s: GameState) => T {
  let version = -1
  let state: GameState | null = null
  let value: T
  return (s) => {
    const v = store.getVersion()
    if (v !== version || s !== state) {
      value = fn(s)
      version = v
      state = s
    }
    return value
  }
}
