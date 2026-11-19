// Derived values: modifiers from upgrades, costs, capacities, requirements.
// Pure functions of the state; nothing here changes it.
import { D, type Decimal } from './decimal'
import {
  BASE_COOLING,
  NIGHT_SHIFT_HOURS,
  OFFLINE_CAP_HOURS,
  CRISP_BASE_SKILL,
  CRISP_REPUTATION_SHARE,
  CRISP_TEMP_BEST,
  CRISP_TEMP_SPREAD,
  CRISP_SPEED_PER_DEGREE,
  OIL_LEVELS,
  CHAPTER2_FRANCHISES,
  CHAPTER2_PERKS,
  CHAPTER3_FRANCHISES,
  CHAPTER3_PERKS,
  CHAPTER4_PERKS,
  CHAPTER4_REGION,
  FRESHNESS_KM_PER_KMH,
  HELPER_RANGE_KM,
  VEHICLES,
  CRUMB_DIVISOR,
  FACILITIES,
  SHOP_SHELF_SECONDS,
  SHOP_SUPPLY_RATE,
  STAGE_IDS,
  STAGES,
  NEXT_TASK,
  REGIONS,
  PERKS,
  MIN_ORDER_BACKLOG,
  ORDER_BACKLOG_SECONDS,
  SHOP,
  UPGRADES,
  WORKERS,
  type Effect,
  type FacilityDef,
  type FacilityGroup,
  type ItemId,
  type IngredientId,
  type PerkDef,
  type PerkId,
  type RegionDef,
  type Requirement,
  type StageId,
  type Task,
  type UpgradeDef,
  type VehicleDef,
  type WorkerDef,
  type WorkerId,
} from './content'
import type { BuyAmount, GameState } from './state'
import { BADGE_BONUS } from './badgeBonus'

export interface Mods {
  speed: Record<Task, number>
  /** Extra multiplier on manual clicks only. */
  click: number
  cooling: number
  packSize: number
  price: number
  orders: number
  reputation: number
  autoBuy: boolean
  /** Farm building speed per group (Chapter 2). */
  facility: Record<FacilityGroup, number>
  /** Fleet vehicle capacity (Chapter 3). */
  fleet: number
  /** Crispness skill from technique (added up; see crispness()). */
  crisp: number
  /** Corner shop supply (bigger van, wholesale card). */
  shopSupply: number
}

function applyEffect(mods: Mods, e: Effect): void {
  switch (e.kind) {
    case 'speed':
      mods.speed[e.task] *= e.mult
      break
    case 'kitchen':
      mods.speed.pound *= e.mult
      mods.speed.bread *= e.mult
      mods.speed.fry *= e.mult
      break
    case 'click':
      mods.click *= e.mult
      break
    case 'cooling':
      mods.cooling *= e.mult
      break
    case 'packSize':
      mods.packSize *= e.mult
      break
    case 'price':
      mods.price *= e.mult
      break
    case 'orders':
      mods.orders *= e.mult
      break
    case 'reputation':
      mods.reputation *= e.mult
      break
    case 'autoBuy':
      mods.autoBuy = true
      break
    case 'facility':
      mods.facility[e.group] *= e.mult
      break
    case 'fleet':
      mods.fleet *= e.mult
      break
    case 'crisp':
      mods.crisp += e.add
      break
    case 'shopSupply':
      mods.shopSupply *= e.mult
      break
  }
}

function identityMods(): Mods {
  return {
    speed: { pound: 1, bread: 1, fry: 1, deliver: 1 },
    click: 1,
    cooling: 1,
    packSize: 1,
    price: 1,
    orders: 1,
    reputation: 1,
    autoBuy: false,
    facility: { field: 1, animal: 1, processor: 1 },
    fleet: 1,
    crisp: 0,
    shopSupply: 1,
  }
}

/** Something that changes the numbers: an upgrade, a perk, your badges… */
export interface ModSource {
  name: string
  emoji: string
  effects: Effect[]
}

/** Every source of modifiers the player has right now. */
export function modSources(state: GameState): ModSource[] {
  const out: ModSource[] = []
  for (const u of UPGRADES) if (state.upgrades[u.id]) out.push(u)
  for (const p of PERKS) {
    const level = perkLevel(state, p.id)
    if (level > 0 && p.effects) out.push({ name: p.name, emoji: p.emoji, effects: p.effects(level) })
  }
  const bonus = badgeBonus(state)
  if (bonus > 0) out.push({ name: 'Badges', emoji: '🏅', effects: [{ kind: 'price', mult: 1 + bonus }] })
  if (state.crisp.unlocked) {
    // Crispness multiplies price and reputation; the skill comes from the sources above.
    let skill = 0
    for (const src of out) for (const e of src.effects) if (e.kind === 'crisp') skill += e.add
    const q = crispness(state, skill)
    if (q > 0) {
      out.push({
        name: 'Crispness',
        emoji: '✨',
        effects: [
          { kind: 'price', mult: 1 + q },
          { kind: 'reputation', mult: 1 + q * CRISP_REPUTATION_SHARE },
        ],
      })
    }
    const speed = fryerSpeed(state)
    if (speed !== 1) {
      out.push({
        name: `Fryer at ${state.crisp.temperature} °C`,
        emoji: '🌡️',
        effects: [{ kind: 'speed', task: 'fry', mult: speed }],
      })
    }
  }
  return out
}

// ---------------------------------------------------------------- crispness

/** 1 at the sweet spot, falling to 0 at ±CRISP_TEMP_SPREAD degrees. */
export function temperatureQuality(temperature: number): number {
  const off = (temperature - CRISP_TEMP_BEST) / CRISP_TEMP_SPREAD
  return Math.max(0, 1 - off * off)
}

/** Hotter oil fries faster. */
export function fryerSpeed(state: GameState): number {
  if (!state.crisp.unlocked) return 1
  return 1 + (state.crisp.temperature - CRISP_TEMP_BEST) * CRISP_SPEED_PER_DEGREE
}

export function oilLevel(state: GameState): (typeof OIL_LEVELS)[number] {
  return OIL_LEVELS[state.crisp.unlocked ? state.crisp.oil : 0] ?? OIL_LEVELS[0]
}

/** Total skill: Grandma's tips plus technique (upgrades and perks). */
export function crispSkill(state: GameState, techniqueSkill: number): number {
  return state.crisp.unlocked ? CRISP_BASE_SKILL + techniqueSkill : 0
}

/**
 * Crispness: skill × how close the fryer is to the sweet spot × how fresh the
 * oil is. Prices and reputation are × (1 + crispness).
 */
export function crispness(state: GameState, techniqueSkill = getMods(state).crisp): number {
  return crispSkill(state, techniqueSkill) * temperatureQuality(state.crisp.temperature) * oilLevel(state).quality
}

/** A kitchen step's ingredients, with fresh oil changes counted in. */
export function stageInputs(state: GameState, stage: StageId): Partial<Record<ItemId, number>> {
  const inputs = STAGES[stage].inputs
  if (stage !== 'fry' || !state.crisp.unlocked) return inputs
  const oil = oilLevel(state).oil
  return oil === 1 ? inputs : { ...inputs, oil: (inputs.oil ?? 0) * oil }
}

/**
 * What can change the modifiers. Upgrades, perk levels and badges only grow
 * within a run, and a franchise changes the count, so counts are enough.
 */
function modsKey(state: GameState): string {
  let upgrades = 0
  for (const _ in state.upgrades) upgrades++
  let perks = 0
  for (const level of Object.values(state.prestige.perks)) perks += level ?? 0
  let badges = 0
  for (const _ in state.badges) badges++
  const c = state.crisp
  return `${upgrades}|${perks}|${badges}|${state.prestige.franchises}|${c.unlocked ? 1 : 0}|${c.temperature}|${c.oil}`
}

const modsCache = new WeakMap<GameState, { key: string; mods: Mods }>()

/**
 * All modifiers, from every upgrade, perk, badge and crispness. Called a lot
 * (dozens of times per tick), so it is cached until something above changes.
 * The result is frozen: never change it.
 */
export function getMods(state: GameState): Mods {
  const key = modsKey(state)
  const hit = modsCache.get(state)
  if (hit && hit.key === key) return hit.mods
  const mods = identityMods()
  for (const src of modSources(state)) src.effects.forEach((e) => applyEffect(mods, e))
  Object.freeze(mods.speed)
  Object.freeze(mods.facility)
  Object.freeze(mods)
  modsCache.set(state, { key, mods })
  return mods
}

/** The numbers a "Why?" breakdown can explain. */
export type ModKey = Exclude<keyof Mods, 'speed' | 'facility' | 'autoBuy'> | Task | FacilityGroup

function readMod(m: Mods, key: ModKey): number {
  if (key in m.speed) return m.speed[key as Task]
  if (key in m.facility) return m.facility[key as FacilityGroup]
  return m[key as Exclude<ModKey, Task | FacilityGroup>]
}

export interface Factor {
  name: string
  emoji: string
  mult: number
}

/** What multiplies one number, source by source (the "Why?" popover). */
export function explainMod(state: GameState, key: ModKey): Factor[] {
  const out: Factor[] = []
  for (const src of modSources(state)) {
    const m = identityMods()
    src.effects.forEach((e) => applyEffect(m, e))
    const mult = readMod(m, key)
    if (Math.abs(mult - 1) > 1e-9) out.push({ name: src.name, emoji: src.emoji, mult })
  }
  return out
}

/** How long offline progress runs, in seconds (Night shift adds to it). */
export function offlineCap(state: GameState): number {
  return (OFFLINE_CAP_HOURS + NIGHT_SHIFT_HOURS * perkLevel(state, 'nightShift')) * 3600
}

// ---------------------------------------------------------------- badges

/** Income bonus from badges that take real effort (see BADGE_BONUS). */
export function badgeBonus(state: GameState): number {
  let total = 0
  for (const [id, bonus] of Object.entries(BADGE_BONUS)) if (state.badges[id] !== undefined) total += bonus
  return total
}

// ---------------------------------------------------------------- franchise

export function perkLevel(state: GameState, id: PerkId): number {
  return state.prestige.perks[id] ?? 0
}

export function perkCost(state: GameState, perk: PerkDef): Decimal {
  return D(perk.baseCost).mul(D(perk.costGrowth).pow(perkLevel(state, perk.id))).floor()
}

export function perkMaxed(state: GameState, perk: PerkDef): boolean {
  return perk.maxLevel !== undefined && perkLevel(state, perk.id) >= perk.maxLevel
}

/** Chapter 2 and 3 perks stay hidden until their chapter is unlocked. */
export function perkVisible(state: GameState, perk: PerkDef): boolean {
  if (CHAPTER2_PERKS.includes(perk.id)) return chapter2Unlocked(state)
  if (CHAPTER3_PERKS.includes(perk.id)) return chapter3Unlocked(state)
  if (CHAPTER4_PERKS.includes(perk.id)) return chapter4Unlocked(state)
  if (perk.id === 'crispMaster') return state.crisp.unlocked
  return true
}

export function canBuyPerk(state: GameState, perk: PerkDef): boolean {
  return perkVisible(state, perk) && !perkMaxed(state, perk) && state.prestige.crumbs.gte(perkCost(state, perk))
}

/** Golden Crumbs a Franchise would give right now. */
/** Golden Crumbs your lifetime earnings are worth in total (collected or not). */
export function crumbsWorth(state: GameState): Decimal {
  return state.stats.earned.div(CRUMB_DIVISOR).sqrt().floor()
}

/**
 * Golden Crumbs a Franchise would give right now: what lifetime earnings are
 * worth minus what was already collected. Resetting early gives nothing extra.
 */
export function pendingCrumbs(state: GameState): Decimal {
  const pending = crumbsWorth(state).sub(state.prestige.totalCrumbs)
  return pending.lt(0) ? D(0) : pending
}

/** Money this run needs to have earned for the next Golden Crumb. */
/** Lifetime earnings needed for the next Golden Crumb. */
export function nextCrumbAt(state: GameState): Decimal {
  return crumbsWorth(state).add(1).pow(2).mul(CRUMB_DIVISOR)
}

/** Progress (0..1) from the last Golden Crumb to the next, and the money still needed. */
export function crumbProgress(state: GameState): { fraction: number; remaining: Decimal } {
  const worth = crumbsWorth(state)
  const from = worth.pow(2).mul(CRUMB_DIVISOR)
  const to = nextCrumbAt(state)
  const fraction = state.stats.earned.sub(from).div(to.sub(from)).toNumber()
  return { fraction: Math.min(1, Math.max(0, fraction)), remaining: to.sub(state.stats.earned).max(0) }
}

export function canFranchise(state: GameState): boolean {
  return state.prestige.unlocked && pendingCrumbs(state).gte(1)
}

export function meets(state: GameState, req: Requirement | undefined): boolean {
  if (!req) return true
  if (req.reputation !== undefined && state.reputation.lt(req.reputation)) return false
  if (req.franchises !== undefined && state.prestige.franchises < req.franchises) return false
  return true
}

/** Show things a bit before they are affordable, so players have goals. */
export function isTeased(state: GameState, req: Requirement | undefined): boolean {
  if (req?.franchises !== undefined && state.prestige.franchises < req.franchises) return false
  if (!req?.reputation) return true
  return state.reputation.gte(req.reputation * 0.5)
}

// ---------------------------------------------------------------- chapter 2: the farm

// ---------------------------------------------------------------- chapter 3: on the road

export function chapter3Unlocked(state: GameState): boolean {
  return state.prestige.franchises >= CHAPTER3_FRANCHISES
}

/** Chapter 4 (the stars): once you have reached the whole planet, for good. */
export function chapter4Unlocked(state: GameState): boolean {
  return !!state.milestones[CHAPTER4_REGION] || state.regions[CHAPTER4_REGION].unlocked
}

/** Space vehicles only show up in Chapter 4. */
export function vehicleVisible(state: GameState, def: VehicleDef): boolean {
  return def.space ? chapter4Unlocked(state) : chapter3Unlocked(state)
}

/** Helpers (and you) carry schnitzel only to nearby places on Earth. */
export function helperReaches(region: RegionDef): boolean {
  return !region.space && region.distance <= HELPER_RANGE_KM
}

/** Earth vehicles serve Earth, space vehicles serve space. */
export function vehicleServes(def: VehicleDef, region: RegionDef): boolean {
  return !!def.space === !!region.space && def.range >= region.distance
}

export function vehicleCost(state: GameState, def: VehicleDef): Decimal {
  return D(def.baseCost).mul(D(def.costGrowth).pow(state.vehicles[def.id]))
}

export function canBuyVehicle(state: GameState, def: VehicleDef): boolean {
  return vehicleVisible(state, def) && state.money.gte(vehicleCost(state, def))
}

/** Schnitzels per second all vehicles of this kind deliver. */
export function vehicleCapacity(state: GameState, def: VehicleDef, mods: Mods): Decimal {
  return D(def.capacity).mul(state.vehicles[def.id]).mul(mods.fleet)
}

/** Total delivery per second: helpers plus the whole fleet. */
export function deliveryCapacity(state: GameState, mods: Mods): Decimal {
  let total = taskCapacity(state, 'deliver', mods)
  for (const v of VEHICLES) total = total.add(vehicleCapacity(state, v, mods))
  return total
}

/** Can anything you own reach this place? */
export function canReach(state: GameState, region: RegionDef): boolean {
  if (helperReaches(region)) return true
  return VEHICLES.some((v) => state.vehicles[v.id] > 0 && vehicleServes(v, region))
}

/** Share of hot schnitzel that is still hot after this vehicle's trip. */
export function freshness(def: VehicleDef, region: RegionDef, mods: Mods): number {
  return Math.exp((-region.distance / (def.freshKm ?? def.speed * FRESHNESS_KM_PER_KMH)) * mods.cooling)
}

export function chapter2Unlocked(state: GameState): boolean {
  return state.prestige.franchises >= CHAPTER2_FRANCHISES
}

export function facilityCost(state: GameState, def: FacilityDef): Decimal {
  return D(def.baseCost).mul(D(def.costGrowth).pow(state.facilities[def.id]))
}

export function canBuyFacility(state: GameState, def: FacilityDef): boolean {
  return chapter2Unlocked(state) && state.money.gte(facilityCost(state, def))
}

/** Cycles per second all buildings of this kind can run, ignoring shortages. */
export function facilityCapacity(state: GameState, def: FacilityDef, mods: Mods): Decimal {
  return D(def.rate).mul(state.facilities[def.id]).mul(mods.facility[def.group])
}

/** What the corner shop can sell per second of each ingredient. */
export const shopSupplyRate = (mods: Mods): number => SHOP_SUPPLY_RATE * mods.shopSupply

/** The most the shop keeps on its shelves (SHOP_SHELF_SECONDS of supply). */
export const shelfMax = (mods: Mods): Decimal => D(shopSupplyRate(mods) * SHOP_SHELF_SECONDS)

/**
 * What the business really needs per second of each item: the kitchen runs
 * only as fast as its slowest step (and delivery), and each farm processor
 * only makes what is needed downstream. Used for the farm's supply overview.
 */
export function supplyNeeds(state: GameState, mods: Mods): Partial<Record<ItemId, number>> {
  const throughput = Math.min(
    ...STAGE_IDS.map((t) => taskCapacity(state, t, mods).toNumber()),
    deliveryCapacity(state, mods).toNumber(),
  )
  const need: Partial<Record<ItemId, number>> = {}
  const add = (item: ItemId, amount: number) => (need[item] = (need[item] ?? 0) + amount)
  for (const stage of STAGE_IDS) {
    for (const [item, qty] of Object.entries(stageInputs(state, stage)) as [ItemId, number][]) add(item, throughput * qty)
  }
  // Processors last-to-first, so the bakery's flour is counted before the mill.
  for (const f of [...FACILITIES].reverse()) {
    if (state.facilities[f.id] <= 0 || !Object.keys(f.inputs).length) continue
    const cycles = Math.min(facilityCapacity(state, f, mods).toNumber(), (need[f.output] ?? 0) / f.yield)
    for (const [item, qty] of Object.entries(f.inputs) as [ItemId, number][]) add(item, cycles * qty)
  }
  return need
}

/**
 * Units per second the farm can make of an item at full speed, following the
 * chain upstream (a butcher is only as fast as the pig farms feeding it).
 * Shared inputs are counted in full for each use, so this is an upper bound.
 */
export function farmSupply(state: GameState, item: ItemId, mods: Mods): number {
  let total = 0
  for (const f of FACILITIES) {
    if (f.output !== item || state.facilities[f.id] <= 0) continue
    let cycles = facilityCapacity(state, f, mods).toNumber()
    for (const [input, qty] of Object.entries(f.inputs) as [ItemId, number][]) {
      cycles = Math.min(cycles, farmSupply(state, input, mods) / qty)
    }
    total += cycles * f.yield
  }
  return total
}

/**
 * How much of each item the kitchen and farm can consume in `dt` seconds at
 * full speed. Used so producers and Auntie keep up during long ticks.
 */
export function consumption(state: GameState, mods: Mods, dt: number): Partial<Record<ItemId, Decimal>> {
  const use: Partial<Record<ItemId, Decimal>> = {}
  const add = (inputs: Partial<Record<ItemId, number>>, cycles: Decimal) => {
    for (const [item, qty] of Object.entries(inputs) as [ItemId, number][]) {
      use[item] = (use[item] ?? D(0)).add(cycles.mul(qty))
    }
  }
  for (const stage of STAGE_IDS) add(stageInputs(state, stage), taskCapacity(state, stage, mods).mul(dt))
  for (const f of FACILITIES) add(f.inputs, facilityCapacity(state, f, mods).mul(dt))
  return use
}

// ---------------------------------------------------------------- buying in bulk

export interface BulkPlan {
  /** How many this click buys (at least 1, so the button can show a price). */
  count: number
  cost: Decimal
  affordable: boolean
}

const MAX_BULK = 1_000_000

/**
 * Buying more of something priced base × growth^owned: ×1, ×10, or as many
 * as the money covers (a geometric series, so this is exact and instant).
 */
export function bulkBuy(base: number, growth: number, owned: number, money: Decimal, amount: BuyAmount): BulkPlan {
  const first = D(base).mul(D(growth).pow(owned))
  const costOf = (k: number) =>
    growth === 1 ? first.mul(k) : first.mul(D(growth).pow(k).sub(1)).div(growth - 1)
  let count: number
  if (amount !== 'max') count = amount
  else {
    let k =
      growth === 1
        ? money.div(first).floor().toNumber()
        : Math.floor(money.mul(growth - 1).div(first).add(1).log10().toNumber() / Math.log10(growth))
    k = Math.min(MAX_BULK, Math.max(0, Number.isFinite(k) ? k : 0))
    // Floating point can be off by one either way.
    while (k > 0 && costOf(k).gt(money)) k--
    while (k < MAX_BULK && costOf(k + 1).lte(money)) k++
    count = Math.max(1, k)
  }
  const cost = costOf(count)
  return { count, cost, affordable: money.gte(cost) }
}

export function workerPlan(state: GameState, id: WorkerId, amount: BuyAmount = state.settings.buyAmount): BulkPlan {
  const def = WORKERS.find((w) => w.id === id)!
  return bulkBuy(def.baseCost, def.costGrowth, state.workers[id], state.money, amount)
}

export function facilityPlan(state: GameState, def: FacilityDef, amount: BuyAmount = state.settings.buyAmount): BulkPlan {
  return bulkBuy(def.baseCost, def.costGrowth, state.facilities[def.id], state.money, amount)
}

export function vehiclePlan(state: GameState, def: VehicleDef, amount: BuyAmount = state.settings.buyAmount): BulkPlan {
  return bulkBuy(def.baseCost, def.costGrowth, state.vehicles[def.id], state.money, amount)
}

export function workerCost(state: GameState, id: WorkerId): Decimal {
  const def = WORKERS.find((w) => w.id === id)!
  return D(def.baseCost).mul(D(def.costGrowth).pow(state.workers[id]))
}

export function canHire(state: GameState, def: WorkerDef): boolean {
  return meets(state, def.requires) && state.money.gte(workerCost(state, def.id))
}

/** Crispness upgrades stay hidden until crispness is unlocked. */
export function upgradeVisible(state: GameState, def: UpgradeDef): boolean {
  return (!def.quality || state.crisp.unlocked) && (!def.space || chapter4Unlocked(state)) && isTeased(state, def.requires)
}

export function canBuyUpgrade(state: GameState, def: UpgradeDef): boolean {
  return (
    !state.upgrades[def.id] &&
    (!def.quality || state.crisp.unlocked) &&
    (!def.space || chapter4Unlocked(state)) &&
    meets(state, def.requires) &&
    state.money.gte(def.cost)
  )
}

/** Units per second the staff can do for a task, ignoring input shortages. */
export function taskCapacity(state: GameState, task: Task, mods = getMods(state)): Decimal {
  let total = D(0)
  for (const w of WORKERS) {
    if (w.task !== task) continue
    total = total.add(D(w.rate).mul(state.workers[w.id]))
  }
  return total.mul(mods.speed[task])
}

/** How much one click on a task processes. */
export function clickAmount(task: Task, mods: Mods): Decimal {
  return D(mods.speed[task]).mul(mods.click)
}

export function packSize(item: IngredientId, mods: Mods): Decimal {
  return D(SHOP[item].packSize).mul(mods.packSize)
}

export function orderRate(region: RegionDef, mods: Mods): Decimal {
  return D(region.orderRate).mul(mods.orders)
}

export function orderCap(region: RegionDef, mods: Mods): Decimal {
  const cap = orderRate(region, mods).mul(ORDER_BACKLOG_SECONDS)
  return cap.lt(MIN_ORDER_BACKLOG) ? D(MIN_ORDER_BACKLOG) : cap
}

export function regionPrice(region: RegionDef, mods: Mods): Decimal {
  return D(region.price).mul(mods.price)
}

export function coolingRate(mods: Mods): number {
  return BASE_COOLING * mods.cooling
}

/**
 * Cook to order: how many units of a stage's output staff may have waiting.
 * The buffer, plus what the next step can consume this tick, so long ticks
 * (background tabs, offline progress) are not throttled by the buffer.
 */
export function stageLimit(state: GameState, stage: StageId, mods: Mods, dt: number): Decimal {
  const next = NEXT_TASK[stage]
  const nextCapacity = next === 'deliver' ? deliveryCapacity(state, mods) : taskCapacity(state, next, mods)
  return D(state.buffers[stage]).add(nextCapacity.mul(dt))
}

/** Ingredients still needed to finish one more schnitzel, given what is already half-made. */
export function ingredientsForNextSchnitzel(state: GameState): IngredientId[] {
  const need: IngredientId[] = ['oil']
  if (state.items.breaded.lt(1)) {
    need.push('flour', 'eggs', 'crumbs')
    if (state.items.cutlet.lt(1)) need.push('meat')
  }
  return need
}

/** Nothing to sell, can't cook, can't afford the missing ingredients: a soft-lock. */
export function isStuck(state: GameState): boolean {
  if (state.items.hot.add(state.items.cold).gte(1)) return false
  let cost = 0
  for (const item of ingredientsForNextSchnitzel(state)) {
    if (state.items[item].lt(1)) cost += SHOP[item].packPrice
  }
  return cost > 0 && state.money.lt(cost)
}

// ---------------------------------------------------------------- goals

/** The next place to expand to, and whether franchises still lock it. */
export function nextRegion(state: GameState): { region: RegionDef; locked: boolean } | null {
  const region = REGIONS.find((r) => !state.regions[r.id].unlocked)
  if (!region) return null
  return { region, locked: state.prestige.franchises < (region.requiresFranchises ?? 0) }
}
