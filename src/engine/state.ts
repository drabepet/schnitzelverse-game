import { D, type Decimal } from './decimal'
import {
  CRISP_TEMP_BEST,
  DEFAULT_AUTO_BUY_RESERVE,
  FACILITIES,
  INGREDIENT_IDS,
  ITEM_IDS,
  REGIONS,
  SHOP_SHELF_SECONDS,
  SHOP_SUPPLY_RATE,
  VEHICLES,
  WORKERS,
  type FacilityId,
  type ForkId,
  type SpendLevel,
  type IngredientId,
  type ItemId,
  type PerkId,
  type RegionId,
  type StageId,
  type UpgradeId,
  type VehicleId,
  type WorkerId,
} from './content'

export const SAVE_VERSION = 1

/** How many to buy per click: one, ten, or as many as you can afford. */
export type BuyAmount = 1 | 10 | 'max'
export type Notation = 'short' | 'scientific'
/** How big the whole interface is: 'auto' grows with the window. */
export type UiScale = 'auto' | 'small' | 'normal' | 'large' | 'xl'

export interface Settings {
  buyAmount: BuyAmount
  /** 'short' = 1.23M, 4.56B…; 'scientific' = 1.23e6 from a thousand up. */
  notation: Notation
  /** Show a pop-up when a badge is earned. */
  badgePopups: boolean
  uiScale: UiScale
}

export interface RegionState {
  unlocked: boolean
  /** Open orders waiting to be delivered. */
  orders: Decimal
}

export interface LogEntry {
  /** Seconds of play time when this happened. */
  t: number
  text: string
}

/** Everything a Franchise resets. */
export interface RunState {
  money: Decimal
  reputation: Decimal
  items: Record<ItemId, Decimal>
  workers: Record<WorkerId, number>
  upgrades: Partial<Record<UpgradeId, true>>
  regions: Record<RegionId, RegionState>
  /** Farm buildings owned (Chapter 2). */
  facilities: Record<FacilityId, number>
  /** Fleet vehicles owned (Chapter 3). */
  vehicles: Record<VehicleId, number>
  /** What the corner shop has left on its shelves, per ingredient. */
  shelves: Record<IngredientId, Decimal>
  /** Seconds the player has been broke and unable to cook (Mum's fridge). */
  stuckFor: number
  /** This run only. */
  run: {
    earned: Decimal
    time: number
    served: Decimal
    servedCold: Decimal
    /** Family-tree choices already switched this run (one switch per choice per run). */
    forkSwaps: Partial<Record<ForkId, true>>
    /** Money each manager spent this run. */
    managerSpent: Partial<Record<PerkId, number>>
  }
}

/**
 * The whole saved game. Plain data only: no functions, no class instances
 * other than Decimal, so it serializes cleanly (see save.ts).
 */
export interface GameState extends RunState {
  version: number
  settings: Settings
  /** Play time (s) when the neighbours will open the door again (Knock). */
  knockReadyAt: number
  /** The welcome screen has been read (false on a new game and after a hard reset). */
  introSeen: boolean
  /** The newest version whose "What's new" the player has seen ('' = none yet). */
  newsSeen: string
  /** The finale (reaching the Schnitzelverse) has been shown. */
  finaleSeen: boolean
  /** Crispness: unlocked once (for good), fryer temperature and oil changes. */
  crisp: { unlocked: boolean; temperature: number; oil: number }
  /** Auntie's shopping list: restock up to `target`, never spending below `reserve`. */
  autoBuy: { enabled: boolean; target: number; reserve: number }
  /** Survives every Franchise. */
  prestige: {
    /** True once the Franchise has been unlocked (reached the town once). */
    unlocked: boolean
    franchises: number
    /** Golden Crumbs available to spend. */
    crumbs: Decimal
    /** Golden Crumbs earned over all time. */
    totalCrumbs: Decimal
    /** Of those, extra crumbs from frontier sales (not from earnings; see frontierCrumbs). */
    bonusCrumbs: Decimal
    perks: Partial<Record<PerkId, number>>
  }
  /** Income over time, for the chart in Records. */
  history: { clock: number; earned: Decimal; points: HistoryPoint[] }
  /** Managers the player switched off (bought managers are on by default). */
  managersOff: Partial<Record<PerkId, true>>
  /** How boldly each manager spends (default Normal). */
  managerSpend: Partial<Record<PerkId, SpendLevel>>
  /** What the managers bought lately, newest last (see automation.ts). */
  managerLog: ManagerLogEntry[]
  /** Mum sells the business for you (manager rank 3). Off until the player switches it on. */
  autoSell: { enabled: boolean; rule: AutoSellRule; minutes: number; spendCrumbs: boolean }
  /** Seconds since the managers last looked around. */
  managerClock: number
  milestones: Record<string, true>
  /** Badges earned: id → play time (s) when earned. Survives every franchise. */
  badges: Record<string, number>
  /** How many badges the player has already looked at (for the "new" dot). */
  badgesSeen: number
  log: LogEntry[]
  /** Lifetime statistics (never reset). */
  stats: {
    served: Decimal
    servedCold: Decimal
    earned: Decimal
    clicks: number
    playtime: number
    rescues: number
    /** Times the corner shop could not sell as much as wanted. */
    soldOut: number
    /** Easter egg: clicks on the logo. */
    logoClicks: number
    /** Extra orders you knocked on doors for. */
    knocks: number
    /** Kitchen steps you did by hand (including Cook all three). */
    byHand: Record<StageId, number>
    /** Fastest time (s into a run) to reach the whole town; 0 = not yet. */
    bestTownTime: number
    /** The furthest place ever reached (index into REGIONS), over all runs. */
    bestPlace: number
    /** Personal bests (Records): income per second (one-minute average), crumbs from one sale, served in one run, longest run (s). */
    bestIncome: number
    bestSale: Decimal
    bestRunServed: Decimal
    longestRun: number
    /** The last RUNS_LIMIT finished runs, oldest first (Records → run history). */
    runs: RunRecord[]
  }
  /** Wall-clock ms of the last save; used for offline progress. */
  lastSaved: number
}

/** One finished run, recorded when you franchise. */
export interface RunRecord {
  /** Play time (s) when the run ended. */
  end: number
  /** How long the run took (s). */
  time: number
  /** Farthest place reached (index into REGIONS). */
  place: number
  /** Golden Crumbs the sale paid. */
  crumbs: number
  earned: number
  served: number
}

export const RUNS_LIMIT = 100

export const LOG_LIMIT = 40

/** When Mum sells the business: the sale doubles or triples your lifetime crumbs, or the run has lasted long enough. */
export type AutoSellRule = 'double' | 'triple' | 'time'

/** One line of the managers' log: a manager's purchases, merged while they keep buying. */
export interface ManagerLogEntry {
  /** Play time (s) of the latest purchase in this entry. */
  t: number
  who: PerkId
  /** What was bought: "emoji name" → how many. */
  items: Record<string, number>
  /** Money spent. */
  cost: number
}
export const MANAGER_LOG_LIMIT = 40

/** Income history for the Records chart: one point per HISTORY_STEP seconds of play. */
export const HISTORY_STEP = 60
export const HISTORY_LENGTH = 480

export interface HistoryPoint {
  /** Play time (s). */
  t: number
  /** Average income per second over the step. */
  income: number
  /** Franchises so far, to mark resets on the chart. */
  f: number
}

/** A fresh garage: what every run (first game or after a Franchise) starts from. */
export function freshRun(): RunState {
  const items = Object.fromEntries(ITEM_IDS.map((id) => [id, D(0)])) as Record<ItemId, Decimal>
  // Mum's fridge: enough to make the first couple of schnitzels by hand.
  items.meat = D(2)
  items.flour = D(5)
  items.eggs = D(3)
  items.crumbs = D(5)
  items.oil = D(3)

  return {
    money: D(20),
    reputation: D(0),
    items,
    workers: Object.fromEntries(WORKERS.map((w) => [w.id, 0])) as Record<WorkerId, number>,
    upgrades: {},
    regions: Object.fromEntries(
      REGIONS.map((r) => [r.id, { unlocked: r.unlockCost === 0, orders: D(0) }]),
    ) as Record<RegionId, RegionState>,
    facilities: Object.fromEntries(FACILITIES.map((f) => [f.id, 0])) as Record<FacilityId, number>,
    vehicles: Object.fromEntries(VEHICLES.map((v) => [v.id, 0])) as Record<VehicleId, number>,
    shelves: Object.fromEntries(
      INGREDIENT_IDS.map((id) => [id, D(SHOP_SUPPLY_RATE * SHOP_SHELF_SECONDS)]),
    ) as Record<IngredientId, Decimal>,
    stuckFor: 0,
    run: { earned: D(0), time: 0, served: D(0), servedCold: D(0), forkSwaps: {}, managerSpent: {} },
  }
}

export function newGame(now = Date.now()): GameState {
  return {
    version: SAVE_VERSION,
    ...freshRun(),
    settings: { buyAmount: 1, notation: 'short', badgePopups: true, uiScale: 'auto' },
    introSeen: false,
    newsSeen: '',
    finaleSeen: false,
    knockReadyAt: 0,
    crisp: { unlocked: false, temperature: CRISP_TEMP_BEST, oil: 0 },
    autoBuy: { enabled: true, target: 20, reserve: DEFAULT_AUTO_BUY_RESERVE },
    prestige: { unlocked: false, franchises: 0, crumbs: D(0), totalCrumbs: D(0), bonusCrumbs: D(0), perks: {} },
    history: { clock: 0, earned: D(0), points: [] },
    managersOff: {},
    managerSpend: {},
    managerLog: [],
    autoSell: { enabled: false, rule: 'double', minutes: 120, spendCrumbs: false },
    managerClock: 0,
    milestones: {},
    badges: {},
    badgesSeen: 0,
    log: [
      {
        t: 0,
        text: 'You found a frying pan in the garage and a few things in Mum’s fridge. The neighbours look hungry.',
      },
    ],
    stats: { served: D(0), servedCold: D(0), earned: D(0), clicks: 0, playtime: 0, rescues: 0, soldOut: 0, logoClicks: 0, knocks: 0, byHand: { pound: 0, bread: 0, fry: 0 }, bestTownTime: 0, bestPlace: 0, bestIncome: 0, bestSale: D(0), bestRunServed: D(0), longestRun: 0, runs: [] },
    lastSaved: now,
  }
}

export function addLog(state: GameState, text: string): void {
  state.log.unshift({ t: state.stats.playtime, text })
  if (state.log.length > LOG_LIMIT) state.log.length = LOG_LIMIT
}
