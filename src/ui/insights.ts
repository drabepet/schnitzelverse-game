// Derived numbers the sidebar and dashboard share: flow, bottleneck,
// ingredient sources and progress toward the next place.
import { FUEL_IDS, INGREDIENT_IDS, type IngredientId, type RegionDef, REGIONS, type ShipFuelId } from '../engine/content'
import type { GameState } from '../engine/state'
import {
  chapter2Unlocked,
  customerDemand,
  deliveryCapacity,
  fuelFor,
  getMods,
  kitchenCapacity,
  nextRegion,
  shopSupplyRate,
} from '../engine/rules'
import type { GameStore } from '../game/store'
import { farmSupplyNow, needsNow } from './derived'

/** What limits the business, in pipeline order: what customers want, ingredients, the kitchen, delivery. */
export type Bottleneck = 'customers' | 'supply' | 'kitchen' | 'delivery'

export interface Flow {
  demand: number
  /** Schnitzels per second the farm and shop's ingredients are enough for (Infinity when nothing is needed). */
  supplyMax: number
  kitchenMax: number
  deliverMax: number
  fry: number
  deliver: number
  bottleneck: Bottleneck
  /** The ingredients that hold supply back (when it is the limit). */
  short: IngredientId[]
}

export function flow(game: GameStore): Flow {
  const s = game.state
  const mods = getMods(s)
  const demand = customerDemand(s, mods)
  const kitchenMax = kitchenCapacity(s, mods)
  const deliverMax = deliveryCapacity(s, mods).toNumber()
  // Ingredients: what the farm and the corner shop deliver per second, against
  // what one schnitzel needs (supplyNeeds is per second at the kitchen's pace).
  const pace = Math.min(kitchenMax, deliverMax)
  const need = needsNow(s)
  const farm = chapter2Unlocked(s) ? farmSupplyNow(s) : () => 0
  const enoughFor = INGREDIENT_IDS.map((id) => {
    const n = need[id] ?? 0
    return { id, max: n > 0 && pace > 0 ? ((farm(id) + shopSupplyRate(mods)) * pace) / n : Infinity }
  })
  const supplyMax = Math.min(...enoughFor.map((x) => x.max))
  const short = enoughFor.filter((x) => Number.isFinite(x.max) && x.max <= supplyMax * 1.01).map((x) => x.id)
  // The smallest one is the limit; on a tie, the earliest in the pipeline.
  const limit = Math.min(demand, supplyMax, kitchenMax, deliverMax)
  const bottleneck: Bottleneck =
    limit === demand ? 'customers' : limit === supplyMax ? 'supply' : limit === kitchenMax ? 'kitchen' : 'delivery'
  return { demand, supplyMax, kitchenMax, deliverMax, fry: game.rates.fry, deliver: game.rates.deliver, bottleneck, short }
}

/** What to do about a bottleneck, and the tab where you do it. */
export function adviceFor(bottleneck: Bottleneck, farm: boolean): { text: string; tab: 'prep' | 'making' | 'distribution' } {
  switch (bottleneck) {
    case 'customers':
      return { text: 'Customers are the limit: open the next place to sell more.', tab: 'distribution' }
    case 'supply':
      return farm
        ? { text: 'Ingredients are the limit: grow the farm’s slowest chain (or the shop’s supply).', tab: 'prep' }
        : { text: 'Ingredients are the limit: the corner shop can’t keep up. Its supply equipment helps.', tab: 'prep' }
    case 'kitchen':
      return { text: 'The kitchen is the limit: speed up its slowest step.', tab: 'making' }
    case 'delivery':
      return { text: 'Delivery is the limit: hire delivery helpers or buy vehicles.', tab: 'distribution' }
  }
}

export type Source = 'farm' | 'farm + shop' | 'shop' | 'short'

export interface IngredientStatus {
  id: IngredientId
  stock: number
  need: number
  source: Source | null
}

export function ingredients(game: GameStore): IngredientStatus[] {
  const s = game.state
  const mods = getMods(s)
  const farm = chapter2Unlocked(s)
  const need = needsNow(s)
  const supply = farmSupplyNow(s)
  return INGREDIENT_IDS.map((id) => {
    const n = need[id] ?? 0
    let source: Source | null = null
    if (farm) {
      const fromFarm = supply(id)
      source = fromFarm >= n ? 'farm' : fromFarm + shopSupplyRate(mods) < n - 0.05 ? 'short' : fromFarm > 0 ? 'farm + shop' : 'shop'
    }
    return { id, stock: s.items[id].toNumber(), need: n, source }
  })
}

export interface Goal {
  region: RegionDef
  locked: boolean
  /** 0..1 */
  rep: number
  money: number
  /** Seconds until both requirements are met at current rates, or null if not moving. */
  eta: number | null
  /** The requirement that takes longest to meet (the one to work on), or null when both are met. */
  slowest: 'rep' | 'money' | null
}

export function nextGoal(game: GameStore): Goal | null {
  const s = game.state
  const next = nextRegion(s)
  if (!next) return null
  const { region, locked } = next
  const repNow = s.reputation.toNumber()
  const moneyNow = s.money.toNumber()
  const rep = region.unlockReputation > 0 ? Math.min(1, repNow / region.unlockReputation) : 1
  const money = region.unlockCost > 0 ? Math.min(1, moneyNow / region.unlockCost) : 1
  // Smoothed rates decay towards zero but never reach it: treat crumbs of a rate as none.
  const wait = (missing: number, rate: number) => (missing <= 0 ? 0 : rate > 1e-3 ? missing / rate : Infinity)
  const repWait = wait(region.unlockReputation - repNow, game.reputationRate)
  const moneyWait = wait(region.unlockCost - moneyNow, game.rates.income)
  const t = Math.max(repWait, moneyWait)
  // The slower one holds you back; if neither is moving, the one further from done.
  const slowest =
    rep >= 1 && money >= 1 ? null : repWait === moneyWait ? (rep <= money ? 'rep' : 'money') : repWait > moneyWait ? 'rep' : 'money'
  // More than a month away at this pace is "not yet", not a number.
  return { region, locked, rep, money, eta: locked || !Number.isFinite(t) || t > 30 * 86400 ? null : t, slowest }
}

/** Star paprika for one ship fuel: what the fleet would burn at full capacity, and what the farm makes (per second). */
export interface FuelStatus {
  id: ShipFuelId
  need: number
  made: number
  /** 0..1: the share of the burn the farm covers. */
  share: number
}

/** Each ship fuel in use: from the first place that needs it (Mars, the next star). */
export function fuelStatus(s: GameState): FuelStatus[] {
  const need = needsNow(s)
  const made = farmSupplyNow(s)
  return FUEL_IDS.filter((id) => REGIONS.some((r) => s.regions[r.id].unlocked && fuelFor(r) === id)).map((id) => {
    const n = need[id] ?? 0
    const m = made(id)
    return { id, need: n, made: m, share: n > 0 ? Math.min(1, m / n) : 1 }
  })
}
