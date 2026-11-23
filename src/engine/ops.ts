// The basic moves of the simulation: turn ingredients into food, deliver it,
// buy packs from the shop. Used by the tick and by player actions (clicking
// Cook, Deliver or Restock), so they live here and neither imports the other.
import { Decimal, ZERO, nonNeg } from './decimal'
import { COLD_PRICE_FACTOR, COLD_REPUTATION, HOT_REPUTATION, INGREDIENT_IDS, SHOP, STAGES, type ItemId, type RegionDef, type StageId } from './content'
import type { GameState } from './state'
import { packSize, regionPrice, stageInputs, type Mods } from './rules'

/**
 * Run a recipe for up to `max` cycles, limited by available inputs.
 * Each cycle consumes `inputs` and produces `yieldPer` of `output`. Returns cycles run.
 */
export function runRecipe(
  state: GameState,
  inputs: Partial<Record<ItemId, number>>,
  output: ItemId,
  yieldPer: number,
  max: Decimal,
): Decimal {
  const entries = Object.entries(inputs) as [ItemId, number][]
  let cycles = max
  for (const [item, qty] of entries) cycles = Decimal.min(cycles, state.items[item].div(qty))
  if (cycles.lte(0)) return ZERO
  for (const [item, qty] of entries) state.items[item] = nonNeg(state.items[item].sub(cycles.mul(qty)))
  state.items[output] = state.items[output].add(cycles.mul(yieldPer))
  return cycles
}

/** Run a kitchen stage for up to `max` units, limited by available inputs. */
export function runStage(state: GameState, stage: StageId, max: Decimal): Decimal {
  return runRecipe(state, stageInputs(state, stage), STAGES[stage].output, 1, max)
}

/**
 * Deliver up to `max` schnitzels to a region. Hot ones go first; `fresh` is the
 * share of them still hot on arrival (long trips cool them). Returns [served, revenue].
 */
export function deliverTo(
  state: GameState,
  region: RegionDef,
  max: Decimal,
  mods: Mods,
  fresh = 1,
): [Decimal, Decimal] {
  const r = state.regions[region.id]
  if (!r.unlocked) return [ZERO, ZERO]
  const stock = state.items.hot.add(state.items.cold)
  const amount = Decimal.min(Decimal.min(max, r.orders), stock)
  if (amount.lte(0)) return [ZERO, ZERO]

  const hotTaken = Decimal.min(amount, state.items.hot)
  const coldTaken = amount.sub(hotTaken)
  const hot = hotTaken.mul(fresh) // still hot on arrival
  const cold = amount.sub(hot)
  const price = regionPrice(region, mods)
  const revenue = price.mul(hot.add(cold.mul(COLD_PRICE_FACTOR)))

  state.items.hot = nonNeg(state.items.hot.sub(hotTaken))
  state.items.cold = nonNeg(state.items.cold.sub(coldTaken))
  r.orders = nonNeg(r.orders.sub(amount))
  state.money = state.money.add(revenue)
  state.reputation = state.reputation.add(hot.mul(HOT_REPUTATION).add(cold.mul(COLD_REPUTATION)).mul(mods.reputation))
  state.stats.served = state.stats.served.add(amount)
  state.stats.servedCold = state.stats.servedCold.add(cold)
  state.run.served = state.run.served.add(amount)
  state.run.servedCold = state.run.servedCold.add(cold)
  state.stats.earned = state.stats.earned.add(revenue)
  state.run.earned = state.run.earned.add(revenue)
  return [amount, revenue]
}

/**
 * Buy up to `packs` packs of an ingredient, as many as money allows while
 * keeping `keep` in the till. Returns packs bought.
 */
export function buyPacks(
  state: GameState,
  item: (typeof INGREDIENT_IDS)[number],
  packs: Decimal,
  mods: Mods,
  keep: Decimal = ZERO,
): Decimal {
  const offer = SHOP[item]
  const size = packSize(item, mods)
  const affordable = nonNeg(state.money.sub(keep)).div(offer.packPrice).floor()
  const onShelf = state.shelves[item].div(size).floor()
  const wanted = Decimal.min(packs, affordable).floor()
  const n = Decimal.min(wanted, onShelf)
  if (n.lt(wanted)) state.stats.soldOut++
  if (n.lte(0)) return ZERO
  state.money = nonNeg(state.money.sub(n.mul(offer.packPrice)))
  state.shelves[item] = nonNeg(state.shelves[item].sub(n.mul(size)))
  state.items[item] = state.items[item].add(n.mul(size))
  return n
}
