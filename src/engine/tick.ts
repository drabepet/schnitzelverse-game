// The simulation. `tick` advances the game by `dt` seconds and mutates the
// state in place (cheaper than copying every frame). It has no dependency on
// the browser, so it runs the same in the game, in tests and in offline catch-up.
import { D, Decimal, ZERO, nonNeg } from './decimal'
import {
  COLD_PRICE_FACTOR,
  COLD_REPUTATION,
  HOT_REPUTATION,
  INGREDIENT_IDS,
  FACILITIES,
  FARM_GOOD_BUFFER,
  VEHICLES,
  MILESTONES,
  REGIONS,
  RESCUE_AFTER_SECONDS,
  RESCUE_AMOUNT,
  RESCUE_MESSAGES,
  SHOP,
  STAGE_IDS,
  STAGES,
  type FacilityId,
  type ItemId,
  type RegionDef,
  type StageId,
} from './content'
import { addLog, HISTORY_LENGTH, HISTORY_STEP, type GameState } from './state'
import { BADGES } from './badges'
import { runManagers } from './automation'
import {
  consumption,
  coolingRate,
  facilityCapacity,
  freshness,
  getMods,
  shelfMax,
  shopSupplyRate,
  ingredientsForNextSchnitzel,
  isStuck,
  orderCap,
  orderRate,
  packSize,
  regionPrice,
  helperReaches,
  vehicleServes,
  stageInputs,
  stageLimit,
  taskCapacity,
  vehicleCapacity,
  type Mods,
} from './rules'

/** What happened during a tick, for rate displays and offline summaries. */
export interface Flows {
  pound: Decimal
  bread: Decimal
  fry: Decimal
  deliver: Decimal
  income: Decimal
  /** Units of output each kind of farm building made. */
  farm: Partial<Record<FacilityId, Decimal>>
}

export const emptyFlows = (): Flows => ({
  pound: ZERO,
  bread: ZERO,
  fry: ZERO,
  deliver: ZERO,
  income: ZERO,
  farm: {},
})

export function addFlows(a: Flows, b: Flows): Flows {
  const farm = { ...a.farm }
  for (const [id, v] of Object.entries(b.farm) as [FacilityId, Decimal][]) farm[id] = (farm[id] ?? ZERO).add(v)
  return {
    pound: a.pound.add(b.pound),
    bread: a.bread.add(b.bread),
    fry: a.fry.add(b.fry),
    deliver: a.deliver.add(b.deliver),
    income: a.income.add(b.income),
    farm,
  }
}

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

function autoBuy(state: GameState, mods: Mods, dt: number): void {
  if (!mods.autoBuy || !state.autoBuy.enabled) return
  // Stock up to the target plus what the kitchen and farm can use during this
  // tick, so long ticks (offline progress) are not capped by the target.
  const use = consumption(state, mods, dt)
  for (const item of INGREDIENT_IDS) {
    const missing = D(state.autoBuy.target).add(use[item] ?? ZERO).sub(state.items[item])
    if (missing.lte(0)) continue
    // Auntie keeps the reserve, unless an ingredient ran out completely:
    // then she buys one pack anyway so the kitchen never stalls.
    const bought = buyPacks(state, item, missing.div(packSize(item, mods)).ceil(), mods, D(state.autoBuy.reserve))
    if (bought.lte(0) && state.items[item].lt(1)) buyPacks(state, item, D(1), mods)
  }
}

/**
 * Farm buildings (Chapter 2), raw producers first. Each makes only what is
 * needed: ingredients up to Auntie's stock target, farm goods up to a buffer,
 * plus whatever the next step can use this tick.
 */
function runFarm(state: GameState, mods: Mods, dt: number, flows: Flows): void {
  const use = consumption(state, mods, dt)
  for (const f of FACILITIES) {
    if (state.facilities[f.id] <= 0) continue
    const isIngredient = (INGREDIENT_IDS as ItemId[]).includes(f.output)
    const target = D(isIngredient ? state.autoBuy.target : FARM_GOOD_BUFFER).add(use[f.output] ?? ZERO)
    const room = nonNeg(target.sub(state.items[f.output])).div(f.yield)
    const cycles = runRecipe(state, f.inputs, f.output, f.yield, Decimal.min(facilityCapacity(state, f, mods).mul(dt), room))
    flows.farm[f.id] = cycles.mul(f.yield)
  }
}

function checkBadges(state: GameState): void {
  for (const b of BADGES) {
    if (state.badges[b.id] !== undefined || !b.check(state)) continue
    state.badges[b.id] = state.stats.playtime
    addLog(state, `🏅 Badge: ${b.emoji} ${b.name}. ${b.flavor}`)
  }
}

function checkMilestones(state: GameState): void {
  for (const m of MILESTONES) {
    if (state.milestones[m.id] || !m.check(state)) continue
    state.milestones[m.id] = true
    addLog(state, m.text)
  }
}

export function tick(state: GameState, dt: number): Flows {
  if (dt <= 0) return emptyFlows()
  const mods = getMods(state)
  const flows = emptyFlows()

  // 1. Customers place orders (backlog is capped: they give up waiting).
  for (const region of REGIONS) {
    const r = state.regions[region.id]
    if (!r.unlocked) continue
    r.orders = Decimal.min(r.orders.add(orderRate(region, mods).mul(dt)), orderCap(region, mods))
  }

  // 2. The farm produces first, so the shop only fills what it doesn't cover.
  runFarm(state, mods, dt, flows)

  // 3. The corner shop restocks its shelves, then Auntie shops. Shopping
  //    happens before cooking so the kitchen never idles on a restock.
  const shelf = shelfMax(mods)
  for (const item of INGREDIENT_IDS) {
    state.shelves[item] = Decimal.min(state.shelves[item].add(shopSupplyRate(mods) * dt), shelf)
  }
  autoBuy(state, mods, dt)

  // 4. Kitchen, upstream to downstream. Staff cook to order: they stop once
  //    enough of their output is waiting for the next step.
  for (const stage of STAGE_IDS) {
    const room = nonNeg(stageLimit(state, stage, mods, dt).sub(state.items[STAGES[stage].output]))
    flows[stage] = runStage(state, stage, Decimal.min(taskCapacity(state, stage, mods).mul(dt), room))
  }

  // 5. Hot schnitzel cools down.
  const cooled = state.items.hot.mul(1 - Math.exp(-coolingRate(mods) * dt))
  state.items.hot = nonNeg(state.items.hot.sub(cooled))
  state.items.cold = state.items.cold.add(cooled)

  // 6. Delivery. The fleet goes first, longest range first, each vehicle to
  //    the best-paying place it can reach; then helpers cover what is left nearby.
  const serve = (capacity: Decimal, reaches: (r: RegionDef) => boolean, freshFor: (r: RegionDef) => number) => {
    for (let i = REGIONS.length - 1; i >= 0 && capacity.gt(0); i--) {
      if (!reaches(REGIONS[i])) continue
      const [served, revenue] = deliverTo(state, REGIONS[i], capacity, mods, freshFor(REGIONS[i]))
      capacity = capacity.sub(served)
      flows.deliver = flows.deliver.add(served)
      flows.income = flows.income.add(revenue)
    }
  }
  for (const v of [...VEHICLES].reverse()) {
    if (state.vehicles[v.id] <= 0) continue
    serve(vehicleCapacity(state, v, mods).mul(dt), (r) => vehicleServes(v, r), (r) => freshness(v, r, mods))
  }
  serve(taskCapacity(state, 'deliver', mods).mul(dt), helperReaches, () => 1)

  // 7. Managers (perks) do the shopping.
  runManagers(state, dt)

  rescueIfStuck(state, dt)
  recordHistory(state, dt)
  state.stats.playtime += dt
  state.run.time += dt
  checkMilestones(state)
  checkBadges(state)
  return flows
}

/** One point of income history every HISTORY_STEP seconds of play. */
function recordHistory(state: GameState, dt: number): void {
  const h = state.history
  h.clock += dt
  if (h.clock < HISTORY_STEP) return
  const income = state.stats.earned.sub(h.earned).div(h.clock).toNumber()
  h.points.push({ t: state.stats.playtime + dt, income: Number.isFinite(income) ? Math.max(0, income) : 0, f: state.prestige.franchises })
  if (h.points.length > HISTORY_LENGTH) h.points.splice(0, h.points.length - HISTORY_LENGTH)
  h.clock = 0
  h.earned = state.stats.earned
}

/** Mum's fridge: the safety net that makes soft-locks impossible. */
function rescueIfStuck(state: GameState, dt: number): void {
  if (!isStuck(state)) {
    state.stuckFor = 0
    return
  }
  state.stuckFor += dt
  if (state.stuckFor < RESCUE_AFTER_SECONDS) return
  for (const item of ingredientsForNextSchnitzel(state)) {
    if (state.items[item].lt(1)) state.items[item] = state.items[item].add(RESCUE_AMOUNT)
  }
  addLog(state, RESCUE_MESSAGES[state.stats.rescues % RESCUE_MESSAGES.length])
  state.stats.rescues++
  state.stuckFor = 0
}

/** Advance by any amount of time in small steps. Used for frames, background tabs and offline progress. */
export function advance(state: GameState, seconds: number, maxStep = 0.25): Flows {
  let flows = emptyFlows()
  let left = seconds
  while (left > 1e-9) {
    const dt = Math.min(maxStep, left)
    flows = addFlows(flows, tick(state, dt))
    left -= dt
  }
  return flows
}
