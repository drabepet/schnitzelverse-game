// Derived numbers the sidebar and dashboard share: flow, bottleneck,
// ingredient sources and progress toward the next place.
import { INGREDIENT_IDS, REGIONS, STAGE_IDS, type IngredientId, type RegionDef } from '../engine/content'
import {
  chapter2Unlocked,
  deliveryCapacity,
  farmSupply,
  getMods,
  nextRegion,
  orderRate,
  shopSupplyRate,
  supplyNeeds,
  taskCapacity,
} from '../engine/rules'
import type { GameStore } from '../game/store'

export interface Flow {
  demand: number
  kitchenMax: number
  deliverMax: number
  fry: number
  deliver: number
  bottleneck: 'customers' | 'kitchen' | 'delivery'
  advice: string
}

export function flow(game: GameStore): Flow {
  const s = game.state
  const mods = getMods(s)
  const demand = REGIONS.filter((r) => s.regions[r.id].unlocked).reduce((n, r) => n + orderRate(r, mods).toNumber(), 0)
  const kitchenMax = Math.min(...STAGE_IDS.map((t) => taskCapacity(s, t, mods).toNumber()))
  const deliverMax = deliveryCapacity(s, mods).toNumber()
  const limit = Math.min(demand, kitchenMax, deliverMax)
  const bottleneck = limit === demand ? 'customers' : limit === kitchenMax ? 'kitchen' : 'delivery'
  const advice =
    bottleneck === 'customers'
      ? 'Customers are the limit: expand to a new place to sell more.'
      : bottleneck === 'kitchen'
        ? 'The kitchen is the bottleneck: speed up its slowest step.'
        : 'Delivery is the bottleneck: hire helpers or buy vehicles.'
  return { demand, kitchenMax, deliverMax, fry: game.rates.fry, deliver: game.rates.deliver, bottleneck, advice }
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
  const need = supplyNeeds(s, mods)
  return INGREDIENT_IDS.map((id) => {
    const n = need[id] ?? 0
    let source: Source | null = null
    if (farm) {
      const fromFarm = farmSupply(s, id, mods)
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
  const t = Math.max(
    wait(region.unlockReputation - repNow, game.reputationRate),
    wait(region.unlockCost - moneyNow, game.rates.income),
  )
  // More than a month away at this pace is "not yet", not a number.
  return { region, locked, rep, money, eta: locked || !Number.isFinite(t) || t > 30 * 86400 ? null : t }
}
