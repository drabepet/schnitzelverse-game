// Managers: perks that play the buying part of the game for you. Each runs
// once per MANAGER_INTERVAL of game time, so they also work offline.
import {
  FACILITIES,
  MANAGER_INTERVAL,
  MANAGER_SPEND_SHARE,
  PERKS,
  QUARTERMASTER_SPEND_SHARE,
  REGIONS,
  SAVE_FOR_PLACE_SECONDS,
  STAGE_IDS,
  UPGRADES,
  VEHICLES,
  WORKERS,
  type FacilityDef,
  type IngredientId,
  type ItemId,
  type PerkId,
  type RegionDef,
  type Task,
  type UpgradeDef,
  type WorkerDef,
} from './content'
import { buyFacility, buyUpgrade, buyVehicle, canUnlockRegion, hireWorker, unlockRegion } from './actions'
import {
  canBuyUpgrade,
  canReach,
  chapter2Unlocked,
  chapter3Unlocked,
  chapter4Unlocked,
  deliveryCapacity,
  facilityCapacity,
  facilityPlan,
  farmSupply,
  getMods,
  meets,
  orderRate,
  perkLevel,
  supplyNeeds,
  taskCapacity,
  upgradeUnlocked,
  vehiclePlan,
  vehicleServes,
  vehicleVisible,
  workerPlan,
  type Mods,
} from './rules'
import { D, type Decimal } from './decimal'
import type { GameState } from './state'

export const MANAGERS = PERKS.filter((p) => p.manager)

/** Bought and switched on. */
export function managerActive(state: GameState, id: PerkId): boolean {
  return perkLevel(state, id) > 0 && !state.managersOff[id]
}

export function setManager(state: GameState, id: PerkId, on: boolean): void {
  if (on) delete state.managersOff[id]
  else state.managersOff[id] = true
}

/** Customers' orders per second over all unlocked places. */
export function demand(state: GameState, mods: Mods): number {
  return REGIONS.filter((r) => state.regions[r.id].unlocked).reduce((n, r) => n + orderRate(r, mods).toNumber(), 0)
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
}

/**
 * Mum (the estate agent) asks the others to wait when the next place only
 * lacks money and that money is only a few minutes of recent income away
 * (SAVE_FOR_PLACE_SECONDS). Longer goals don't pause anyone: buying helpers
 * and equipment meanwhile gets there sooner.
 */
export function savingStatus(state: GameState): Saving | null {
  if (!managerActive(state, 'estateAgent')) return null
  const next = REGIONS.find((r) => !state.regions[r.id].unlocked)
  if (!next) return null
  if (next.space && !chapter4Unlocked(state)) return null
  if (state.prestige.franchises < (next.requiresFranchises ?? 0)) return null
  if (!meets(state, { reputation: next.unlockReputation })) return null
  if (state.money.gte(next.unlockCost)) return null
  const remaining = D(next.unlockCost).sub(state.money).toNumber()
  const income = recentIncome(state)
  if (income <= 0 || remaining > income * SAVE_FOR_PLACE_SECONDS) return null
  return { region: next, remaining, eta: remaining / income }
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

function quartermaster(state: GameState): void {
  for (const u of [...UPGRADES].sort((a, b) => a.cost - b.cost)) {
    if (canBuyUpgrade(state, u) && cheapEnough(state, D(u.cost), QUARTERMASTER_SPEND_SHARE)) buyUpgrade(state, u.id)
  }
}

/**
 * Equipment that speeds up a step, and how much work per second it adds per
 * dollar (its multiplier applied to what the helpers on that step do now).
 */
function bestUpgradeFor(state: GameState, task: Task, mods: Mods): { u: UpgradeDef; perDollar: number } | null {
  const now = taskCapacity(state, task, mods).toNumber()
  let best: { u: UpgradeDef; perDollar: number } | null = null
  for (const u of UPGRADES) {
    if (!upgradeUnlocked(state, u)) continue
    let mult = 1
    for (const e of u.effects) {
      if (e.kind === 'speed' && e.task === task) mult *= e.mult
      if (e.kind === 'kitchen' && task !== 'deliver') mult *= e.mult
    }
    if (mult <= 1) continue
    const perDollar = (now * (mult - 1)) / u.cost
    if (!best || perDollar > best.perDollar) best = { u, perDollar }
  }
  return best
}

/** What Grandma does next for the slowest step: hire, buy equipment, or wait for it. */
export type FamilyStep =
  | { kind: 'hire'; worker: WorkerDef; cost: Decimal }
  | { kind: 'equip'; upgrade: UpgradeDef }
  | { kind: 'wait'; upgrade: UpgradeDef; remaining: number }

export function familyNextStep(state: GameState): FamilyStep | null {
  const mods = getMods(state)
  const target = demand(state, mods) * 1.3
  const tasks: Task[] = ['deliver', 'fry', 'bread', 'pound'] // ties: sell first
  const weakest = tasks
    .map((t) => ({ t, cap: (t === 'deliver' ? deliveryCapacity(state, mods) : taskCapacity(state, t, mods)).toNumber() }))
    .sort((a, b) => a.cap - b.cap)[0]
  if (weakest.cap >= target) return null
  // The cheapest helper per unit of work for that step.
  const hire = WORKERS.filter((w) => w.task === weakest.t && meets(state, w.requires))
    .map((w) => ({ w, cost: workerPlan(state, w.id, 1).cost }))
    .sort((a, b) => a.cost.div(a.w.rate).cmp(b.cost.div(b.w.rate)))[0]
  if (!hire) return null
  const hirePerDollar = (hire.w.rate * mods.speed[hire.w.task]) / hire.cost.toNumber()
  // Equipment that does more per dollar than another helper: buy it, or wait for it
  // if it's only a few minutes of income away (no point hiring a crowd first).
  const gear = bestUpgradeFor(state, weakest.t, mods)
  if (gear && gear.perDollar > hirePerDollar) {
    const money = spendable(state)
    if (money.gte(gear.u.cost)) return { kind: 'equip', upgrade: gear.u }
    const remaining = D(gear.u.cost).sub(money).toNumber()
    if (remaining <= recentIncome(state) * SAVE_FOR_PLACE_SECONDS) return { kind: 'wait', upgrade: gear.u, remaining }
  }
  return { kind: 'hire', worker: hire.w, cost: hire.cost }
}

/** Hire for the slowest step while it is below what customers want (+30%), or equip it when that's better value. */
function familyManager(state: GameState): void {
  for (let i = 0; i < GUARD; i++) {
    const step = familyNextStep(state)
    if (!step || step.kind === 'wait') return
    if (step.kind === 'equip') {
      if (!buyUpgrade(state, step.upgrade.id)) return
      continue
    }
    if (!cheapEnough(state, step.cost) || !hireWorker(state, step.worker.id, 1)) return
  }
}

/**
 * The farm building holding back an item: follow the chain upstream while an
 * input can't keep up with the building that needs it.
 */
function farmBottleneck(state: GameState, item: ItemId, mods: Mods): FacilityDef | null {
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

/** Farm equipment for a building's group, and how much output per second it adds per dollar. */
function bestFarmUpgradeFor(state: GameState, f: FacilityDef, mods: Mods): { u: UpgradeDef; perDollar: number } | null {
  const now = facilityCapacity(state, f, mods).toNumber() * f.yield
  let best: { u: UpgradeDef; perDollar: number } | null = null
  for (const u of UPGRADES) {
    if (!upgradeUnlocked(state, u)) continue
    let mult = 1
    for (const e of u.effects) if (e.kind === 'facility' && e.group === f.group) mult *= e.mult
    if (mult <= 1) continue
    const perDollar = (now * (mult - 1)) / u.cost
    if (!best || perDollar > best.perDollar) best = { u, perDollar }
  }
  return best
}

/** What Grandpa does next for one short ingredient: build, buy equipment, or wait for it. */
export type FarmStep =
  | { kind: 'build'; facility: FacilityDef; cost: Decimal }
  | { kind: 'equip'; upgrade: UpgradeDef }
  | { kind: 'wait'; upgrade: UpgradeDef; remaining: number }

/** Ingredients the farm covers least of what the kitchen needs, worst first. */
function shortIngredients(state: GameState, mods: Mods): IngredientId[] {
  const need = supplyNeeds(state, mods)
  return (Object.keys(need) as ItemId[])
    .filter((item): item is IngredientId => ['meat', 'flour', 'eggs', 'crumbs', 'oil'].includes(item))
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
function farmStepFor(state: GameState, item: IngredientId, mods: Mods): FarmStep | null {
  const f = farmBottleneck(state, item, mods)
  if (!f) return null
  const cost = facilityPlan(state, f, 1).cost
  const buildPerDollar = (f.rate * f.yield * mods.facility[f.group]) / cost.toNumber()
  const gear = bestFarmUpgradeFor(state, f, mods)
  if (gear && gear.perDollar > buildPerDollar) {
    const money = spendable(state)
    if (money.gte(gear.u.cost)) return { kind: 'equip', upgrade: gear.u }
    const remaining = D(gear.u.cost).sub(money).toNumber()
    if (remaining <= recentIncome(state) * SAVE_FOR_PLACE_SECONDS) return { kind: 'wait', upgrade: gear.u, remaining }
  }
  return { kind: 'build', facility: f, cost }
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
      if (cheapEnough(state, step.cost) && buyFacility(state, step.facility.id, 1)) {
        bought = true
        break
      }
    }
    if (!bought) return
  }
}

/** Reach every unlocked place, then add capacity while delivery lags the kitchen. */
function dispatcher(state: GameState): void {
  if (!chapter3Unlocked(state)) return
  const mods = getMods(state)
  for (const r of REGIONS) {
    if (!state.regions[r.id].unlocked || canReach(state, r)) continue
    const v = VEHICLES.find((x) => vehicleVisible(state, x) && vehicleServes(x, r))
    if (v && cheapEnough(state, vehiclePlan(state, v, 1).cost, 0.5)) buyVehicle(state, v.id, 1)
  }
  for (let i = 0; i < GUARD; i++) {
    const kitchen = Math.min(...STAGE_IDS.map((t) => taskCapacity(state, t, mods).toNumber()))
    if (deliveryCapacity(state, mods).toNumber() >= kitchen * 1.1) return
    // Only vehicles that serve a place you deliver to.
    const useful = VEHICLES.filter(
      (v) => vehicleVisible(state, v) && REGIONS.some((r) => state.regions[r.id].unlocked && vehicleServes(v, r)),
    )
    const best = useful
      .map((v) => ({ v, plan: vehiclePlan(state, v, 1) }))
      .filter((x) => cheapEnough(state, x.plan.cost))
      .sort((a, b) => b.v.capacity / b.plan.cost.toNumber() - a.v.capacity / a.plan.cost.toNumber())[0]
    if (!best || !buyVehicle(state, best.v.id, 1)) return
  }
}

/** Let the managers look around. Called every tick; acts every MANAGER_INTERVAL. */
export function runManagers(state: GameState, dt: number): void {
  if (!MANAGERS.some((m) => managerActive(state, m.id))) return
  state.managerClock += dt
  if (state.managerClock < MANAGER_INTERVAL) return
  state.managerClock = 0
  if (managerActive(state, 'estateAgent')) estateAgent(state)
  // A short pause (a few minutes at most, see savingStatus) while Mum saves up.
  if (savingFor(state)) return
  if (managerActive(state, 'quartermaster')) quartermaster(state)
  if (managerActive(state, 'farmManager')) farmManager(state)
  if (managerActive(state, 'dispatcher')) dispatcher(state)
  if (managerActive(state, 'familyManager')) familyManager(state)
}
