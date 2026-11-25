// Managers: perks that play the buying part of the game for you. Each runs
// once per MANAGER_INTERVAL of game time, so they also work offline.
import {
  type Effect,
  FACILITIES,
  type FacilityDef,
  type ItemId,
  MANAGER_INTERVAL,
  MANAGER_SPEND_SHARE,
  type PerkId,
  PERKS,
  QUARTERMASTER_SPEND_SHARE,
  type RegionDef,
  REGIONS,
  SAVE_FOR_PLACE_SECONDS,
  SAVE_FOR_PLACE_SECONDS_RANK2,
  SAVE_FOR_PLACE_CUSTOMERS,
  SPEND_LEVELS,
  SUPPLY_LEAD,
  type SpendLevel,
  type Task,
  type UpgradeDef,
  UPGRADES,
  VEHICLES,
  type WorkerDef,
  WORKERS,
  INGREDIENT_SET,
  FACILITY_BY_ID,
  FUEL_IDS,
} from './content'
import { buyFacility, buyPerk, buyUpgrade, buyVehicle, canUnlockRegion, franchise, hireWorker, unlockRegion } from './actions'
import {
  bestMomentToSell,
  businessLimits,
  type Limits,
  type Pillar,
  canBuyPerk,
  canBuyUpgrade,
  canFranchise,
  canReach,
  chapter2Unlocked,
  chapter3Unlocked,
  customerDemand,
  deliveryCapacity,
  facilityCapacity,
  facilityPlan,
  facilitySpeed,
  farmSupply,
  getMods,
  kitchenCapacity,
  meets,
  type Mods,
  pendingCrumbs,
  perkCost,
  perkLevel,
  stepCapacity,
  supplyLimit,
  supplyNeeds,
  taskCapacity,
  upgradeUnlocked,
  vehiclePlan,
  vehicleServes,
  vehicleVisible,
  workerPlan,
  nextRegion,
  regionRequirementsMet,
} from './rules'
import { D, Decimal } from './decimal'
import { MANAGER_LOG_LIMIT, type GameState } from './state'

export const MANAGERS = PERKS.filter((p) => p.manager)

const FUEL_SET: ReadonlySet<ItemId> = new Set(FUEL_IDS)

/** Bought and switched on. */
export function managerActive(state: GameState, id: PerkId): boolean {
  return perkLevel(state, id) > 0 && !state.managersOff[id]
}

/** A manager's rank: 0 (not promoted) to 3. */
export const managerRank = (state: GameState, id: PerkId): number => perkLevel(state, id)

/** How boldly this manager spends, never above what their rank allows. */
export function spendLevel(state: GameState, id: PerkId): SpendLevel {
  const want = state.managerSpend[id] ?? 'normal'
  const def = SPEND_LEVELS.find((l) => l.id === want)!
  return def.rank <= managerRank(state, id) ? want : 'normal'
}

export function setSpendLevel(state: GameState, id: PerkId, level: SpendLevel): boolean {
  const def = SPEND_LEVELS.find((l) => l.id === level)
  if (!def || def.rank > managerRank(state, id)) return false
  state.managerSpend[id] = level
  return true
}

/** The share of your money one purchase may cost for this manager. */
export function spendShare(state: GameState, id: PerkId, base = MANAGER_SPEND_SHARE): number {
  const mult = SPEND_LEVELS.find((l) => l.id === spendLevel(state, id))!.mult
  return Math.min(0.9, base * mult)
}

export function setManager(state: GameState, id: PerkId, on: boolean): void {
  if (on) delete state.managersOff[id]
  else state.managersOff[id] = true
}

/**
 * Income per second over the last few minutes of this run (from the income
 * history), or this run's average while the run is younger than that.
 */
export function recentIncome(state: GameState): number {
  const runStart = state.stats.playtime - state.run.time
  const recent = state.history.points.filter((p) => p.t > runStart).slice(-3)
  if (recent.length) return recent.reduce((n, p) => n + p.income, 0) / recent.length
  return state.run.time > 60 ? state.run.earned.toNumber() / state.run.time : 0
}

export interface Saving {
  region: RegionDef
  /** Money still missing. */
  remaining: number
  /** Seconds until it's there at recent income. */
  eta: number
  /** Customers are the limit, so she saves longer (SAVE_FOR_PLACE_CUSTOMERS). */
  customers: boolean
}

/**
 * Mum (the estate agent) asks the others to wait when the next place only
 * lacks money and that money is only a few minutes of recent income away
 * (SAVE_FOR_PLACE_SECONDS). Longer goals don't pause anyone: buying helpers
 * and equipment meanwhile gets there sooner.
 */
export function savingStatus(state: GameState): Saving | null {
  if (!managerActive(state, 'estateAgent')) return null
  const next = nextRegion(state)?.region
  if (!next || !regionRequirementsMet(state, next) || state.money.gte(next.unlockCost)) return null
  const remaining = D(next.unlockCost).sub(state.money).toNumber()
  const income = recentIncome(state)
  const base = managerRank(state, 'estateAgent') >= 2 ? SAVE_FOR_PLACE_SECONDS_RANK2 : SAVE_FOR_PLACE_SECONDS
  const customers = businessLimits(state, getMods(state)).bottleneck === 'customers'
  const window = customers ? base * SAVE_FOR_PLACE_CUSTOMERS : base
  if (income <= 0 || remaining > income * window) return null
  return { region: next, remaining, eta: remaining / income, customers }
}

/** The place Mum is saving for, if any. */
export function savingFor(state: GameState): RegionDef | null {
  return savingStatus(state)?.region ?? null
}

const cheapEnough = (state: GameState, cost: Decimal, share = MANAGER_SPEND_SHARE) =>
  cost.lte(state.money.mul(share))

/** Money a manager may put into equipment: everything but Auntie's shopping reserve. */
const spendable = (state: GameState): Decimal => state.money.sub(state.autoBuy.enabled ? state.autoBuy.reserve : 0)

/** Enough purchases per look-around for a long offline step to catch up. */
const GUARD = 25

function estateAgent(state: GameState): void {
  for (const r of REGIONS) if (canUnlockRegion(state, r.id)) unlockRegion(state, r.id)
}

/** Which part of the business an effect adds capacity to; null for ones that always help (prices, reputation, crispness…). */
function effectPillar(e: Effect): { pillar: Pillar; task?: Task } | null {
  switch (e.kind) {
    case 'speed':
      return e.task === 'deliver' ? { pillar: 'delivery' } : { pillar: 'kitchen', task: e.task }
    case 'kitchen':
      return { pillar: 'kitchen' }
    case 'building':
      // Star paprika gear moves the fleet, and fuel is never wasted.
      return FACILITY_BY_ID[e.facility].space ? null : { pillar: 'supply' }
    case 'facility':
    case 'shopSupply':
      return { pillar: 'supply' }
    case 'fleet':
      return { pillar: 'delivery' }
    case 'orders':
      return { pillar: 'customers' }
    default:
      return null
  }
}

/**
 * How much a piece of equipment helps right now: 2 adds to what holds the
 * business back, 1 always helps (prices, reputation, crispness, Auntie…),
 * 0 only adds capacity where there is already plenty (more than SUPPLY_LEAD
 * past the limit), so it would stand idle.
 */
export function gearUse(state: GameState, u: UpgradeDef, limits: Limits, mods: Mods): 0 | 1 | 2 {
  // Equipment that only opens something (no effect of its own) always helps.
  let use: 0 | 1 | 2 = u.effects.length ? 0 : 1
  for (const e of u.effects) {
    const p = effectPillar(e)
    if (!p) {
      use = Math.max(use, 1) as 0 | 1 | 2
      continue
    }
    // A kitchen step's own speed counts against that step, not the whole kitchen.
    const cap = p.task ? taskCapacity(state, p.task, mods).toNumber() : limits[p.pillar]
    if (p.pillar === limits.bottleneck && (!p.task || cap <= limits.limit * SUPPLY_LEAD)) return 2
    if (cap < limits.limit * SUPPLY_LEAD) use = Math.max(use, 1) as 0 | 1 | 2
  }
  return use
}

/**
 * Uncle buys equipment: what helps the bottleneck first, then what always
 * helps; never what would only add idle capacity. Within each, cheapest
 * first (rank 2: the biggest piece he can afford, bigger pieces usually do more).
 */
function quartermaster(state: GameState): void {
  const share = spendShare(state, 'quartermaster', QUARTERMASTER_SPEND_SHARE)
  const mods = getMods(state)
  const limits = businessLimits(state, mods)
  const big = managerRank(state, 'quartermaster') >= 2
  const list = UPGRADES.filter((u) => canBuyUpgrade(state, u) && cheapEnough(state, D(u.cost), share))
    .map((u) => ({ u, use: gearUse(state, u, limits, mods) }))
    .filter((x) => x.use > 0)
    .sort((a, b) => b.use - a.use || (big ? b.u.cost - a.u.cost : a.u.cost - b.u.cost))
  for (const { u } of list) if (canBuyUpgrade(state, u) && cheapEnough(state, D(u.cost), share)) buyUpgrade(state, u.id)
}

/** A piece of equipment and how much output per second it adds per dollar. */
interface GearPick {
  u: UpgradeDef
  perDollar: number
}

/**
 * The open equipment that adds the most per dollar: `now` is what the step or
 * building makes per second, `multOf` how much a piece multiplies that.
 */
function bestGear(state: GameState, now: number, multOf: (u: UpgradeDef) => number): GearPick | null {
  let best: GearPick | null = null
  for (const u of UPGRADES) {
    if (!upgradeUnlocked(state, u)) continue
    const mult = multOf(u)
    if (mult <= 1) continue
    const perDollar = (now * (mult - 1)) / u.cost
    if (!best || perDollar > best.perDollar) best = { u, perDollar }
  }
  return best
}

/** Equipment instead of buying more: get it now, or wait for it. */
export type GearStep = { kind: 'equip'; upgrade: UpgradeDef } | { kind: 'wait'; upgrade: UpgradeDef; remaining: number }

/**
 * Grandma's and Grandpa's rule: equipment that does more per dollar than
 * buying another helper or building is bought now, or waited for when it is
 * only a few minutes of income away (no point buying a crowd first).
 */
function gearStep(state: GameState, gear: GearPick | null, buyPerDollar: number): GearStep | null {
  if (!gear || gear.perDollar <= buyPerDollar) return null
  const money = spendable(state)
  if (money.gte(gear.u.cost)) return { kind: 'equip', upgrade: gear.u }
  const remaining = D(gear.u.cost).sub(money).toNumber()
  if (remaining <= recentIncome(state) * SAVE_FOR_PLACE_SECONDS) return { kind: 'wait', upgrade: gear.u, remaining }
  return null
}

/** How much faster an upgrade makes a kitchen or delivery step. */
function taskGearMult(u: UpgradeDef, task: Task): number {
  let mult = 1
  for (const e of u.effects) {
    if (e.kind === 'speed' && e.task === task) mult *= e.mult
    if (e.kind === 'kitchen' && task !== 'deliver') mult *= e.mult
  }
  return mult
}

/**
 * What Grandma does next for the slowest step: hire, buy equipment, or wait for
 * it; or hold off because the ingredients are the limit (more helpers would
 * only stand around, so the money is left for the farm).
 */
export type FamilyStep = { kind: 'hire'; worker: WorkerDef; cost: Decimal } | GearStep | { kind: 'hold' }

export function familyNextStep(state: GameState): FamilyStep | null {
  const mods = getMods(state)
  const demand = customerDemand(state, mods) * 1.3
  const target = Math.min(demand, supplyLimit(state, mods) * SUPPLY_LEAD)
  const tasks: Task[] = ['deliver', 'fry', 'bread', 'pound'] // ties: sell first
  const weakest = tasks
    .map((t) => ({ t, cap: stepCapacity(state, t, mods).toNumber() }))
    .sort((a, b) => a.cap - b.cap)[0]
  if (weakest.cap >= target) return weakest.cap >= demand ? null : { kind: 'hold' }
  // The cheapest helper per unit of work for that step.
  const hire = WORKERS.filter((w) => w.task === weakest.t && meets(state, w.requires))
    .map((w) => ({ w, cost: workerPlan(state, w.id, 1).cost }))
    .sort((a, b) => a.cost.div(a.w.rate).cmp(b.cost.div(b.w.rate)))[0]
  if (!hire) return null
  const hirePerDollar = (hire.w.rate * mods.speed[hire.w.task]) / hire.cost.toNumber()
  const task = weakest.t
  const gear = bestGear(state, taskCapacity(state, task, mods).toNumber(), (u) => taskGearMult(u, task))
  return gearStep(state, gear, hirePerDollar) ?? { kind: 'hire', worker: hire.w, cost: hire.cost }
}

/** Hire for the slowest step while it is below what customers want (+30%), or equip it when that's better value. */
function familyManager(state: GameState): void {
  for (let i = 0; i < GUARD; i++) {
    const step = familyNextStep(state)
    if (!step || step.kind === 'wait' || step.kind === 'hold') return
    if (step.kind === 'equip') {
      if (!buyUpgrade(state, step.upgrade.id)) return
      continue
    }
    const share = spendShare(state, 'familyManager')
    // Rank 2: ten at a time when that is still cheap enough.
    if (managerRank(state, 'familyManager') >= 2 && cheapEnough(state, workerPlan(state, step.worker.id, 10).cost, share)) {
      if (hireWorker(state, step.worker.id, 10)) continue
    }
    if (!cheapEnough(state, step.cost, share) || !hireWorker(state, step.worker.id, 1)) return
  }
}

/**
 * The farm building holding back an item: follow the chain upstream while an
 * input can't keep up with the building that needs it.
 */
export function farmBottleneck(state: GameState, item: ItemId, mods: Mods): FacilityDef | null {
  const maker = FACILITIES.find((f) => f.output === item)
  if (!maker) return null
  const cycles = facilityCapacity(state, maker, mods).toNumber()
  let worst: { input: ItemId; ratio: number } | null = null
  for (const [input, qty] of Object.entries(maker.inputs) as [ItemId, number][]) {
    const ratio = farmSupply(state, input, mods) / qty / Math.max(cycles, 1e-9)
    if (ratio < 1 && (!worst || ratio < worst.ratio)) worst = { input, ratio }
  }
  // Build the processor first when there is none, then grow what feeds it.
  if (cycles > 0 && worst) return farmBottleneck(state, worst.input, mods) ?? maker
  return maker
}

/** How much faster an upgrade makes one kind of farm building (group gear and its own gear). */
export function farmGearMult(u: UpgradeDef, f: FacilityDef): number {
  let mult = 1
  for (const e of u.effects) {
    if (e.kind === 'facility' && e.group === f.group) mult *= e.mult
    if (e.kind === 'building' && e.facility === f.id) mult *= e.mult
  }
  return mult
}

/** What Grandpa does next for one short ingredient (or ship fuel): build, buy equipment, or wait for it. */
export type FarmStep = { kind: 'build'; facility: FacilityDef; cost: Decimal } | GearStep

/** Ingredients (and star paprika for the fleet) the farm covers least of what is needed, worst first. */
function shortIngredients(state: GameState, mods: Mods): ItemId[] {
  const need = supplyNeeds(state, mods)
  // No further than customers want (+30%): supplyNeeds follows the kitchen and fleet.
  const l = businessLimits(state, mods)
  const scale = Math.min(1, (l.customers * 1.3) / Math.max(1e-9, Math.min(l.kitchen, l.delivery)))
  for (const k of Object.keys(need) as ItemId[]) need[k] = (need[k] ?? 0) * scale
  return (Object.keys(need) as ItemId[])
    .filter((item) => INGREDIENT_SET.has(item) || FUEL_SET.has(item))
    .map((item) => ({ item, cover: farmSupply(state, item, mods) / Math.max(need[item] ?? 0, 1e-9) }))
    .filter((x) => (need[x.item] ?? 0) > 0 && x.cover < 1.1)
    .sort((a, b) => a.cover - b.cover)
    .map((x) => x.item)
}

/**
 * For the building holding back an ingredient: another building, or farm
 * equipment for its group if that adds more per dollar (bought now, or
 * waited for when it's only a few minutes of income away).
 */
function farmStepFor(state: GameState, item: ItemId, mods: Mods): FarmStep | null {
  const f = farmBottleneck(state, item, mods)
  if (!f) return null
  const cost = facilityPlan(state, f, 1).cost
  const buildPerDollar = (facilitySpeed(state, f, mods) * f.yield) / cost.toNumber()
  const gear = bestGear(state, facilityCapacity(state, f, mods).toNumber() * f.yield, (u) => farmGearMult(u, f))
  return gearStep(state, gear, buildPerDollar) ?? { kind: 'build', facility: f, cost }
}

/** What Grandpa does next for the shortest ingredient (for the sidebar). */
export function farmNextStep(state: GameState): FarmStep | null {
  if (!chapter2Unlocked(state)) return null
  const mods = getMods(state)
  const first = shortIngredients(state, mods)[0]
  return first ? farmStepFor(state, first, mods) : null
}

/** Grow the ingredient the farm covers least of what the kitchen needs. */
function farmManager(state: GameState): void {
  if (!chapter2Unlocked(state)) return
  for (let i = 0; i < GUARD; i++) {
    const mods = getMods(state)
    let bought = false
    for (const item of shortIngredients(state, mods)) {
      const step = farmStepFor(state, item, mods)
      if (!step) continue
      if (step.kind === 'wait') return // saving for better farm equipment
      if (step.kind === 'equip') {
        bought = buyUpgrade(state, step.upgrade.id)
        break
      }
      const share = spendShare(state, 'farmManager')
      const ten = managerRank(state, 'farmManager') >= 2 && cheapEnough(state, facilityPlan(state, step.facility, 10).cost, share)
      if (ten ? buyFacility(state, step.facility.id, 10) : cheapEnough(state, step.cost, share) && buyFacility(state, step.facility.id, 1)) {
        bought = true
        break
      }
    }
    if (!bought) return
  }
}

/**
 * What the fleet should carry: what the kitchen makes, or, when the
 * ingredients are the limit, a little more than they can feed (SUPPLY_LEAD).
 */
function fleetTarget(state: GameState, mods: Mods): number {
  const l = businessLimits(state, mods)
  return Math.min(l.kitchen * 1.1, l.supply * SUPPLY_LEAD * 1.1, l.customers * 1.3)
}

/** The kid is waiting for the farm: the fleet carries all the ingredients can feed, though not all the kitchen could make. */
export function fleetWaitsForSupply(state: GameState): boolean {
  if (!chapter3Unlocked(state)) return false
  const mods = getMods(state)
  const target = fleetTarget(state, mods)
  return deliveryCapacity(state, mods).toNumber() >= target && target < Math.min(kitchenCapacity(state, mods) * 1.1, customerDemand(state, mods) * 1.3)
}

/** Reach every unlocked place, then add capacity while delivery lags the kitchen (or the ingredients, when they are the limit). */
function dispatcher(state: GameState): void {
  if (!chapter3Unlocked(state)) return
  const mods = getMods(state)
  for (const r of REGIONS) {
    if (!state.regions[r.id].unlocked || canReach(state, r)) continue
    const v = VEHICLES.find((x) => vehicleVisible(state, x) && vehicleServes(x, r))
    if (v && cheapEnough(state, vehiclePlan(state, v, 1).cost, Math.max(0.5, spendShare(state, 'dispatcher')))) buyVehicle(state, v.id, 1)
  }
  for (let i = 0; i < GUARD; i++) {
    if (deliveryCapacity(state, mods).toNumber() >= fleetTarget(state, mods)) return
    // Only vehicles that serve a place you deliver to.
    const useful = VEHICLES.filter(
      (v) => vehicleVisible(state, v) && REGIONS.some((r) => state.regions[r.id].unlocked && vehicleServes(v, r)),
    )
    const share = spendShare(state, 'dispatcher')
    const best = useful
      .map((v) => ({ v, plan: vehiclePlan(state, v, 1) }))
      .filter((x) => cheapEnough(state, x.plan.cost, share))
      .sort((a, b) => b.v.capacity / b.plan.cost.toNumber() - a.v.capacity / a.plan.cost.toNumber())[0]
    if (!best) return
    // Rank 2: ten at a time when that is still cheap enough.
    const ten = managerRank(state, 'dispatcher') >= 2 && cheapEnough(state, vehiclePlan(state, best.v, 10).cost, share)
    if (!buyVehicle(state, best.v.id, ten ? 10 : 1)) return
  }
}

/** Let the managers look around. Called every tick; acts every MANAGER_INTERVAL. */
export function runManagers(state: GameState, dt: number): void {
  if (!MANAGERS.some((m) => managerActive(state, m.id))) return
  state.managerClock += dt
  if (state.managerClock < MANAGER_INTERVAL) return
  state.managerClock = 0
  if (managerActive(state, 'estateAgent')) {
    if (autoSellDue(state)) return sellForYou(state)
    logged(state, 'estateAgent', estateAgent)
  }
  // A short pause (a few minutes at most, see savingStatus) while Mum saves up.
  if (savingFor(state)) return
  if (managerActive(state, 'quartermaster')) logged(state, 'quartermaster', quartermaster)
  if (managerActive(state, 'farmManager')) logged(state, 'farmManager', farmManager)
  if (managerActive(state, 'dispatcher')) logged(state, 'dispatcher', dispatcher)
  if (managerActive(state, 'familyManager')) logged(state, 'familyManager', familyManager)
}

// ---------------------------------------------------------------- the managers' log

/** Purchases closer together than this (s) go into one log entry. */
const LOG_MERGE_SECONDS = 60

/** Run one manager and write down what they bought: helpers, buildings, vehicles, equipment, places. */
function logged(state: GameState, who: PerkId, work: (state: GameState) => void): void {
  const before = {
    money: state.money,
    workers: { ...state.workers },
    facilities: { ...state.facilities },
    vehicles: { ...state.vehicles },
    upgrades: new Set(Object.keys(state.upgrades)),
    regions: new Set(REGIONS.filter((r) => state.regions[r.id].unlocked).map((r) => r.id)),
  }
  work(state)
  const items: Record<string, number> = {}
  for (const w of WORKERS) if (state.workers[w.id] > before.workers[w.id]) items[`${w.emoji} ${w.name}`] = state.workers[w.id] - before.workers[w.id]
  for (const f of FACILITIES)
    if (state.facilities[f.id] > before.facilities[f.id]) items[`${f.emoji} ${f.name}`] = state.facilities[f.id] - before.facilities[f.id]
  for (const v of VEHICLES) if (state.vehicles[v.id] > before.vehicles[v.id]) items[`${v.emoji} ${v.name}`] = state.vehicles[v.id] - before.vehicles[v.id]
  for (const u of UPGRADES) if (state.upgrades[u.id] && !before.upgrades.has(u.id)) items[`${u.emoji} ${u.name}`] = 1
  for (const r of REGIONS) if (state.regions[r.id].unlocked && !before.regions.has(r.id)) items[`${r.emoji} ${r.name}`] = 1
  if (!Object.keys(items).length) return
  const cost = Math.max(0, before.money.sub(state.money).toNumber())
  recordManagerWork(state, who, items, cost)
}

/** "25 × 🧑‍🍳 Cousin at the stove, 🔨 Heavier mallet" */
export function describeManagerItems(items: Record<string, number>): string {
  return Object.entries(items)
    .map(([what, n]) => (n > 1 ? `${n} × ${what}` : what))
    .join(', ')
}

/** Add to the log (merged into the manager's latest entry while they keep buying) and to this run's spending. */
export function recordManagerWork(state: GameState, who: PerkId, items: Record<string, number>, cost: number): void {
  state.run.managerSpent[who] = (state.run.managerSpent[who] ?? 0) + cost
  const now = state.stats.playtime
  const log = state.managerLog
  const last = [...log].reverse().find((e) => e.who === who)
  if (last && now - last.t < LOG_MERGE_SECONDS && log[log.length - 1] === last) {
    for (const [k, n] of Object.entries(items)) last.items[k] = (last.items[k] ?? 0) + n
    last.cost += cost
    last.t = now
    return
  }
  log.push({ t: now, who, items, cost })
  if (log.length > MANAGER_LOG_LIMIT) log.splice(0, log.length - MANAGER_LOG_LIMIT)
}

// ---------------------------------------------------------------- Mum sells the business (rank 3)

/** Rank 3 Mum, switched on, and the player's rule is met. */
export function autoSellDue(state: GameState): boolean {
  const a = state.autoSell
  if (!a.enabled || managerRank(state, 'estateAgent') < 3 || !canFranchise(state)) return false
  if (a.rule === 'time') return state.run.time >= a.minutes * 60
  if (a.rule === 'share') {
    const lifetime = Decimal.max(1, state.prestige.totalCrumbs)
    return pendingCrumbs(state).gte(lifetime.mul(a.percent / 100))
  }
  // Best moment: crumbs per hour has peaked and started to fall.
  return bestMomentToSell(state)
}

/** Mum sells; then, if asked, Auntie spends the crumbs on the cheapest perks (never on a pick-one choice). */
function sellForYou(state: GameState): void {
  const gain = pendingCrumbs(state)
  if (!franchise(state)) return
  recordManagerWork(state, 'estateAgent', { [`✨ Sold the business: +${gain.floor().toString()} Golden Crumbs`]: 1 }, 0)
  if (!state.autoSell.spendCrumbs) return
  const bought: Record<string, number> = {}
  for (let i = 0; i < 500; i++) {
    const perk = PERKS.filter((p) => !p.fork && canBuyPerk(state, p)).sort((a, b) => perkCost(state, a).cmp(perkCost(state, b)))[0]
    if (!perk || !buyPerk(state, perk.id)) break
    const key = `${perk.emoji} ${perk.name}`
    bought[key] = (bought[key] ?? 0) + 1
  }
  if (Object.keys(bought).length) recordManagerWork(state, 'estateAgent', bought, 0)
}
