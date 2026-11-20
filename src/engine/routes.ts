// Who delivers where: the route map in the Distribution tab. Each carrier
// (your delivery helpers, each kind of vehicle) goes to the farthest,
// best-paying place it reaches first, then to nearer ones with what is left.
import { REGIONS, VEHICLES, type RegionDef, type RegionId, type VehicleId } from './content'
import { fmt } from './format'
import { workerLook } from './names'
import { helperReaches, orderCap, taskCapacity, vehicleCapacity, vehicleServes, type Mods } from './rules'
import type { GameState } from './state'

export type CarrierId = VehicleId | 'helpers'

export const routeKey = (carrier: CarrierId, place: RegionId): string => `${carrier}>${place}`

export interface Carrier {
  id: CarrierId
  name: string
  emoji: string
  /** Schnitzels per second it can carry in total. */
  capacity: number
  reaches: (r: RegionDef) => boolean
}

/** Everything you own that delivers, nearest-reaching first (helpers, van, truck…). */
export function carriers(state: GameState, mods: Mods): Carrier[] {
  const out: Carrier[] = []
  const helpers = taskCapacity(state, 'deliver', mods).toNumber()
  if (helpers > 0) {
    const kid = workerLook(state, 'kid')
    out.push({ id: 'helpers', name: `${kid.name}s (your delivery helpers)`, emoji: kid.emoji, capacity: helpers, reaches: helperReaches })
  }
  for (const v of VEHICLES) {
    if (state.vehicles[v.id] <= 0) continue
    out.push({
      id: v.id,
      name: `${v.name}s`,
      emoji: v.emoji,
      capacity: vehicleCapacity(state, v, mods).toNumber(),
      reaches: (r) => vehicleServes(v, r),
    })
  }
  return out
}

/** Per-second delivery rates by route (smoothed by the store). */
export type RouteRates = Record<string, number>

export const routeRate = (rates: RouteRates, c: CarrierId, place: RegionId): number => rates[routeKey(c, place)] ?? 0

/** How much of its capacity a carrier is using right now (0…1). */
export function carrierLoad(c: Carrier, rates: RouteRates): number {
  if (c.capacity <= 0) return 0
  let used = 0
  for (const r of REGIONS) used += routeRate(rates, c.id, r.id)
  return used / c.capacity
}

export type PlaceStatusKind = 'unreached' | 'keeping' | 'filling' | 'kitchen' | 'fleet'

export interface PlaceStatus {
  kind: PlaceStatusKind
  /** One short line under the place. */
  text: string
  /** The longer story, for the pop-up. */
  detail: string
  /** Delivered here per second, by carrier. */
  by: { carrier: Carrier; rate: number }[]
}

/** A queue this full counts as piling up; this empty as keeping up. */
const PILING = 0.9
const KEEPING = 0.5
/** A carrier using less than this share of its capacity has room to spare. */
const BUSY = 0.95

/** Is this place being served, and if not, what is holding it back? */
export function placeStatus(state: GameState, mods: Mods, region: RegionDef, rates: RouteRates, all: Carrier[]): PlaceStatus {
  const reaching = all.filter((c) => c.reaches(region))
  const by = reaching
    .map((carrier) => ({ carrier, rate: routeRate(rates, carrier.id, region.id) }))
    .filter((b) => b.rate > 0.005)
  const list = by.map((b) => `${b.carrier.emoji} ${fmt(b.rate)}/s`).join(' · ')
  if (reaching.length === 0) return { kind: 'unreached', text: '', detail: '', by }
  const fill = state.regions[region.id].orders.div(orderCap(region, mods)).toNumber()
  const served = by.reduce((n, b) => n + b.rate, 0)
  const icons = (cs: Carrier[]) => cs.map((c) => c.emoji).join('')
  const delivered = list ? `Delivered here: ${list}.` : 'Nothing delivered here right now.'
  if (fill < KEEPING) return { kind: 'keeping', text: `✓ Keeping up · ${fmt(served)}/s`, detail: `Every order gets served. ${delivered}`, by }
  if (fill < PILING)
    return { kind: 'filling', text: `${fmt(served)}/s · orders building up`, detail: `Orders come in a little faster than they go out. ${delivered}`, by }
  const spare = reaching.filter((c) => carrierLoad(c, rates) < BUSY)
  if (spare.length > 0)
    return {
      kind: 'kitchen',
      text: '⏳ Piling up: not enough schnitzel',
      detail: `${icons(spare)} could carry more, but there is no schnitzel left for them: the farther places take it first, and the kitchen (or its ingredients) can't make more. ${delivered}`,
      by,
    }
  return {
    kind: 'fleet',
    text: `⏳ Piling up: more ${icons(reaching)} would help`,
    detail: `Everything that reaches here is busy all the time. More vehicles that reach this far would help. ${delivered}`,
    by,
  }
}

/** One carrier's line on the route map, over the rows (places) shown. */
export interface Lane {
  carrier: Carrier
  index: number
  /** First and last row it reaches (-1: none). */
  first: number
  last: number
  /** Farthest row it actually delivers to (-1: none). */
  servedTo: number
}

export function buildLanes(all: Carrier[], rows: RegionDef[], rates: RouteRates): Lane[] {
  return all.map((carrier, index) => {
    const reach = rows.map((r, j) => (carrier.reaches(r) ? j : -1)).filter((j) => j >= 0)
    const served = rows.map((r, j) => (routeRate(rates, carrier.id, r.id) > 0.005 ? j : -1)).filter((j) => j >= 0)
    return {
      carrier,
      index,
      first: reach.length ? Math.min(...reach) : -1,
      last: reach.length ? Math.max(...reach) : -1,
      servedTo: served.length ? Math.max(...served) : -1,
    }
  })
}
