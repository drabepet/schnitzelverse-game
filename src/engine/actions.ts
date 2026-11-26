// Everything the player can do. Each action returns whether it did anything.
import { D, type Decimal } from './decimal'
import { GAME_VERSION } from '../version'
import {
  CRISP_TEMP_BEST,
  CRISP_TEMP_MAX,
  CRISP_TEMP_MIN,
  CRISP_UNLOCK_REGION,
  KITCHEN_FACILITIES,
  FACILITY_BY_ID,
  type FacilityId,
  FRANCHISE_MESSAGES,
  FRANCHISE_UNLOCK_REGION,
  HEAD_START_BASE,
  HEAD_START_GROWTH,
  INGREDIENT_IDS,
  type IngredientId,
  type ItemId,
  KNOCK_COOLDOWN,
  OIL_LEVELS,
  PERK_BY_ID,
  type PerkId,
  REGION_BY_ID,
  REGION_INDEX,
  type RegionId,
  REGIONS,
  STAGE_IDS,
  type StageId,
  START_REGIONS,
  UPGRADE_BY_ID,
  type UpgradeId,
  UPGRADES,
  VEHICLE_BY_ID,
  type VehicleId,
  VEHICLES,
  WORKER_BY_ID,
  type WorkerId,
  WORKERS,
  type FitOut,
} from './content'
import { addLog, AUTO_SELL_PERCENTS, freshRun, RUNS_LIMIT, type BuyAmount, type GameState, type Notation, type UiScale, type EffectsLevel, UPDATE_RATES, type UpdateRate } from './state'
import {
  canBuyPerk,
  canSwapFork,
  forkPartner,
  canBuyUpgrade,
  canFranchise,
  chapter2Unlocked,
  clickAmount,
  earningsCrumbs,
  furthestPlace,
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
  regionRequirementsMet,
} from './rules'
import { buyPacks, deliverTo, runStage } from './ops'


/** Managers the first sale brings for free (see familyJoinsIn). */
const FIRST_MANAGERS: PerkId[] = ['familyManager', 'estateAgent']

export function clickStage(state: GameState, stage: StageId): boolean {
  const done = runStage(state, stage, clickAmount(stage, getMods(state)))
  if (done.lte(0)) return false
  state.stats.clicks++
  state.stats.byHand[stage]++
  return true
}

export function clickDeliver(state: GameState, region: RegionId): boolean {
  const mods = getMods(state)
  const def = REGION_BY_ID[region]
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
  const def = WORKER_BY_ID[id]
  if (!meets(state, def.requires)) return false
  const plan = workerPlan(state, id, amount)
  if (!plan.affordable) return false
  state.money = state.money.sub(plan.cost)
  state.workers[id] += plan.count
  if (state.workers[id] === plan.count) addLog(state, `${def.emoji} ${def.name} joined the garage kitchen.`)
  return true
}

export function buyUpgrade(state: GameState, id: UpgradeId): boolean {
  const def = UPGRADE_BY_ID[id]
  if (!canBuyUpgrade(state, def)) return false
  state.money = state.money.sub(def.cost)
  state.upgrades[id] = true
  return true
}

export function canUnlockRegion(state: GameState, id: RegionId): boolean {
  const def = REGION_BY_ID[id]
  return !state.regions[id].unlocked && regionRequirementsMet(state, def) && state.money.gte(def.unlockCost)
}

export function unlockRegion(state: GameState, id: RegionId): boolean {
  if (!canUnlockRegion(state, id)) return false
  const def = REGION_BY_ID[id]
  state.money = state.money.sub(def.unlockCost)
  state.regions[id].unlocked = true
  const index = REGION_INDEX[id]
  if (index > state.stats.bestPlace) state.stats.bestPlace = index
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

export function headStartMoney(level: number): number {
  return level > 0 ? HEAD_START_BASE * HEAD_START_GROWTH ** (level - 1) : 0
}

/** Start-of-run bonuses from perks. */
function applyStartPerks(state: GameState): void {
  state.money = state.money.add(headStartMoney(perkLevel(state, 'headStart')))
  if (perkLevel(state, 'auntieRemembers') > 0) state.upgrades.shoppingList = true
  const family = perkLevel(state, 'loyalFamily')
  for (const w of WORKERS) state.workers[w.id] += family
  const deeds = perkLevel(state, 'farmDeeds')
  for (const f of KITCHEN_FACILITIES) state.facilities[f.id] += deeds
  const fleet = perkLevel(state, 'fleetContracts')
  const launch = perkLevel(state, 'launchContracts')
  const warp = perkLevel(state, 'warpContracts')
  for (const v of VEHICLES) state.vehicles[v.id] += v.id === 'warp' ? warp : v.deep ? 0 : v.space ? launch : fleet
  unlockStartRegions(state, perkLevel(state, 'oldConnections'))
  if (perkLevel(state, 'oldFriends') > 0) hireFarmHands(state)
}

/** Grandpa's old friends: the family farm hands start on the farm. */
function hireFarmHands(state: GameState): void {
  for (const u of UPGRADES) if (u.chain) state.upgrades[u.id] = true
}

/** Remember the run that is ending, for the run history and personal bests in Records. */
function recordRun(state: GameState, gain: Decimal): void {
  const st = state.stats
  st.runs.push({
    end: st.playtime,
    time: state.run.time,
    place: furthestPlace(state),
    crumbs: gain.toNumber(),
    earned: state.run.earned.toNumber(),
    served: state.run.served.toNumber(),
  })
  if (st.runs.length > RUNS_LIMIT) st.runs.splice(0, st.runs.length - RUNS_LIMIT)
  if (gain.gt(st.bestSale)) st.bestSale = gain
  if (state.run.served.gt(st.bestRunServed)) st.bestRunServed = state.run.served
  st.longestRun = Math.max(st.longestRun, state.run.time)
}

/**
 * Sell the business: reset the run, keep Golden Crumbs, perks, settings,
 * statistics and the story so far.
 */
export function franchise(state: GameState): boolean {
  if (!canFranchise(state)) return false
  const gain = pendingCrumbs(state)
  // Whatever a frontier sale pays on top of earnings is bonus: kept apart, so it
  // doesn't push the next crumb from earnings further away.
  const bonus = gain.sub(earningsCrumbs(state))
  recordRun(state, gain)
  Object.assign(state, freshRun())
  state.prestige.crumbs = state.prestige.crumbs.add(gain)
  state.prestige.totalCrumbs = state.prestige.totalCrumbs.add(gain)
  if (bonus.gt(0)) state.prestige.bonusCrumbs = state.prestige.bonusCrumbs.add(bonus)
  state.prestige.franchises++
  applyStartPerks(state)
  addLog(state, FRANCHISE_MESSAGES[(state.prestige.franchises - 1) % FRANCHISE_MESSAGES.length])
  if (familyJoinsIn(state)) {
    addLog(
      state,
      '👪 The family joins in.\nGrandma: “While you’re out, I’ll hire for the slowest step, and your mother will open the next place the moment we can afford it.”',
    )
  }
  return true
}

/**
 * The first sale brings Grandma and Mum in as managers (rank 1, free), so the
 * business hires and expands while you're away from then on: a player who
 * checks in a few times a day doesn't wait a whole visit for the next town.
 * Returns true when it did something.
 */
export function familyJoinsIn(state: GameState): boolean {
  if (state.prestige.franchises < 1) return false
  let joined = false
  for (const id of FIRST_MANAGERS) {
    if (perkLevel(state, id) > 0) continue
    state.prestige.perks[id] = 1
    joined = true
  }
  return joined
}

export function buyPerk(state: GameState, id: PerkId): boolean {
  const perk = PERK_BY_ID[id]
  if (!canBuyPerk(state, perk)) return false
  state.prestige.crumbs = state.prestige.crumbs.sub(perkCost(state, perk))
  const level = perkLevel(state, id) + 1
  state.prestige.perks[id] = level
  // Start-of-run perks also help the current run right away.
  if (id === 'headStart') state.money = state.money.add(headStartMoney(level) - headStartMoney(level - 1))
  if (id === 'auntieRemembers') state.upgrades.shoppingList = true
  if (id === 'loyalFamily') for (const w of WORKERS) state.workers[w.id]++
  if (id === 'oldConnections') unlockStartRegions(state, level)
  if (id === 'farmDeeds') for (const f of KITCHEN_FACILITIES) state.facilities[f.id]++
  if (id === 'fleetContracts') for (const v of VEHICLES) if (!v.space) state.vehicles[v.id]++
  if (id === 'launchContracts') for (const v of VEHICLES) if (v.space && !v.deep) state.vehicles[v.id]++
  if (id === 'warpContracts') state.vehicles.warp++
  if (id === 'oldFriends') hireFarmHands(state)
  return true
}

// ---------------------------------------------------------------- chapter 2: the farm

export function buyFacility(state: GameState, id: FacilityId, amount: BuyAmount = 1): boolean {
  const def = FACILITY_BY_ID[id]
  // Star paprika only grows once its place is reached in this run.
  if (!chapter2Unlocked(state) || !meets(state, def.requires)) return false
  const plan = facilityPlan(state, def, amount)
  if (!plan.affordable) return false
  state.money = state.money.sub(plan.cost)
  state.facilities[id] += plan.count
  if (state.facilities[id] === plan.count) addLog(state, `${def.emoji} The first ${def.name.toLowerCase()} is up and running.`)
  return true
}

// ---------------------------------------------------------------- chapter 3: on the road

export function buyVehicle(state: GameState, id: VehicleId, amount: BuyAmount = 1): boolean {
  const def = VEHICLE_BY_ID[id]
  if (!vehicleVisible(state, def)) return false
  const plan = vehiclePlan(state, def, amount)
  if (!plan.affordable) return false
  state.money = state.money.sub(plan.cost)
  state.vehicles[id] += plan.count
  if (state.vehicles[id] === plan.count) addLog(state, `${def.emoji} Your first ${def.name.toLowerCase()} is on the road.`)
  return true
}

/** Fit out one kind of vehicle (free, any time; kept between runs). The fit-outs tried are remembered for a badge. */
export function setFitOut(state: GameState, id: VehicleId, fit: FitOut): void {
  if (fit === 'standard') delete state.fitOuts[id]
  else state.fitOuts[id] = fit
  state.fitOutsTried[fit] = true
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

export function setUpdateRate(state: GameState, rate: UpdateRate): void {
  if ((UPDATE_RATES as readonly number[]).includes(rate)) state.settings.updateRate = rate
}

export function setEffects(state: GameState, level: EffectsLevel): void {
  state.settings.effects = level
}

export function setChapterColours(state: GameState, on: boolean): void {
  state.settings.chapterColours = on
}

/** Open (false) or close (true) the welcome screen. */
export function setIntroSeen(state: GameState, seen: boolean): void {
  state.introSeen = seen
  // A new player has nothing to catch up on in "What's new".
  if (seen && !state.newsSeen) state.newsSeen = GAME_VERSION
}

/** Switch a family-tree choice to this side, keeping the levels. Once per choice per run. */
export function swapFork(state: GameState, id: PerkId): boolean {
  const perk = PERK_BY_ID[id]
  const other = forkPartner(perk)
  if (!other || !perk.fork || !canSwapFork(state, perk)) return false
  state.prestige.perks[id] = perkLevel(state, other.id)
  delete state.prestige.perks[other.id]
  state.run.forkSwaps[perk.fork] = true
  addLog(state, `${perk.emoji} Change of plan: ${perk.name.toLowerCase()} instead of ${other.name.toLowerCase()}.`)
  return true
}

/** Mum's selling rule (rank 3): switch, rule, minutes for the time rule, and whether Auntie spends the crumbs. */
export function setAutoSell(state: GameState, change: Partial<GameState['autoSell']>): void {
  const next = { ...state.autoSell, ...change }
  next.minutes = Math.min(1440, Math.max(10, Math.round(Number.isFinite(next.minutes) ? next.minutes : 120)))
  if (!(AUTO_SELL_PERCENTS as readonly number[]).includes(next.percent)) next.percent = 25
  state.autoSell = next
}

/** The finale screen has been read. */
export function setFinaleSeen(state: GameState): void {
  state.finaleSeen = true
}

/** The player opened About & what's new for this version. */
export function setNewsSeen(state: GameState, version: string): void {
  state.newsSeen = version
}

/** The player kept a copy of the save (download or copy text) at this wall-clock time. */
export function noteCopyKept(state: GameState, now: number): void {
  state.stats.lastCopyAt = now
}

/** The keep-a-copy note has been shown for this chapter. */
export function setCopyNudgeChapter(state: GameState, chapter: number): void {
  state.copyNudgeChapter = Math.max(state.copyNudgeChapter, chapter)
}

/** A kitchen tale has been opened. */
export function markTaleRead(state: GameState, chapter: number): void {
  if (!state.talesRead.includes(chapter)) state.talesRead.push(chapter)
}

/** The new-chapter card has offered this chapter's tale (read now or later). */
export function setTaleOffered(state: GameState, chapter: number): void {
  state.taleOffered = Math.max(state.taleOffered, chapter)
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
