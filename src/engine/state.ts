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
  type FitOut,
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
export type Notation = 'short' | 'named' | 'scientific'
/** How often the screen redraws per second (the game itself always runs at full speed). */
export const UPDATE_RATES = [20, 10, 4] as const
export type UpdateRate = (typeof UPDATE_RATES)[number]
/** Effects: everything, only the big moments, or none. */
export type EffectsLevel = 'full' | 'calm' | 'off'
/** How big the whole interface is: 'auto' grows with the window. */
export type UiScale = 'auto' | 'small' | 'normal' | 'large' | 'xl'

export interface Settings {
  buyAmount: BuyAmount
  /** 'short' = 1.23M, 4.56B…; 'named' = 1.23 million…; 'scientific' = 1.23e6 from a thousand up. */
  notation: Notation
  /** Show a pop-up when a badge is earned. */
  badgePopups: boolean
  uiScale: UiScale
  /** Screen redraws per second. */
  updateRate: UpdateRate
  effects: EffectsLevel
  /** Each chapter tints the interface (the garage, the farm, the road, the stars, the Schnitzelverse). */
  chapterColours: boolean
  /** Sound effects volume, 0–1 (ui/sound.ts). */
  soundVolume: number
  /** Chapter tunes volume, 0–1. */
  musicVolume: number
  /** The header's mute button: silences everything, keeps the volumes. */
  soundMuted: boolean
  /** No sound while the game's tab is hidden. */
  muteHidden: boolean
}

export interface RegionState {
  unlocked: boolean
  /** Open orders waiting to be delivered. */
  orders: Decimal
  /** What the food critics think (Chapter 3 on): rolling share of deliveries that arrived hot, 0–1. */
  critic: number
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
    /** The best Golden Crumbs per hour seen this run (selling now ÷ hours so far), from CRUMB_RATE_FROM on. */
    crumbRatePeak: number
    /** The best growth of lifetime crumbs per hour seen this run (see crumbGrowth). */
    growthPeak: number
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
  /** The last chapter we suggested keeping a copy of the save at (a new chapter suggests it once). */
  copyNudgeChapter: number
  /** Kitchen tales (one per chapter) the player has opened, by chapter. */
  talesRead: number[]
  /** The last chapter whose tale was offered on the new-chapter card. */
  taleOffered: number
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
  /** Who spends first each look-around (Mum always goes before them), and whether the next waits until the one before has nothing to do. */
  managerOrder: PerkId[]
  managerStrict: boolean
  /** How each kind of vehicle is fitted out (missing: standard). Kept between runs. */
  fitOuts: Partial<Record<VehicleId, FitOut>>
  /** Fit-outs ever chosen (for a badge). */
  fitOutsTried: Partial<Record<FitOut, true>>
  /** How boldly each manager spends (default Normal). */
  managerSpend: Partial<Record<PerkId, SpendLevel>>
  /** What the managers bought lately, newest last (see automation.ts). */
  managerLog: ManagerLogEntry[]
  /** Mum sells the business for you (manager rank 3). Off until the player switches it on. */
  autoSell: { enabled: boolean; rule: AutoSellRule; percent: number; minutes: number; spendCrumbs: boolean }
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
    /** Star paprika burned on long trips (fold and deep-fold), and schnitzels flown on solar sails without it. */
    paprikaBurned: Decimal
    sailed: Decimal
    /** Fastest time (s into a run) to reach the whole town; 0 = not yet. */
    bestTownTime: number
    /** The furthest place ever reached (index into REGIONS), over all runs. */
    bestPlace: number
    /** Personal bests (Records): income per second (one-minute average), crumbs from one sale, served in one run, longest run (s). */
    bestIncome: number
    bestSale: Decimal
    bestRunServed: Decimal
    longestRun: number
    /** Wall-clock ms the player last kept a copy of the save (download or copy text); 0 = never. */
    lastCopyAt: number
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

/**
 * When Mum sells the business: at the best moment (this run's crumbs per hour
 * has peaked), when the sale adds a share of your lifetime crumbs, or after a set time.
 */
export type AutoSellRule = 'best' | 'share' | 'time'
/** The shares Mum can wait for (percent of lifetime Golden Crumbs). */
export const AUTO_SELL_PERCENTS = [10, 25, 50, 100, 200] as const
/** Crumbs per hour is only trusted after this much of a run (s). */
export const CRUMB_RATE_FROM = 15 * 60
/** “Past its best”: the rate has dropped this far below this run's peak. */
export const CRUMB_RATE_DROP = 0.97
/** The best moment also wants the sale to add at least this share of lifetime crumbs (no selling for crumbs and crumbs). */
export const BEST_SALE_MIN_SHARE = 0.1
/** …and sells at once when the sale adds this many times your lifetime crumbs (best early on). */
export const BEST_SALE_EARLY = 2

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
      REGIONS.map((r) => [r.id, { unlocked: r.unlockCost === 0, orders: D(0), critic: 0 }]),
    ) as Record<RegionId, RegionState>,
    facilities: Object.fromEntries(FACILITIES.map((f) => [f.id, 0])) as Record<FacilityId, number>,
    vehicles: Object.fromEntries(VEHICLES.map((v) => [v.id, 0])) as Record<VehicleId, number>,
    shelves: Object.fromEntries(
      INGREDIENT_IDS.map((id) => [id, D(SHOP_SUPPLY_RATE * SHOP_SHELF_SECONDS)]),
    ) as Record<IngredientId, Decimal>,
    stuckFor: 0,
    run: { earned: D(0), time: 0, served: D(0), servedCold: D(0), forkSwaps: {}, managerSpent: {}, crumbRatePeak: 0, growthPeak: 0 },
  }
}

export function newGame(now = Date.now()): GameState {
  return {
    version: SAVE_VERSION,
    ...freshRun(),
    settings: { buyAmount: 1, notation: 'short', badgePopups: true, uiScale: 'auto', updateRate: 20, effects: 'full', chapterColours: true, soundVolume: 0.4, musicVolume: 0.4, soundMuted: false, muteHidden: true },
    introSeen: false,
    newsSeen: '',
    finaleSeen: false,
    copyNudgeChapter: 1,
    talesRead: [],
    taleOffered: 1,
    knockReadyAt: 0,
    crisp: { unlocked: false, temperature: CRISP_TEMP_BEST, oil: 0 },
    autoBuy: { enabled: true, target: 20, reserve: DEFAULT_AUTO_BUY_RESERVE },
    prestige: { unlocked: false, franchises: 0, crumbs: D(0), totalCrumbs: D(0), bonusCrumbs: D(0), perks: {} },
    history: { clock: 0, earned: D(0), points: [] },
    managersOff: {},
    managerOrder: ['quartermaster', 'farmManager', 'dispatcher', 'familyManager'],
    managerStrict: false,
    fitOuts: {},
    fitOutsTried: {},
    managerSpend: {},
    managerLog: [],
    autoSell: { enabled: false, rule: 'best', percent: 25, minutes: 120, spendCrumbs: false },
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
    stats: { served: D(0), servedCold: D(0), earned: D(0), clicks: 0, playtime: 0, rescues: 0, soldOut: 0, logoClicks: 0, knocks: 0, byHand: { pound: 0, bread: 0, fry: 0 }, paprikaBurned: D(0), sailed: D(0), bestTownTime: 0, bestPlace: 0, bestIncome: 0, bestSale: D(0), bestRunServed: D(0), longestRun: 0, lastCopyAt: 0, runs: [] },
    lastSaved: now,
  }
}

export function addLog(state: GameState, text: string): void {
  state.log.unshift({ t: state.stats.playtime, text })
  if (state.log.length > LOG_LIMIT) state.log.length = LOG_LIMIT
}
