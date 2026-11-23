// Derived values: modifiers from upgrades, costs, capacities, requirements.
// Pure functions of the state; nothing here changes it.
import { D, Decimal } from './decimal'
import { BASE_COOLING, BUFFER_SECONDS, CHAPTER2_FRANCHISES, CHAPTER2_PERKS, CHAPTER3_FRANCHISES, CHAPTER3_PERKS, CHAPTER4_PERKS, CHAPTER4_REGION, CHAPTER5_PERKS, CHAPTER5_REGION, CRISP_BASE_SKILL, CRISP_REPUTATION_SHARE, CRISP_SPEED_PER_DEGREE, CRISP_TEMP_BEST, CRISP_TEMP_SPREAD, CRUMB_DIVISOR, type Effect, FACILITIES, FACILITY_BY_ID, type FacilityDef, type FacilityGroup, type FacilityId, FARM_GOAL_MULT, FARM_GOALS, FRANCHISE_UNLOCK_REGION, FRESHNESS_KM_PER_KMH, FRONTIER_CRUMB_SHARE, HELPER_RANGE_KM, type IngredientId, type ItemId, MIN_BUFFERS, MIN_ORDER_BACKLOG, NEXT_TASK, NIGHT_SHIFT_HOURS, OFFLINE_CAP_HOURS, OIL_LEVELS, ORDER_BACKLOG_SECONDS, PERK_BY_ID, PERK_SOFT_GROWTH, PERK_SOFT_LEVEL, type PerkDef, type PerkId, PERKS, REGION_INDEX, type RegionDef, REGIONS, type Requirement, SHOP, SHOP_SHELF_SECONDS, SHOP_SUPPLY_RATE, STAGE_IDS, type StageId, STAGES, type Task, type UpgradeDef, UPGRADES, type VehicleDef, VEHICLES, WORKER_BY_ID, type WorkerDef, type WorkerId, WORKERS, CHAPTERS, REGION_BY_ID, type RegionId, CRUMB_PRIDE_PER_DECADE, INGREDIENT_IDS } from './content'
import { BEST_SALE_EARLY, BEST_SALE_MIN_SHARE, CRUMB_RATE_DROP, CRUMB_RATE_FROM, type BuyAmount, type GameState } from './state'
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
  /** One kind of farm building (farm gear), on top of its group. */
  building: Record<FacilityId, number>
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
    case 'building':
      mods.building[e.facility] *= e.mult
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
    building: { wheatField: 1, mill: 1, bakery: 1, sunflowers: 1, oilPress: 1, coop: 1, pigFarm: 1, butcher: 1 },
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
  const pride = familyPride(state)
  if (pride > 1) out.push({ name: 'Family pride (crumbs collected)', emoji: '✨', effects: [{ kind: 'price', mult: pride }] })
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

/** Income multiplier from all the Golden Crumbs ever collected (see CRUMB_PRIDE_PER_DECADE). */
export function familyPride(state: GameState): number {
  return 1 + CRUMB_PRIDE_PER_DECADE * state.prestige.totalCrumbs.max(0).add(1).log10().toNumber()
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
  // Ids as well as levels: swapping a choice keeps the total the same.
  let perks = ''
  for (const [id, level] of Object.entries(state.prestige.perks)) if (level) perks += `${id}${level},`
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
  Object.freeze(mods.building)
  Object.freeze(mods)
  modsCache.set(state, { key, mods })
  return mods
}

/** The numbers a "Why?" breakdown can explain. */
export type ModKey = Exclude<keyof Mods, 'speed' | 'facility' | 'building' | 'autoBuy'> | Task | FacilityGroup | FacilityId

function readMod(m: Mods, key: ModKey): number {
  if (key in m.speed) return m.speed[key as Task]
  if (key in m.facility) return m.facility[key as FacilityGroup]
  if (key in m.building) {
    const f = FACILITY_BY_ID[key as FacilityId]
    return m.facility[f.group] * m.building[f.id]
  }
  return m[key as Exclude<ModKey, Task | FacilityGroup | FacilityId>]
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
  const level = perkLevel(state, perk.id)
  const cost = D(perk.baseCost).mul(D(perk.costGrowth).pow(level))
  // Endless perks: past the soft level each step costs PERK_SOFT_GROWTH× more on top.
  const over = perk.chapterCaps ? Math.max(0, level - PERK_SOFT_LEVEL) : 0
  return (over > 0 ? cost.mul(D(PERK_SOFT_GROWTH).pow(over)) : cost).floor()
}

/** The highest level this perk can reach now: its own cap, or the chapter's cap for endless perks. */
export function perkMaxLevel(state: GameState, perk: PerkDef): number {
  if (perk.chapterCaps) return perk.chapterCaps[chapterNumber(state) - 1] ?? Infinity
  return perk.maxLevel ?? Infinity
}

export function perkMaxed(state: GameState, perk: PerkDef): boolean {
  return perkLevel(state, perk.id) >= perkMaxLevel(state, perk)
}

/** Prerequisites still missing (perk and level needed). Empty when it can be bought. */
export function perkMissing(state: GameState, perk: PerkDef): { perk: PerkDef; level: number }[] {
  return (perk.requires ?? [])
    .filter((r) => perkLevel(state, r.perk) < r.level)
    .map((r) => ({ perk: PERK_BY_ID[r.perk], level: r.level }))
}

/** The other side of a pick-one choice. */
export function forkPartner(perk: PerkDef): PerkDef | undefined {
  return perk.fork ? PERKS.find((p) => p.fork === perk.fork && p.id !== perk.id) : undefined
}

/** You own the other side of this choice. */
export function forkTaken(state: GameState, perk: PerkDef): boolean {
  const other = forkPartner(perk)
  return !!other && perkLevel(state, other.id) > 0
}

/** Can the player switch this choice to its other side now (once per run per choice)? */
export function canSwapFork(state: GameState, perk: PerkDef): boolean {
  const other = forkPartner(perk)
  return !!perk.fork && !!other && perkLevel(state, perk.id) === 0 && perkLevel(state, other.id) > 0 && !state.run.forkSwaps?.[perk.fork]
}

/** The part of the game a perk waits for: a later chapter, crispness, or nothing (open from the start). */
export function perkOpensWith(perk: PerkDef): 2 | 3 | 4 | 5 | 'crisp' | null {
  if (CHAPTER2_PERKS.includes(perk.id)) return 2
  if (CHAPTER3_PERKS.includes(perk.id)) return 3
  if (CHAPTER4_PERKS.includes(perk.id)) return 4
  if (CHAPTER5_PERKS.includes(perk.id)) return 5
  if (perk.id === 'crispMaster') return 'crisp'
  return null
}

/** Perks of a later chapter (2 to 5) and Crisp Master stay hidden until that part of the game opens. */
export function perkVisible(state: GameState, perk: PerkDef): boolean {
  switch (perkOpensWith(perk)) {
    case 2:
      return chapter2Unlocked(state)
    case 3:
      return chapter3Unlocked(state)
    case 4:
      return chapter4Unlocked(state)
    case 5:
      return chapter5Unlocked(state)
    case 'crisp':
      return state.crisp.unlocked
    default:
      return true
  }
}

export function canBuyPerk(state: GameState, perk: PerkDef): boolean {
  return (
    perkVisible(state, perk) &&
    !perkMaxed(state, perk) &&
    !forkTaken(state, perk) &&
    perkMissing(state, perk).length === 0 &&
    state.prestige.crumbs.gte(perkCost(state, perk))
  )
}

/**
 * Golden Crumbs per hour this run (0 early in a run): what earnings are worth
 * so far, unrounded, ÷ the hours so far. Unrounded so the rate doesn't saw up
 * and down with each whole crumb; frontier sales don't count (they jump).
 */
export function crumbRate(state: GameState): number {
  if (state.run.time < CRUMB_RATE_FROM) return 0
  const worth = earningsToCrumbs(state.stats.earned).sub(collectedFromEarnings(state))
  return Math.max(0, worth.toNumber()) / (state.run.time / 3600)
}

/**
 * How fast this run grows your lifetime Golden Crumbs, per hour (0.12 = 12%
 * an hour, compounded): ln(1 + sale ÷ lifetime) ÷ hours, with the sale
 * unrounded. What Mum's best moment maximises: early on a quick sale that
 * doubles a small pile beats a long one, late on long runs win.
 */
export function crumbGrowth(state: GameState): number {
  const rate = crumbRate(state)
  if (rate <= 0) return 0
  const hours = state.run.time / 3600
  const lifetime = Math.max(1, state.prestige.totalCrumbs.toNumber())
  return Math.log1p((rate * hours) / lifetime) / hours
}

/** Golden Crumbs some lifetime earnings are worth, unrounded: √(earnings ÷ CRUMB_DIVISOR). */
const earningsToCrumbs = (earned: Decimal): Decimal => earned.div(CRUMB_DIVISOR).sqrt()
/** The lifetime earnings worth this many Golden Crumbs (the inverse). */
const crumbsToEarnings = (crumbs: Decimal): Decimal => crumbs.pow(2).mul(CRUMB_DIVISOR)
/** Crumbs collected from earnings so far: frontier bonuses don't count against what earnings are worth. */
const collectedFromEarnings = (state: GameState): Decimal => state.prestige.totalCrumbs.sub(state.prestige.bonusCrumbs)

/** Golden Crumbs your lifetime earnings are worth in total (collected or not). */
export function crumbsWorth(state: GameState): Decimal {
  return earningsToCrumbs(state.stats.earned).floor()
}

/**
 * Golden Crumbs earnings alone would give right now: what lifetime earnings
 * are worth minus what they already gave. Resetting early gives nothing extra.
 */
export function earningsCrumbs(state: GameState): Decimal {
  const pending = crumbsWorth(state).sub(collectedFromEarnings(state))
  return pending.lt(0) ? D(0) : pending
}

/** Index (in REGIONS) of the furthest place unlocked in this run. */
export function furthestPlace(state: GameState): number {
  let best = 0
  REGIONS.forEach((r, i) => {
    if (state.regions[r.id].unlocked) best = i
  })
  return best
}

/** In this run you've reached your furthest place ever (or beyond), and at least the whole town. */
export function atFrontier(state: GameState): boolean {
  const here = furthestPlace(state)
  const town = REGION_INDEX[FRANCHISE_UNLOCK_REGION]
  return here >= town && here >= state.stats.bestPlace
}

/** What a frontier sale pays at least: a share of lifetime crumbs, never less than 1. */
export function frontierCrumbs(state: GameState): Decimal {
  if (!atFrontier(state)) return D(0)
  return Decimal.max(1, state.prestige.totalCrumbs.mul(FRONTIER_CRUMB_SHARE).floor())
}

/**
 * Golden Crumbs a Franchise would give right now: what lifetime earnings are
 * worth minus what was already collected, or the frontier minimum if that's more.
 */
export function pendingCrumbs(state: GameState): Decimal {
  return Decimal.max(earningsCrumbs(state), frontierCrumbs(state))
}

/** Lifetime earnings needed for the next Golden Crumb. */
export function nextCrumbAt(state: GameState): Decimal {
  return crumbsToEarnings(crumbsWorth(state).add(1))
}

/** Progress (0..1) from the last Golden Crumb to the next, and the money still needed. */
export function crumbProgress(state: GameState): { fraction: number; remaining: Decimal } {
  const from = crumbsToEarnings(crumbsWorth(state))
  const to = nextCrumbAt(state)
  const fraction = state.stats.earned.sub(from).div(to.sub(from)).toNumber()
  return { fraction: Math.min(1, Math.max(0, fraction)), remaining: to.sub(state.stats.earned).max(0) }
}

/**
 * Mum's “best moment”: the sale triples your lifetime crumbs (BEST_SALE_EARLY), or how fast this run grows your lifetime crumbs has
 * peaked and dropped a little (crumbGrowth), and the sale adds at least BEST_SALE_MIN_SHARE of lifetime crumbs.
 */
export function bestMomentToSell(state: GameState): boolean {
  const pending = pendingCrumbs(state)
  const lifetime = Decimal.max(1, state.prestige.totalCrumbs)
  // Early on, a sale that triples a small pile is always worth it.
  if (pending.gte(lifetime.mul(BEST_SALE_EARLY))) return true
  const peak = state.run.growthPeak
  if (!(peak > 0) || crumbGrowth(state) >= peak * CRUMB_RATE_DROP) return false
  return pending.gte(lifetime.mul(BEST_SALE_MIN_SHARE))
}

export function canFranchise(state: GameState): boolean {
  return state.prestige.unlocked && pendingCrumbs(state).gte(1)
}

/** Why you can't sell yet, and how to get there (null when you can). */
export function franchiseBlocker(state: GameState): string | null {
  if (canFranchise(state)) return null
  if (!state.prestige.unlocked) return 'Franchising unlocks the first time you reach the whole town.'
  const best = REGIONS[state.stats.bestPlace]
  return `Two ways to sell: earn enough for the next Golden Crumb, or reach your furthest place again (${best.emoji} ${best.name.toLowerCase()}) for at least ${FRONTIER_CRUMB_SHARE * 100}% of your lifetime crumbs.`
}

export function meets(state: GameState, req: Requirement | undefined): boolean {
  if (!req) return true
  if (req.reputation !== undefined && state.reputation.lt(req.reputation)) return false
  if (req.franchises !== undefined && state.prestige.franchises < req.franchises) return false
  if (req.place !== undefined && !state.regions[req.place].unlocked) return false
  return true
}

/** Show things a bit before they are affordable, so players have goals. */
export function isTeased(state: GameState, req: Requirement | undefined): boolean {
  if (req?.franchises !== undefined && state.prestige.franchises < req.franchises) return false
  if (req?.place !== undefined && !state.regions[req.place].unlocked) return false
  if (!req?.reputation) return true
  return state.reputation.gte(req.reputation * 0.5)
}

// ---------------------------------------------------------------- chapters 2 and 3: the farm and the road

export function chapter3Unlocked(state: GameState): boolean {
  return state.prestige.franchises >= CHAPTER3_FRANCHISES
}

/** Chapter 4 (the stars): once you have reached the whole planet, for good. */
export function chapter4Unlocked(state: GameState): boolean {
  return !!state.milestones[CHAPTER4_REGION] || state.regions[CHAPTER4_REGION].unlocked
}

/** Chapter 5 (the Schnitzelverse): once you have reached the whole Solar System, for good. */
export function chapter5Unlocked(state: GameState): boolean {
  return !!state.milestones[CHAPTER5_REGION] || state.regions[CHAPTER5_REGION].unlocked
}

/** The chapter you're in: 1 (the garage) to 5 (the Schnitzelverse). */
export function chapterNumber(state: GameState): 1 | 2 | 3 | 4 | 5 {
  return chapter5Unlocked(state) ? 5 : chapter4Unlocked(state) ? 4 : chapter3Unlocked(state) ? 3 : chapter2Unlocked(state) ? 2 : 1
}

/**
 * What opens the next chapter: a short progress text ("3/5 franchises"), when
 * it opens in words, and how far along you are (0..1). Null in the last chapter.
 */
export function nextChapterGoal(
  state: GameState,
): { chapter: 2 | 3 | 4 | 5; name: string; text: string; when: string; progress: number } | null {
  const chapter = chapterNumber(state)
  if (chapter === 5) return null
  const next = (chapter + 1) as 2 | 3 | 4 | 5
  const name = CHAPTERS[next - 1].name
  const sales = (needed: number) => {
    const have = Math.min(state.prestige.franchises, needed)
    return { text: `${have}/${needed} franchises`, when: `after ${needed} franchises`, progress: have / needed }
  }
  const reach = (id: RegionId) => {
    const target = REGION_INDEX[id]
    const best = Math.max(state.stats.bestPlace, furthestPlace(state))
    const place = `${REGION_BY_ID[id].emoji} ${REGION_BY_ID[id].name.replace(/^The /, 'the ')}`
    return { text: `reach ${place}`, when: `the first time you reach ${place}`, progress: Math.min(1, best / target) }
  }
  const goal = next === 2 ? sales(CHAPTER2_FRANCHISES) : next === 3 ? sales(CHAPTER3_FRANCHISES) : reach(next === 4 ? CHAPTER4_REGION : CHAPTER5_REGION)
  return { chapter: next, name, ...goal }
}

/** Is this place's chapter open (space places in Chapter 4, deep space in Chapter 5)? */
export function chapterOpenFor(state: GameState, def: { space?: true; deep?: true }): boolean {
  if (def.deep) return chapter5Unlocked(state)
  if (def.space) return chapter4Unlocked(state)
  return true
}

/** Space vehicles only show up in Chapter 4, deep-space ones in Chapter 5. */
export function vehicleVisible(state: GameState, def: VehicleDef): boolean {
  return def.space ? chapterOpenFor(state, def) : chapter3Unlocked(state)
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

/** How many count goals (FARM_GOALS) this many buildings have reached. */
export function farmGoalsReached(count: number): number {
  let n = 0
  for (const g of FARM_GOALS) if (count >= g) n++
  return n
}

/** The next count goal, or null when every goal is reached. */
export function nextFarmGoal(count: number): number | null {
  return FARM_GOALS.find((g) => count < g) ?? null
}

/** Speed bonus from count goals. */
export const farmGoalBonus = (count: number): number => FARM_GOAL_MULT ** farmGoalsReached(count)

/** Cycles per second one building of this kind runs: group gear, its own gear, count goals. */
export function facilitySpeed(state: GameState, def: FacilityDef, mods: Mods): number {
  return def.rate * mods.facility[def.group] * mods.building[def.id] * farmGoalBonus(state.facilities[def.id])
}

/** Cycles per second all buildings of this kind can run, ignoring shortages. */
export function facilityCapacity(state: GameState, def: FacilityDef, mods: Mods): Decimal {
  return D(facilitySpeed(state, def, mods)).mul(state.facilities[def.id])
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
  const throughput = Math.min(kitchenCapacity(state, mods), deliveryCapacity(state, mods).toNumber())
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
 * Schnitzels per second the ingredients can keep up with: what the farm
 * (from Chapter 2) and the corner shop supply of the scarcest ingredient,
 * against what one schnitzel uses of it. Stock on the shelves is left out:
 * it runs out. Infinity when nothing is needed.
 */
export function supplyLimit(state: GameState, mods: Mods): number {
  const perSchnitzel: Partial<Record<ItemId, number>> = {}
  for (const stage of STAGE_IDS)
    for (const [item, qty] of Object.entries(stageInputs(state, stage)) as [ItemId, number][]) perSchnitzel[item] = (perSchnitzel[item] ?? 0) + qty
  const farm = chapter2Unlocked(state)
  let limit = Infinity
  for (const id of INGREDIENT_IDS) {
    const n = perSchnitzel[id] ?? 0
    if (n > 0) limit = Math.min(limit, ((farm ? farmSupply(state, id, mods) : 0) + shopSupplyRate(mods)) / n)
  }
  return limit
}

/** The four things that can hold the business back, in schnitzels per second. */
export type Pillar = 'customers' | 'supply' | 'kitchen' | 'delivery'

export interface Limits {
  customers: number
  supply: number
  kitchen: number
  delivery: number
  /** The smallest of the four: what the business really sells per second. */
  limit: number
  /** Which one it is (on a tie, the earliest in the pipeline). */
  bottleneck: Pillar
}

/** What each part of the business can do per second, and which one holds it back. */
export function businessLimits(state: GameState, mods: Mods): Limits {
  const l = {
    customers: customerDemand(state, mods),
    supply: supplyLimit(state, mods),
    kitchen: kitchenCapacity(state, mods),
    delivery: deliveryCapacity(state, mods).toNumber(),
  }
  const order: Pillar[] = ['customers', 'supply', 'kitchen', 'delivery']
  const bottleneck = order.reduce((a, b) => (l[b] < l[a] ? b : a))
  return { ...l, limit: l[bottleneck], bottleneck }
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
  const def = WORKER_BY_ID[id]
  return bulkBuy(def.baseCost, def.costGrowth, state.workers[id], state.money, amount)
}

export function facilityPlan(state: GameState, def: FacilityDef, amount: BuyAmount = state.settings.buyAmount): BulkPlan {
  return bulkBuy(def.baseCost, def.costGrowth, state.facilities[def.id], state.money, amount)
}

export function vehiclePlan(state: GameState, def: VehicleDef, amount: BuyAmount = state.settings.buyAmount): BulkPlan {
  return bulkBuy(def.baseCost, def.costGrowth, state.vehicles[def.id], state.money, amount)
}

export function workerCost(state: GameState, id: WorkerId): Decimal {
  const def = WORKER_BY_ID[id]
  return D(def.baseCost).mul(D(def.costGrowth).pow(state.workers[id]))
}

export function canHire(state: GameState, def: WorkerDef): boolean {
  return meets(state, def.requires) && state.money.gte(workerCost(state, def.id))
}

/** Crispness upgrades stay hidden until crispness is unlocked. */
export function upgradeVisible(state: GameState, def: UpgradeDef): boolean {
  return (!def.quality || state.crisp.unlocked) && chapterOpenFor(state, def) && isTeased(state, def.requires)
}

/** Not owned yet and everything but the money is in place. */
export function upgradeUnlocked(state: GameState, def: UpgradeDef): boolean {
  return (
    !state.upgrades[def.id] &&
    (!def.quality || state.crisp.unlocked) &&
    chapterOpenFor(state, def) &&
    meets(state, def.requires)
  )
}

export function canBuyUpgrade(state: GameState, def: UpgradeDef): boolean {
  return upgradeUnlocked(state, def) && state.money.gte(def.cost)
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

/** What one step does per second: a kitchen step's staff, or all of delivery (helpers and the fleet). */
export function stepCapacity(state: GameState, task: Task, mods: Mods): Decimal {
  return task === 'deliver' ? deliveryCapacity(state, mods) : taskCapacity(state, task, mods)
}

/** Orders per second from every place you've opened. */
export function customerDemand(state: GameState, mods: Mods): number {
  return REGIONS.filter((r) => state.regions[r.id].unlocked).reduce((n, r) => n + orderRate(r, mods).toNumber(), 0)
}

/** Schnitzels per second the kitchen can make: as fast as its slowest step. */
export function kitchenCapacity(state: GameState, mods: Mods): number {
  return Math.min(...STAGE_IDS.map((t) => taskCapacity(state, t, mods).toNumber()))
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

/** Units per second the step after this one can take. */
function nextStepCapacity(state: GameState, stage: StageId, mods: Mods): Decimal {
  return stepCapacity(state, NEXT_TASK[stage], mods)
}

/**
 * Cook to order, set automatically: how many of a step's output may wait for
 * the next step. A few seconds of what the next step can use, at least MIN_BUFFERS.
 */
export function stageBuffer(state: GameState, stage: StageId, mods: Mods = getMods(state)): Decimal {
  return Decimal.max(MIN_BUFFERS[stage], nextStepCapacity(state, stage, mods).mul(BUFFER_SECONDS).ceil())
}

/**
 * How many of a step's output staff may have waiting: the buffer, plus what
 * the next step can consume this tick, so long ticks (background tabs,
 * offline progress) are not throttled by the buffer.
 */
export function stageLimit(state: GameState, stage: StageId, mods: Mods, dt: number): Decimal {
  return stageBuffer(state, stage, mods).add(nextStepCapacity(state, stage, mods).mul(dt))
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
/** Everything a place asks for except the money: its chapter is open, enough franchises, enough reputation. */
export function regionRequirementsMet(state: GameState, def: RegionDef): boolean {
  return (
    chapterOpenFor(state, def) &&
    state.prestige.franchises >= (def.requiresFranchises ?? 0) &&
    meets(state, { reputation: def.unlockReputation })
  )
}

export function nextRegion(state: GameState): { region: RegionDef; locked: boolean } | null {
  const region = REGIONS.find((r) => !state.regions[r.id].unlocked)
  if (!region) return null
  return { region, locked: state.prestige.franchises < (region.requiresFranchises ?? 0) }
}

/** The orbit, ever (any run): the logo leaves the flaming pan for space. */
export function reachedOrbit(state: GameState): boolean {
  return state.stats.bestPlace >= REGION_INDEX.orbit
}
