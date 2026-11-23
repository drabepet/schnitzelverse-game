// Look-ups by id, built once every list is complete.
import { FACILITIES } from './farm'
import { VEHICLES } from './fleet'
import { PERKS } from './franchise'
import { INGREDIENT_IDS, type ItemId } from './items'
import { REGIONS, type RegionId } from './regions'
import { WORKERS } from './staff'
import { UPGRADES } from './upgrades'

// ---------------------------------------------------------------- look-ups

/** Every entry of a list by its id (built once, after the lists are complete). */
function byId<T extends { id: string }>(list: readonly T[]): Record<T['id'], T> {
  return Object.fromEntries(list.map((x) => [x.id, x])) as Record<T['id'], T>
}
export const WORKER_BY_ID = byId(WORKERS)
export const UPGRADE_BY_ID = byId(UPGRADES)
export const PERK_BY_ID = byId(PERKS)
export const REGION_BY_ID = byId(REGIONS)
export const FACILITY_BY_ID = byId(FACILITIES)
export const VEHICLE_BY_ID = byId(VEHICLES)
/** Where each place sits in REGIONS (nearest first). */
export const REGION_INDEX = Object.fromEntries(REGIONS.map((r, i) => [r.id, i])) as Record<RegionId, number>
/** Ingredient ids as a set, for quick “is this an ingredient?” checks. */
export const INGREDIENT_SET: ReadonlySet<ItemId> = new Set(INGREDIENT_IDS)
