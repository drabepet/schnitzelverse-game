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
} from './content'
import { buyFacility, buyUpgrade, buyVehicle, canUnlockRegion, hireWorker, unlockRegion } from './actions'
import {
  canBuyUpgrade,
  canReach,
  chapter2Unlocked,
  chapter3Unlocked,
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
  vehiclePlan,
  vehicleServes,
  vehicleVisible,
  workerPlan,
  type Mods,
} from './rules'
import type { Decimal } from './decimal'
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
 * The next place, if it only lacks money and costs at most an hour of this
 * run's average income: the Estate agent asks the others to save up for it.
 */
export function savingFor(state: GameState): RegionDef | null {
  if (!managerActive(state, 'estateAgent')) return null
  const next = REGIONS.find((r) => !state.regions[r.id].unlocked)
  if (!next) return null
  if (state.prestige.franchises < (next.requiresFranchises ?? 0)) return null
  if (!meets(state, { reputation: next.unlockReputation })) return null
  if (state.money.gte(next.unlockCost)) return null
  const income = state.run.time > 60 ? state.run.earned.toNumber() / state.run.time : 0
  return next.unlockCost <= income * SAVE_FOR_PLACE_SECONDS ? next : null
}

const cheapEnough = (state: GameState, cost: Decimal, share = MANAGER_SPEND_SHARE) =>
  cost.lte(state.money.mul(share))

/** Enough purchases per look-around for a long offline step to catch up. */
const GUARD = 25

function estateAgent(state: GameState): void {
  for (const r of REGIONS) if (canUnlockRegion(state, r.id)) unlockRegion(state, r.id)
}

function quartermaster(state: GameState): void {
  for (const u of [...UPGRADES].sort((a, b) => a.cost - b.cost)) {
    if (canBuyUpgrade(state, u) && state.money.mul(QUARTERMASTER_SPEND_SHARE).gte(u.cost)) buyUpgrade(state, u.id)
  }
}

/** Hire for the slowest step while it is below what customers want (+30%). */
function familyManager(state: GameState): void {
  const mods = getMods(state)
  const target = demand(state, mods) * 1.3
  for (let i = 0; i < GUARD; i++) {
    const tasks: Task[] = ['deliver', 'fry', 'bread', 'pound'] // ties: sell first
    const weakest = tasks
      .map((t) => ({ t, cap: (t === 'deliver' ? deliveryCapacity(state, mods) : taskCapacity(state, t, mods)).toNumber() }))
      .sort((a, b) => a.cap - b.cap)[0]
    if (weakest.cap >= target) return
    // The cheapest helper per unit of work for that step.
    const best = WORKERS.filter((w) => w.task === weakest.t && meets(state, w.requires))
      .map((w) => ({ w, plan: workerPlan(state, w.id, 1) }))
      .sort((a, b) => a.plan.cost.div(a.w.rate).cmp(b.plan.cost.div(b.w.rate)))[0]
    if (!best || !cheapEnough(state, best.plan.cost) || !hireWorker(state, best.w.id, 1)) return
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

/** Grow the ingredient the farm covers least of what the kitchen needs. */
function farmManager(state: GameState): void {
  if (!chapter2Unlocked(state)) return
  for (let i = 0; i < GUARD; i++) {
    const mods = getMods(state)
    const need = supplyNeeds(state, mods)
    const short = (Object.keys(need) as ItemId[])
      .filter((item): item is IngredientId => ['meat', 'flour', 'eggs', 'crumbs', 'oil'].includes(item))
      .map((item) => ({ item, cover: farmSupply(state, item, mods) / Math.max(need[item] ?? 0, 1e-9) }))
      .filter((x) => (need[x.item] ?? 0) > 0 && x.cover < 1.1)
      .sort((a, b) => a.cover - b.cover)
    let bought = false
    for (const { item } of short) {
      const f = farmBottleneck(state, item, mods)
      if (!f) continue
      const plan = facilityPlan(state, f, 1)
      if (cheapEnough(state, plan.cost) && buyFacility(state, f.id, 1)) {
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
  if (savingFor(state)) return
  if (managerActive(state, 'quartermaster')) quartermaster(state)
  if (managerActive(state, 'farmManager')) farmManager(state)
  if (managerActive(state, 'dispatcher')) dispatcher(state)
  if (managerActive(state, 'familyManager')) familyManager(state)
}
