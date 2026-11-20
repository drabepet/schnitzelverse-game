// Save format: JSON where every Decimal becomes the string "D:<value>".
// Loading merges the save over a fresh game, so fields added in later
// versions get their defaults and old saves keep working.
import { Decimal } from './decimal'
import { newGame, SAVE_VERSION, type GameState } from './state'
import { REGIONS } from './content'

const DECIMAL_PREFIX = 'D:'

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

function encode(value: unknown): Json {
  if (value instanceof Decimal) return DECIMAL_PREFIX + value.toString()
  if (Array.isArray(value)) return value.map(encode)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)]))
  }
  return value as Json
}

function decode(value: Json): unknown {
  if (typeof value === 'string' && value.startsWith(DECIMAL_PREFIX)) {
    return new Decimal(value.slice(DECIMAL_PREFIX.length))
  }
  if (Array.isArray(value)) return value.map(decode)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decode(v)]))
  }
  return value
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Decimal)

/** Take values from `saved` where their type matches the default; keep extra keys (records). */
function merge(defaults: unknown, saved: unknown): unknown {
  if (defaults instanceof Decimal) return saved instanceof Decimal && !saved.isNan() ? saved : defaults
  if (isPlainObject(defaults)) {
    if (!isPlainObject(saved)) return defaults
    const out: Record<string, unknown> = { ...defaults }
    for (const [k, v] of Object.entries(saved)) out[k] = k in defaults ? merge(defaults[k], v) : v
    return out
  }
  if (Array.isArray(defaults)) return Array.isArray(saved) ? saved : defaults
  return typeof saved === typeof defaults ? saved : defaults
}

/** Upgrade old save shapes here when SAVE_VERSION changes. */
function migrate(state: GameState): GameState {
  // Saves from before the Franchise existed: credit the first run with
  // everything earned so far, and unlock the Franchise if the town was reached.
  if (state.prestige.franchises === 0 && state.run.earned.eq(0) && state.stats.earned.gt(0)) {
    state.run.earned = state.stats.earned
    state.run.time = state.stats.playtime
  }
  if (state.milestones.town) state.prestige.unlocked = true
  // Saves from before frontier sales: the furthest place from this run and the story so far.
  if (state.stats.bestPlace === 0) {
    REGIONS.forEach((r, i) => {
      if (state.regions[r.id].unlocked || state.milestones[r.id]) state.stats.bestPlace = Math.max(state.stats.bestPlace, i)
    })
  }
  // Kitchen buffers are automatic now: drop the old hand-set ones.
  delete (state as unknown as Record<string, unknown>).buffers
  // Saves from before the welcome screen: anyone who has played doesn't need it.
  if (state.stats.served.gt(0) || state.prestige.franchises > 0) state.introSeen = true
  // Saves from before crispness: anyone past the next town has earned it.
  if (state.regions.nextTown.unlocked || state.prestige.franchises >= 2) state.crisp.unlocked = true
  // Saves from before the income chart: start counting from now, not from zero.
  if (!state.history.points.length && state.history.earned.eq(0)) state.history.earned = state.stats.earned
  state.version = SAVE_VERSION
  return state
}

export function serialize(state: GameState): string {
  return JSON.stringify(encode(state))
}

export function deserialize(json: string): GameState {
  const saved = decode(JSON.parse(json) as Json)
  if (!isPlainObject(saved)) throw new Error('Save data is not an object')
  return migrate(merge(newGame(), saved) as GameState)
}

// Export strings are base64 so they survive copy/paste through chat apps.
export function toExportString(state: GameState): string {
  const bytes = new TextEncoder().encode(serialize(state))
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

export function fromExportString(text: string): GameState {
  const binary = atob(text.trim())
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return deserialize(new TextDecoder().decode(bytes))
}
