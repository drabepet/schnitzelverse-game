// Everything the player can do. Each action returns whether it did anything.
import { D } from './decimal'
import {
  KNOCK_COOLDOWN,
  CRISP_TEMP_BEST,
  CRISP_TEMP_MAX,
  CRISP_TEMP_MIN,
  CRISP_UNLOCK_REGION,
  OIL_LEVELS,
  FACILITIES,
  FRANCHISE_MESSAGES,
  INGREDIENT_IDS,
  STAGE_IDS,
  VEHICLES,
  FRANCHISE_UNLOCK_REGION,
  HEAD_START_BASE,
  HEAD_START_GROWTH,
  PERKS,
  REGIONS,
  START_REGIONS,
  UPGRADES,
  WORKERS,
  type FacilityId,
  type IngredientId,
  type ItemId,
  type PerkId,
  type RegionId,
  type StageId,
  type UpgradeId,
  type VehicleId,
  type WorkerId,
} from './content'
import { addLog, freshRun, type BuyAmount, type GameState, type Notation, type UiScale } from './state'
import {
  canBuyPerk,
  canBuyUpgrade,
  canFranchise,
  chapter2Unlocked,
  chapter4Unlocked,
  clickAmount,
  helperReaches,
  vehicleVisible,
  facilityPlan,
  getMods,
  meets,
  orderCap,
  stageInputs,
  pendingCrumbs,
  perkCost,
  perkLevel,
  vehiclePlan,
  workerPlan,
} from './rules'
import { buyPacks, deliverTo, runStage } from './tick'

export function clickStage(state: GameState, stage: StageId): boolean {
  const done = runStage(state, stage, clickAmount(stage, getMods(state)))
  if (done.lte(0)) return false
  state.stats.clicks++
  state.stats.byHand[stage]++
  return true
}

export function clickDeliver(state: GameState, region: RegionId): boolean {
  const mods = getMods(state)
  const def = REGIONS.find((r) => r.id === region)!
  if (!helperReaches(def)) return false // too far to carry it yourself
  const [served] = deliverTo(state, def, clickAmount('deliver', mods), mods)
  if (served.lte(0)) return false
  state.stats.clicks++
  return true
}

export function buyIngredient(state: GameState, item: IngredientId, packs = 1): boolean {
  return buyPacks(state, item, D(packs), getMods(state)).gt(0)
}

/** Hire one, ten, or as many as you can afford (see BuyAmount). */
export function hireWorker(state: GameState, id: WorkerId, amount: BuyAmount = 1): boolean {
  const def = WORKERS.find((w) => w.id === id)!
  if (!meets(state, def.requires)) return false
  const plan = workerPlan(state, id, amount)
  if (!plan.affordable) return false
  state.money = state.money.sub(plan.cost)
  state.workers[id] += plan.count
  if (state.workers[id] === plan.count) addLog(state, `${def.emoji} ${def.name} joined the garage kitchen.`)
  return true
}

export function buyUpgrade(state: GameState, id: UpgradeId): boolean {
  const def = UPGRADES.find((u) => u.id === id)!
  if (!canBuyUpgrade(state, def)) return false
  state.money = state.money.sub(def.cost)
  state.upgrades[id] = true
  return true
}

export function canUnlockRegion(state: GameState, id: RegionId): boolean {
  const def = REGIONS.find((r) => r.id === id)!
  return (
    !state.regions[id].unlocked &&
    (!def.space || chapter4Unlocked(state)) &&
    state.prestige.franchises >= (def.requiresFranchises ?? 0) &&
    meets(state, { reputation: def.unlockReputation }) &&
    state.money.gte(def.unlockCost)
  )
}

export function unlockRegion(state: GameState, id: RegionId): boolean {
  if (!canUnlockRegion(state, id)) return false
  const def = REGIONS.find((r) => r.id === id)!
  state.money = state.money.sub(def.unlockCost)
  state.regions[id].unlocked = true
  if (id === FRANCHISE_UNLOCK_REGION) {
    state.prestige.unlocked = true
    const best = state.stats.bestTownTime
    if (best === 0 || state.run.time < best) state.stats.bestTownTime = state.run.time
  }
  addLog(state, `${def.emoji} You now deliver to ${def.name.toLowerCase()}.`)
  if (id === CRISP_UNLOCK_REGION && !state.crisp.unlocked) {
    state.crisp.unlocked = true
    addLog(
      state,
      '🥇 The next town’s critics bit into a schnitzel and frowned: “Not crisp enough.” Grandma took that personally. Crispness unlocked in the kitchen.',
    )
  }
  return true
}

/** Fryer temperature (°C) and how often the oil is changed (index into OIL_LEVELS). */
export function setCrisp(state: GameState, temperature: number, oil: number): void {
  const t = Number.isFinite(temperature) ? Math.round(temperature) : CRISP_TEMP_BEST
  state.crisp.temperature = Math.min(CRISP_TEMP_MAX, Math.max(CRISP_TEMP_MIN, t))
  state.crisp.oil = Math.min(OIL_LEVELS.length - 1, Math.max(0, Math.floor(Number.isFinite(oil) ? oil : 0)))
}

export function setBuffer(state: GameState, stage: StageId, limit: number): void {
  state.buffers[stage] = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0
}

export function setAutoBuy(state: GameState, enabled: boolean, target: number, reserve = state.autoBuy.reserve): void {
  const clean = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0)
  state.autoBuy.enabled = enabled
  state.autoBuy.target = clean(target)
  state.autoBuy.reserve = clean(reserve)
}

// ---------------------------------------------------------------- franchise

/** Old connections: the first `level` start places are unlocked for free. */
function unlockStartRegions(state: GameState, level: number): void {
  for (const id of START_REGIONS.slice(0, level)) state.regions[id].unlocked = true
}

function headStartMoney(level: number): number {
  return level > 0 ? HEAD_START_BASE * HEAD_START_GROWTH ** (level - 1) : 0
}

/** Start-of-run bonuses from perks. */
function applyStartPerks(state: GameState): void {
  state.money = state.money.add(headStartMoney(perkLevel(state, 'headStart')))
  if (perkLevel(state, 'auntieRemembers') > 0) state.upgrades.shoppingList = true
  const family = perkLevel(state, 'loyalFamily')
  for (const w of WORKERS) state.workers[w.id] += family
  const deeds = perkLevel(state, 'farmDeeds')
  for (const f of FACILITIES) state.facilities[f.id] += deeds
  const fleet = perkLevel(state, 'fleetContracts')
  const launch = perkLevel(state, 'launchContracts')
  for (const v of VEHICLES) state.vehicles[v.id] += v.space ? launch : fleet
  unlockStartRegions(state, perkLevel(state, 'oldConnections'))
}

/**
 * Sell the business: reset the run, keep Golden Crumbs, perks, settings,
 * statistics and the story so far.
 */
export function franchise(state: GameState): boolean {
  if (!canFranchise(state)) return false
  const gain = pendingCrumbs(state)
  Object.assign(state, freshRun())
  state.prestige.crumbs = state.prestige.crumbs.add(gain)
  state.prestige.totalCrumbs = state.prestige.totalCrumbs.add(gain)
  state.prestige.franchises++
  applyStartPerks(state)
  addLog(state, FRANCHISE_MESSAGES[(state.prestige.franchises - 1) % FRANCHISE_MESSAGES.length])
  return true
}

export function buyPerk(state: GameState, id: PerkId): boolean {
  const perk = PERKS.find((p) => p.id === id)!
  if (!canBuyPerk(state, perk)) return false
  state.prestige.crumbs = state.prestige.crumbs.sub(perkCost(state, perk))
  const level = perkLevel(state, id) + 1
  state.prestige.perks[id] = level
  // Start-of-run perks also help the current run right away.
  if (id === 'headStart') state.money = state.money.add(headStartMoney(level) - headStartMoney(level - 1))
  if (id === 'auntieRemembers') state.upgrades.shoppingList = true
  if (id === 'loyalFamily') for (const w of WORKERS) state.workers[w.id]++
  if (id === 'oldConnections') unlockStartRegions(state, level)
  if (id === 'farmDeeds') for (const f of FACILITIES) state.facilities[f.id]++
  if (id === 'fleetContracts') for (const v of VEHICLES) if (!v.space) state.vehicles[v.id]++
  if (id === 'launchContracts') for (const v of VEHICLES) if (v.space) state.vehicles[v.id]++
  return true
}

// ---------------------------------------------------------------- chapter 2: the farm

export function buyFacility(state: GameState, id: FacilityId, amount: BuyAmount = 1): boolean {
  const def = FACILITIES.find((f) => f.id === id)!
  if (!chapter2Unlocked(state)) return false
  const plan = facilityPlan(state, def, amount)
  if (!plan.affordable) return false
  state.money = state.money.sub(plan.cost)
  state.facilities[id] += plan.count
  if (state.facilities[id] === plan.count) addLog(state, `${def.emoji} The first ${def.name.toLowerCase()} is up and running.`)
  return true
}

// ---------------------------------------------------------------- chapter 3: on the road

export function buyVehicle(state: GameState, id: VehicleId, amount: BuyAmount = 1): boolean {
  const def = VEHICLES.find((v) => v.id === id)!
  if (!vehicleVisible(state, def)) return false
  const plan = vehiclePlan(state, def, amount)
  if (!plan.affordable) return false
  state.money = state.money.sub(plan.cost)
  state.vehicles[id] += plan.count
  if (state.vehicles[id] === plan.count) addLog(state, `${def.emoji} Your first ${def.name.toLowerCase()} is on the road.`)
  return true
}

/** Seconds of play until the neighbours open the door again (0 = now). */
export function knockWait(state: GameState): number {
  return Math.max(0, state.knockReadyAt - state.stats.playtime)
}

/** Can you knock right now: the neighbours are willing and still have room for an order? */
export function canKnock(state: GameState): boolean {
  const r = REGIONS[0]
  return knockWait(state) <= 0 && state.regions[r.id].orders.add(1).lte(orderCap(r, getMods(state)))
}

/**
 * Knock on the next-door neighbours' door: one extra order, at most once every
 * KNOCK_COOLDOWN seconds. Something to do early on, when customers are the limit.
 */
export function knockOnDoors(state: GameState): boolean {
  if (!canKnock(state)) return false
  const region = state.regions[REGIONS[0].id]
  region.orders = region.orders.add(1)
  state.knockReadyAt = state.stats.playtime + KNOCK_COOLDOWN
  state.stats.clicks++
  state.stats.knocks++
  return true
}

// ---------------------------------------------------------------- badges & easter eggs

export function clickLogo(state: GameState): void {
  state.stats.logoClicks++
}

export function setNotationSetting(state: GameState, notation: Notation): void {
  state.settings.notation = notation
}

export function setUiScale(state: GameState, scale: UiScale): void {
  state.settings.uiScale = scale
}

export function setBadgePopups(state: GameState, on: boolean): void {
  state.settings.badgePopups = on
}

/** Open (false) or close (true) the welcome screen. */
export function setIntroSeen(state: GameState, seen: boolean): void {
  state.introSeen = seen
}

export function setBuyAmount(state: GameState, amount: BuyAmount): void {
  state.settings.buyAmount = amount
}

export function markBadgesSeen(state: GameState): void {
  state.badgesSeen = Object.keys(state.badges).length
}

// ---------------------------------------------------------------- quick actions (sidebar)

export const QUICK_RESTOCK_BELOW = 5

/** Restock ingredients that are running low: one pack each. */
export function quickRestock(state: GameState): boolean {
  let bought = false
  for (const item of INGREDIENT_IDS) {
    if (state.items[item].lt(QUICK_RESTOCK_BELOW)) bought = buyIngredient(state, item, 1) || bought
  }
  return bought
}

/**
 * Ingredients missing to do all three kitchen steps in one go (pound, bread,
 * fry: one schnitzel from raw meat). Empty when "Cook all three" can run.
 */
export function missingForCookAll(state: GameState): ItemId[] {
  const need = new Map<ItemId, number>()
  for (const stage of STAGE_IDS) {
    for (const [item, qty] of Object.entries(stageInputs(state, stage)) as [ItemId, number][]) {
      // Cutlets and breaded cutlets are made by the step before.
      if (item === 'cutlet' || item === 'breaded') continue
      need.set(item, (need.get(item) ?? 0) + qty)
    }
  }
  return [...need].filter(([item, qty]) => state.items[item].lt(qty)).map(([item]) => item)
}

/** Pound, bread and fry in one click, if there are ingredients for all three steps. */
export function cookAll(state: GameState): boolean {
  if (missingForCookAll(state).length) return false
  let done = false
  for (const stage of STAGE_IDS) done = clickStage(state, stage) || done
  return done
}
