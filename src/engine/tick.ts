// The simulation. `tick` advances the game by `dt` seconds and mutates the
// state in place (cheaper than copying every frame). It has no dependency on
// the browser, so it runs the same in the game, in tests and in offline catch-up.
import { D, Decimal, ZERO, nonNeg } from './decimal'
import { FACILITIES, type FacilityId, FARM_GOOD_BUFFER, INGREDIENT_IDS, INGREDIENT_SET, MILESTONES, type RegionDef, REGIONS, RESCUE_AFTER_SECONDS, RESCUE_AMOUNT, RESCUE_MESSAGES, STAGE_IDS, STAGES, VEHICLES, FAMILY_LINES } from './content'
import { addLog, HISTORY_LENGTH, HISTORY_STEP, type GameState } from './state'
import { BADGES } from './badges'
import { runManagers } from './automation'
import {
  consumption,
  coolingRate,
  crumbGrowth,
  crumbRate,
  facilityCapacity,
  freshness,
  getMods,
  helperReaches,
  ingredientsForNextSchnitzel,
  isStuck,
  type Mods,
  orderCap,
  orderRate,
  packSize,
  shelfMax,
  shopSupplyRate,
  stageLimit,
  taskCapacity,
  vehicleCapacity,
  vehicleServes,
} from './rules'
import { routeKey, type CarrierId } from './routes'
import { buyPacks, deliverTo, runRecipe, runStage } from './ops'

/** What happened during a tick, for rate displays and offline summaries. */
export interface Flows {
  pound: Decimal
  bread: Decimal
  fry: Decimal
  deliver: Decimal
  income: Decimal
  /** Units of output each kind of farm building made. */
  farm: Partial<Record<FacilityId, Decimal>>
  /** Schnitzels delivered per route, keyed by routeKey(carrier, place). */
  routes: Record<string, Decimal>
}

export const emptyFlows = (): Flows => ({
  pound: ZERO,
  bread: ZERO,
  fry: ZERO,
  deliver: ZERO,
  income: ZERO,
  farm: {},
  routes: {},
})

export function addFlows(a: Flows, b: Flows): Flows {
  const farm = { ...a.farm }
  for (const [id, v] of Object.entries(b.farm) as [FacilityId, Decimal][]) farm[id] = (farm[id] ?? ZERO).add(v)
  const routes = { ...a.routes }
  for (const [k, v] of Object.entries(b.routes)) routes[k] = (routes[k] ?? ZERO).add(v)
  return {
    pound: a.pound.add(b.pound),
    bread: a.bread.add(b.bread),
    fry: a.fry.add(b.fry),
    deliver: a.deliver.add(b.deliver),
    income: a.income.add(b.income),
    farm,
    routes,
  }
}

/** Longest range first: the fleet delivers in this order. */
const FLEET_FAR_FIRST = [...VEHICLES].reverse()

/** What the kitchen and farm can use in one tick, per item. */
type Use = ReturnType<typeof consumption>

function autoBuy(state: GameState, mods: Mods, use: Use): void {
  if (!mods.autoBuy || !state.autoBuy.enabled) return
  // Stock up to the target plus what the kitchen and farm can use during this
  // tick, so long ticks (offline progress) are not capped by the target.
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
function runFarm(state: GameState, mods: Mods, dt: number, use: Use, flows: Flows): void {
  for (const f of FACILITIES) {
    if (state.facilities[f.id] <= 0) continue
    const target = D(INGREDIENT_SET.has(f.output) ? state.autoBuy.target : FARM_GOOD_BUFFER).add(use[f.output] ?? ZERO)
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
    // The family has something to say about it (the chronicle): one entry, two lines.
    const line = FAMILY_LINES[m.id]
    addLog(state, line ? `${m.text}\n${line}` : m.text)
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
  //    What the kitchen and farm can use this tick depends only on staff,
  //    buildings and modifiers, none of which change until the managers run.
  const use = consumption(state, mods, dt)
  runFarm(state, mods, dt, use, flows)

  // 3. The corner shop restocks its shelves, then Auntie shops. Shopping
  //    happens before cooking so the kitchen never idles on a restock.
  const shelf = shelfMax(mods)
  for (const item of INGREDIENT_IDS) {
    state.shelves[item] = Decimal.min(state.shelves[item].add(shopSupplyRate(mods) * dt), shelf)
  }
  autoBuy(state, mods, use)

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
  const serve = (
    carrier: CarrierId,
    capacity: Decimal,
    reaches: (r: RegionDef) => boolean,
    freshFor: (r: RegionDef) => number,
  ) => {
    for (let i = REGIONS.length - 1; i >= 0 && capacity.gt(0); i--) {
      if (!reaches(REGIONS[i])) continue
      const [served, revenue] = deliverTo(state, REGIONS[i], capacity, mods, freshFor(REGIONS[i]))
      if (served.gt(0)) flows.routes[routeKey(carrier, REGIONS[i].id)] = served
      capacity = capacity.sub(served)
      flows.deliver = flows.deliver.add(served)
      flows.income = flows.income.add(revenue)
    }
  }
  for (const v of FLEET_FAR_FIRST) {
    if (state.vehicles[v.id] <= 0) continue
    serve(v.id, vehicleCapacity(state, v, mods).mul(dt), (r) => vehicleServes(v, r), (r) => freshness(v, r, mods))
  }
  serve('helpers', taskCapacity(state, 'deliver', mods).mul(dt), helperReaches, () => 1)

  // 7. Managers (perks) do the shopping.
  runManagers(state, dt)

  rescueIfStuck(state, dt)
  recordHistory(state, dt)
  trackCrumbRate(state)
  state.stats.playtime += dt
  state.run.time += dt
  checkMilestones(state)
  checkBadges(state)
  return flows
}

/** The best Golden Crumbs per hour of this run (for Mum's best-moment rule and the Franchise tab). */
function trackCrumbRate(state: GameState): void {
  if (!state.prestige.unlocked && state.prestige.franchises === 0) return
  const rate = crumbRate(state)
  if (rate > state.run.crumbRatePeak) state.run.crumbRatePeak = rate
  const growth = crumbGrowth(state)
  if (growth > state.run.growthPeak) state.run.growthPeak = growth
}

/** One point of income history every HISTORY_STEP seconds of play. */
function recordHistory(state: GameState, dt: number): void {
  const h = state.history
  h.clock += dt
  if (h.clock < HISTORY_STEP) return
  const income = state.stats.earned.sub(h.earned).div(h.clock).toNumber()
  const perSecond = Number.isFinite(income) ? Math.max(0, income) : 0
  h.points.push({ t: state.stats.playtime + dt, income: perSecond, f: state.prestige.franchises })
  if (perSecond > state.stats.bestIncome) state.stats.bestIncome = perSecond
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
