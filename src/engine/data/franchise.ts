// The franchise: Golden Crumbs, perks, the family tree and managers.
import type { RegionId } from './regions'
import type { Effect } from './upgrades'

/** The region that completes Chapter 1 and unlocks the Franchise. */
export const FRANCHISE_UNLOCK_REGION: RegionId = 'town'

// ---------------------------------------------------------------- franchise (prestige layer 1)

/**
 * Frontier sale: reaching your furthest place ever (again) lets you sell for
 * at least this share of your lifetime Golden Crumbs, even when earnings
 * alone wouldn't give one yet (e.g. right after a huge overnight run).
 */
export const FRONTIER_CRUMB_SHARE = 0.05

/**
 * Lifetime earnings are worth floor(sqrt(lifetime money earned / CRUMB_DIVISOR))
 * Golden Crumbs in total; a Franchise pays out the ones not collected yet.
 * Basing it on lifetime earnings means resetting early gives nothing extra:
 * the way to more crumbs is earning faster (going deeper, better perks).
 */
export const CRUMB_DIVISOR = 2500

/**
 * Family pride: every Golden Crumb ever collected adds a little income, so
 * spending crumbs never feels like a loss: +1% per tenfold (×1.01 at 9
 * crumbs, ×1.09 at a billion, ×1.14 at 100 trillion, late in the game).
 * Small on purpose: at 2% the bot finished a day sooner.
 */
export const CRUMB_PRIDE_PER_DECADE = 0.01

export type PerkId =
  | 'familyRecipe'
  | 'headStart'
  | 'auntieRemembers'
  | 'loyalFamily'
  | 'wordOfMouth'
  | 'betterPans'
  | 'fastHands'
  | 'bulkContracts'
  | 'thermos'
  | 'localLegend'
  | 'oldConnections'
  | 'farmDeeds'
  | 'fleetContracts'
  | 'logisticsDegree'
  | 'greenThumb'
  | 'familyManager'
  | 'quartermaster'
  | 'estateAgent'
  | 'farmManager'
  | 'dispatcher'
  | 'crispMaster'
  | 'launchContracts'
  | 'warpContracts'
  | 'nightShift'
  // The family tree: forks (pick one of two) and capstones
  | 'thinAndFast'
  | 'thickAndGolden'
  | 'uncleKitchen'
  | 'uncleRoad'
  | 'gossipQueen'
  | 'pressDarling'
  | 'pigFarmer'
  | 'cropFarmer'
  | 'speedDemon'
  | 'heavyHauler'
  | 'lardSecret'
  | 'unclesWorkshop'
  | 'statue'
  | 'farmEmpire'
  | 'galacticCourier'
  | 'oldFriends'

export interface PerkDef {
  id: PerkId
  name: string
  emoji: string
  /** What one level does, shown in the shop. */
  description: string
  baseCost: number
  costGrowth: number
  maxLevel?: number
  /** A manager: automation you can switch on and off (see automation.ts). */
  manager?: true
  /** Effects at a given level (≥ 1). Start-of-run bonuses are handled in the reset. */
  effects?: (level: number) => Effect[]
  /** Other perks you need first, at least at these levels (see TREE_REQUIRES below). */
  requires?: { perk: PerkId; level: number }[]
  /** One of a pair: owning one side blocks the other (you may swap once per run). */
  fork?: ForkId
  /** The big reward at the bottom of a branch. */
  capstone?: true
  /** Endless perks: the highest level per chapter (index 0 = Chapter 1). */
  chapterCaps?: readonly number[]
}

export type BranchId = 'kitchen' | 'stores' | 'fame' | 'farm' | 'delivery'
export type ForkId = 'grandmaFork' | 'uncleFork' | 'mumFork' | 'grandpaFork' | 'kidFork'

/**
 * The family tree on the Franchise tab: one branch per family member, the
 * manager (their promotion) at the top, then the perks row by row. A row with
 * two perks of the same fork is a pick-one choice.
 */
export interface BranchDef {
  id: BranchId
  person: string
  emoji: string
  /** What this branch is about. */
  title: string
  manager: PerkId
  /** One entry per TREE_ROWS row below the manager (same count in every branch, so the rows line up). */
  rows: PerkId[][]
}

/** The rows of the tree, the same in every branch: the manager on top, then these. */
export const TREE_ROWS = ['First step', 'Second step', 'Third step', 'Pick one', 'Capstone'] as const

export const BRANCHES: BranchDef[] = [
  {
    id: 'kitchen',
    person: 'Grandma',
    emoji: '👵',
    title: 'The kitchen',
    manager: 'familyManager',
    rows: [['familyRecipe'], ['loyalFamily', 'betterPans'], ['fastHands', 'crispMaster'], ['thinAndFast', 'thickAndGolden'], ['lardSecret']],
  },
  {
    id: 'stores',
    person: 'Uncle',
    emoji: '🔨',
    title: 'Stores and money',
    manager: 'quartermaster',
    rows: [['headStart'], ['auntieRemembers', 'nightShift'], ['bulkContracts'], ['uncleKitchen', 'uncleRoad'], ['unclesWorkshop']],
  },
  {
    id: 'fame',
    person: 'Mum',
    emoji: '👩',
    title: 'Fame and places',
    manager: 'estateAgent',
    rows: [['wordOfMouth'], ['localLegend'], ['oldConnections'], ['gossipQueen', 'pressDarling'], ['statue']],
  },
  {
    id: 'farm',
    person: 'Grandpa',
    emoji: '👴',
    title: 'The farm',
    manager: 'farmManager',
    rows: [['farmDeeds'], ['greenThumb'], ['oldFriends'], ['pigFarmer', 'cropFarmer'], ['farmEmpire']],
  },
  {
    id: 'delivery',
    person: 'The kid',
    emoji: '🚲',
    title: 'Deliveries',
    manager: 'dispatcher',
    rows: [['thermos'], ['fleetContracts', 'logisticsDegree'], ['launchContracts', 'warpContracts'], ['speedDemon', 'heavyHauler'], ['galacticCourier']],
  },
]

/** Endless perks stop at these levels per chapter: far beyond normal play, only a wall for grinding one chapter forever. */
export const CHAPTER_CAPS = [10, 20, 40, 75, 150] as const
/** Endless perks get dearer faster past this level (each level costs 1.5× more again), so late-game crumbs don't run away. */
export const PERK_SOFT_LEVEL = 25
export const PERK_SOFT_GROWTH = 1.5

/** Permanent upgrades bought with Golden Crumbs. They survive every franchise. */
/** Manager ranks (perk levels 1–3). Each rank costs this many times the one before. */
export const MANAGER_RANKS = ['On the job', 'Old hand', 'Runs the show'] as const
export const MANAGER_RANK_COST_GROWTH = 1000

export const PERKS: PerkDef[] = [
  {
    id: 'familyRecipe',
    name: 'The family recipe',
    emoji: '📜',
    description: 'Prices ×1.25 per level',
    baseCost: 1,
    costGrowth: 2,
    effects: (l) => [{ kind: 'price', mult: 1.25 ** l }],
  },
  {
    id: 'headStart',
    name: 'Head start',
    emoji: '💵',
    description: 'Start each run with more money ($50, then ×5 per level)',
    baseCost: 1,
    costGrowth: 2,
    maxLevel: 6,
  },
  {
    id: 'auntieRemembers',
    name: 'Auntie remembers',
    emoji: '📝',
    description: "Start each run with Auntie's shopping list",
    baseCost: 1,
    costGrowth: 1,
    maxLevel: 1,
  },
  {
    id: 'loyalFamily',
    name: 'Loyal family',
    emoji: '👪',
    description: 'Start each run with +1 of every helper per level',
    baseCost: 1,
    costGrowth: 3,
    maxLevel: 10,
  },
  {
    id: 'wordOfMouth',
    name: 'Word of mouth',
    emoji: '🗣️',
    description: 'Orders ×1.25 per level',
    baseCost: 2,
    costGrowth: 2,
    effects: (l) => [{ kind: 'orders', mult: 1.25 ** l }],
  },
  {
    id: 'betterPans',
    name: 'Better everything',
    emoji: '🍳',
    description: 'Pounding, breading and frying ×1.25 per level',
    baseCost: 2,
    costGrowth: 2,
    effects: (l) => [{ kind: 'kitchen', mult: 1.25 ** l }],
  },
  {
    id: 'fastHands',
    name: 'Fast hands',
    emoji: '👐',
    description: 'Your own clicks ×2 per level',
    baseCost: 1,
    costGrowth: 2,
    maxLevel: 5,
    effects: (l) => [{ kind: 'click', mult: 2 ** l }],
  },
  {
    id: 'bulkContracts',
    name: 'Bulk contracts',
    emoji: '🤝',
    description: 'Shop packs ×1.5 bigger per level, same price',
    baseCost: 3,
    costGrowth: 3,
    maxLevel: 3,
    effects: (l) => [{ kind: 'packSize', mult: 1.5 ** l }],
  },
  {
    id: 'thermos',
    name: 'Grandpa’s thermos bags',
    emoji: '🎒',
    description: 'Schnitzel cools 25% slower per level',
    baseCost: 2,
    costGrowth: 2,
    maxLevel: 3,
    effects: (l) => [{ kind: 'cooling', mult: 0.75 ** l }],
  },
  {
    id: 'localLegend',
    name: 'Local legend',
    emoji: '🏅',
    description: 'Reputation gain ×1.5 per level',
    baseCost: 2,
    costGrowth: 2,
    effects: (l) => [{ kind: 'reputation', mult: 1.5 ** l }],
  },
  {
    id: 'oldConnections',
    name: 'Old connections',
    emoji: '📇',
    description: 'Start each run with one more place already unlocked per level',
    baseCost: 3,
    costGrowth: 3,
    maxLevel: 3,
  },
  {
    id: 'farmDeeds',
    name: 'Farm deeds',
    emoji: '🗝️',
    description: 'Start each run with +1 of every farm building per level',
    baseCost: 10,
    costGrowth: 3,
    maxLevel: 10,
  },
  {
    id: 'greenThumb',
    name: 'Green thumb',
    emoji: '🌱',
    description: 'Every farm building ×1.25 per level',
    baseCost: 5,
    costGrowth: 2,
    effects: (l) => [
      { kind: 'facility', group: 'field', mult: 1.25 ** l },
      { kind: 'facility', group: 'animal', mult: 1.25 ** l },
      { kind: 'facility', group: 'processor', mult: 1.25 ** l },
    ],
  },
  {
    id: 'fleetContracts',
    name: 'Fleet contracts',
    emoji: '📑',
    description: 'Start each run with +1 of every vehicle per level',
    baseCost: 40,
    costGrowth: 3,
    maxLevel: 5,
  },
  {
    id: 'logisticsDegree',
    name: 'Logistics degree',
    emoji: '🎓',
    description: 'Fleet capacity ×1.25 per level',
    baseCost: 15,
    costGrowth: 2,
    effects: (l) => [{ kind: 'fleet', mult: 1.25 ** l }],
  },
  {
    id: 'crispMaster',
    name: 'Crisp master',
    emoji: '🥇',
    description: 'Crispness skill +0.03 per level',
    baseCost: 5,
    costGrowth: 3,
    effects: (l) => [{ kind: 'crisp', add: 0.03 * l }],
  },
  {
    id: 'nightShift',
    name: 'Night shift',
    emoji: '🌙',
    description: 'The family covers for you 4 hours longer while you’re away, per level',
    baseCost: 3,
    costGrowth: 3,
    maxLevel: 4,
  },
  {
    id: 'launchContracts',
    name: 'Launch contracts',
    emoji: '🧑‍🚀',
    description: 'Start each run with +1 of every space vehicle per level',
    baseCost: 200,
    costGrowth: 3,
    maxLevel: 3,
  },
  {
    id: 'warpContracts',
    name: 'Warp contracts',
    emoji: '🌠',
    description: 'Start each run with +1 warp freighter per level',
    baseCost: 1_000_000,
    costGrowth: 5,
    maxLevel: 3,
  },
  // The family tree: forks (pick one of two; both sides cost the same) …
  {
    id: 'thinAndFast',
    name: 'Thin and fast',
    emoji: '🥢',
    description: 'Grandma’s way, part one: pound them thinner, fry them quicker. Kitchen ×1.1 per level',
    baseCost: 200,
    costGrowth: 5,
    maxLevel: 5,
    fork: 'grandmaFork',
    effects: (l) => [{ kind: 'kitchen', mult: 1.1 ** l }],
  },
  {
    id: 'thickAndGolden',
    name: 'Thick and golden',
    emoji: '🥇',
    description: 'Grandma’s way, part two: a proper cutlet, crust like armour. Prices ×1.08 per level',
    baseCost: 200,
    costGrowth: 5,
    maxLevel: 5,
    fork: 'grandmaFork',
    effects: (l) => [{ kind: 'price', mult: 1.08 ** l }],
  },
  {
    id: 'uncleKitchen',
    name: 'Uncle stays in the kitchen',
    emoji: '🔨',
    description: 'He swings the mallet and keeps everyone in rhythm. Kitchen ×1.08 per level',
    baseCost: 100,
    costGrowth: 5,
    maxLevel: 5,
    fork: 'uncleFork',
    effects: (l) => [{ kind: 'kitchen', mult: 1.08 ** l }],
  },
  {
    id: 'uncleRoad',
    name: 'Uncle takes the van',
    emoji: '🚐',
    description: 'He knows every shortcut and every pothole. Helpers deliver ×1.2 and fleet ×1.05 per level',
    baseCost: 100,
    costGrowth: 5,
    maxLevel: 5,
    fork: 'uncleFork',
    effects: (l) => [
      { kind: 'speed', task: 'deliver', mult: 1.2 ** l },
      { kind: 'fleet', mult: 1.05 ** l },
    ],
  },
  {
    id: 'gossipQueen',
    name: 'Gossip queen',
    emoji: '🗣️',
    description: 'Mum tells everyone. Then everyone tells everyone. Orders ×1.1 per level',
    baseCost: 150,
    costGrowth: 5,
    maxLevel: 5,
    fork: 'mumFork',
    effects: (l) => [{ kind: 'orders', mult: 1.1 ** l }],
  },
  {
    id: 'pressDarling',
    name: 'Darling of the press',
    emoji: '📰',
    description: 'Mum does interviews. The papers love her. Reputation ×1.15 per level',
    baseCost: 150,
    costGrowth: 5,
    maxLevel: 5,
    fork: 'mumFork',
    effects: (l) => [{ kind: 'reputation', mult: 1.15 ** l }],
  },
  {
    id: 'pigFarmer',
    name: 'Pig farmer at heart',
    emoji: '🐖',
    description: 'Grandpa’s favourite: the animals. Pigs and hens ×1.15, processing ×1.05 per level',
    baseCost: 250,
    costGrowth: 5,
    maxLevel: 5,
    fork: 'grandpaFork',
    effects: (l) => [
      { kind: 'facility', group: 'animal', mult: 1.15 ** l },
      { kind: 'facility', group: 'processor', mult: 1.05 ** l },
    ],
  },
  {
    id: 'cropFarmer',
    name: 'Crop farmer at heart',
    emoji: '🌾',
    description: 'Grandpa’s other favourite: the fields. Fields ×1.15, processing ×1.05 per level',
    baseCost: 250,
    costGrowth: 5,
    maxLevel: 5,
    fork: 'grandpaFork',
    effects: (l) => [
      { kind: 'facility', group: 'field', mult: 1.15 ** l },
      { kind: 'facility', group: 'processor', mult: 1.05 ** l },
    ],
  },
  {
    id: 'speedDemon',
    name: 'Speed demon',
    emoji: '💨',
    description: 'The kid rides like the wind. Schnitzel cools 10% slower on the way, per level',
    baseCost: 400,
    costGrowth: 5,
    maxLevel: 5,
    fork: 'kidFork',
    effects: (l) => [{ kind: 'cooling', mult: 0.9 ** l }],
  },
  {
    id: 'heavyHauler',
    name: 'Heavy hauler',
    emoji: '📦',
    description: 'The kid packs the vans like a game of Tetris. Fleet ×1.1 per level',
    baseCost: 400,
    costGrowth: 5,
    maxLevel: 5,
    fork: 'kidFork',
    effects: (l) => [{ kind: 'fleet', mult: 1.1 ** l }],
  },
  {
    id: 'oldFriends',
    name: 'Grandpa’s old friends',
    emoji: '🧑‍🌾',
    description: 'Start each run with the family farm hands already on the farm (Pavel, Jarmila, Franta and Bára)',
    baseCost: 50,
    costGrowth: 1,
    maxLevel: 1,
  },
  // … and capstones: the big reward at the bottom of each branch.
  {
    id: 'lardSecret',
    name: 'Grandma’s lard secret',
    emoji: '🫙',
    description: 'She finally writes it down. Prices ×2.5',
    baseCost: 100_000_000_000,
    costGrowth: 1,
    maxLevel: 1,
    capstone: true,
    effects: () => [{ kind: 'price', mult: 2.5 }],
  },
  {
    id: 'unclesWorkshop',
    name: 'Uncle’s workshop',
    emoji: '🧰',
    description: 'A shed full of tools he built himself. Kitchen ×2, corner shop ×3',
    baseCost: 100_000_000,
    costGrowth: 1,
    maxLevel: 1,
    capstone: true,
    effects: () => [
      { kind: 'kitchen', mult: 2 },
      { kind: 'shopSupply', mult: 3 },
    ],
  },
  {
    id: 'statue',
    name: 'A statue in the town square',
    emoji: '🗽',
    description: 'You, holding a schnitzel, cast in bronze. Reputation ×3, orders ×1.5',
    baseCost: 10_000_000_000,
    costGrowth: 1,
    maxLevel: 1,
    capstone: true,
    effects: () => [
      { kind: 'reputation', mult: 3 },
      { kind: 'orders', mult: 1.5 },
    ],
  },
  {
    id: 'farmEmpire',
    name: 'Grandpa’s farm empire',
    emoji: '🏰',
    description: 'The farm has its own flag now. Every farm building ×3',
    baseCost: 300_000_000,
    costGrowth: 1,
    maxLevel: 1,
    capstone: true,
    effects: () => [
      { kind: 'facility', group: 'field', mult: 3 },
      { kind: 'facility', group: 'animal', mult: 3 },
      { kind: 'facility', group: 'processor', mult: 3 },
    ],
  },
  {
    id: 'galacticCourier',
    name: 'The galactic courier',
    emoji: '🛰️',
    description: 'The kid’s company, with your name on every hull. Fleet ×3, cooling ÷2',
    baseCost: 1_000_000_000,
    costGrowth: 1,
    maxLevel: 1,
    capstone: true,
    effects: () => [
      { kind: 'fleet', mult: 3 },
      { kind: 'cooling', mult: 0.5 },
    ],
  },
  // Managers: they keep buying while you're away. Each one buys only what
  // costs at most MANAGER_SPEND_SHARE of your money, so they never empty the till.
  {
    id: 'familyManager',
    name: 'Grandma, head of staff',
    emoji: '👵',
    description:
      'Hires helpers for whichever step is slowest, while customers want more. If equipment for that step does more per dollar, she buys that instead (or saves for it when it’s a few minutes away)',
    baseCost: 2,
    costGrowth: MANAGER_RANK_COST_GROWTH,
    maxLevel: MANAGER_RANKS.length,
    manager: true,
  },
  {
    id: 'quartermaster',
    name: 'Uncle, the quartermaster',
    emoji: '🧔',
    description:
      'Goes through all the equipment from the cheapest up and buys whatever is ready, for the kitchen, the shop, the farm and the fleet, as long as it costs at most a quarter of your money. Nothing useful stays on the shelf for long',
    baseCost: 3,
    costGrowth: MANAGER_RANK_COST_GROWTH,
    maxLevel: MANAGER_RANKS.length,
    manager: true,
  },
  {
    id: 'estateAgent',
    name: 'Mum, the estate agent',
    emoji: '👩',
    description:
      'Unlocks the next place as soon as you can. When it’s only a few minutes of income away, she asks the others to wait so the money gets there sooner',
    baseCost: 4,
    costGrowth: MANAGER_RANK_COST_GROWTH,
    maxLevel: MANAGER_RANKS.length,
    manager: true,
  },
  {
    id: 'farmManager',
    name: 'Grandpa, farm boss',
    emoji: '👴',
    description:
      'Builds whichever farm building holds back the shortest ingredient. If farm equipment for it does more per dollar, he buys that instead (or saves for it when it’s a few minutes away)',
    baseCost: 10,
    costGrowth: MANAGER_RANK_COST_GROWTH,
    maxLevel: MANAGER_RANKS.length,
    manager: true,
  },
  {
    id: 'dispatcher',
    name: 'The kid, now a dispatcher',
    emoji: '🧑‍💼',
    description:
      'First makes sure a vehicle can reach every place you deliver to. Then, while deliveries fall behind the kitchen, adds whichever vehicle carries the most per dollar, so hot schnitzel never waits for a ride',
    baseCost: 40,
    costGrowth: MANAGER_RANK_COST_GROWTH,
    maxLevel: MANAGER_RANKS.length,
    manager: true,
  },
]


/** How boldly a manager spends: a multiple of their usual share, and the rank that allows it. */
export type SpendLevel = 'careful' | 'normal' | 'bold' | 'allIn'
export const SPEND_LEVELS: { id: SpendLevel; name: string; mult: number; rank: number }[] = [
  { id: 'careful', name: 'Careful', mult: 0.5, rank: 1 },
  { id: 'normal', name: 'Normal', mult: 1, rank: 1 },
  { id: 'bold', name: 'Bold', mult: 2.5, rank: 2 },
  { id: 'allIn', name: 'All in', mult: 5, rank: 3 },
]

/** What each rank adds, per manager (rank 1 is the perk's own description). */
export const MANAGER_RANK_TEXT: Partial<Record<PerkId, [string, string]>> = {
  familyManager: ['Hires ten at a time when she can, and may spend boldly', 'May go all in'],
  quartermaster: ['Buys the biggest piece he can afford first, instead of the cheapest, and may spend boldly', 'May go all in'],
  estateAgent: [
    'Asks the others to save for a place up to 15 minutes away (not 5), and may spend boldly',
    'Can sell the business for you when a rule you set is met (off until you switch it on)',
  ],
  farmManager: ['Builds ten at a time when he can, and may spend boldly', 'May go all in'],
  dispatcher: ['Buys ten vehicles at a time when he can, and may spend boldly', 'May go all in'],
}

const need = (...pairs: [PerkId, number][]) => pairs.map(([perk, level]) => ({ perk, level }))
/** What each perk in the family tree needs first. Two cross-links join branches: crisp needs the farm, the statue needs the recipe. */
const TREE_REQUIRES: Partial<Record<PerkId, { perk: PerkId; level: number }[]>> = {
  loyalFamily: need(['familyRecipe', 1]),
  fastHands: need(['familyRecipe', 1]),
  betterPans: need(['familyRecipe', 2]),
  crispMaster: need(['betterPans', 3], ['greenThumb', 1]),
  thinAndFast: need(['familyRecipe', 10], ['betterPans', 10]),
  thickAndGolden: need(['familyRecipe', 10], ['betterPans', 10]),
  lardSecret: need(['familyRecipe', 25], ['betterPans', 25], ['crispMaster', 10]),
  auntieRemembers: need(['headStart', 1]),
  nightShift: need(['headStart', 2]),
  bulkContracts: need(['auntieRemembers', 1]),
  uncleKitchen: need(['bulkContracts', 3], ['headStart', 4]),
  uncleRoad: need(['bulkContracts', 3], ['headStart', 4]),
  unclesWorkshop: need(['headStart', 6], ['bulkContracts', 3], ['nightShift', 4]),
  localLegend: need(['wordOfMouth', 2]),
  oldConnections: need(['localLegend', 1]),
  gossipQueen: need(['wordOfMouth', 10], ['localLegend', 10]),
  pressDarling: need(['wordOfMouth', 10], ['localLegend', 10]),
  statue: need(['wordOfMouth', 25], ['localLegend', 25], ['oldConnections', 3], ['familyRecipe', 15]),
  greenThumb: need(['farmDeeds', 1]),
  oldFriends: need(['greenThumb', 3]),
  pigFarmer: need(['greenThumb', 8], ['farmDeeds', 5]),
  cropFarmer: need(['greenThumb', 8], ['farmDeeds', 5]),
  farmEmpire: need(['greenThumb', 25], ['farmDeeds', 10]),
  fleetContracts: need(['thermos', 1]),
  logisticsDegree: need(['thermos', 2]),
  speedDemon: need(['logisticsDegree', 8]),
  heavyHauler: need(['logisticsDegree', 8]),
  launchContracts: need(['fleetContracts', 3]),
  warpContracts: need(['launchContracts', 3]),
  galacticCourier: need(['logisticsDegree', 25], ['fleetContracts', 5]),
}
for (const perk of PERKS) {
  perk.requires = TREE_REQUIRES[perk.id]
  // Endless perks get chapter caps.
  if (perk.maxLevel === undefined) perk.chapterCaps = CHAPTER_CAPS
}

/** Perks that only appear once the farm (Chapter 2) is unlocked. */
export const CHAPTER2_PERKS: PerkId[] = ['farmDeeds', 'greenThumb', 'farmManager', 'oldFriends', 'pigFarmer', 'cropFarmer', 'farmEmpire']
/** Perks that only appear once the fleet (Chapter 3) is unlocked. */
export const CHAPTER3_PERKS: PerkId[] = ['fleetContracts', 'logisticsDegree', 'dispatcher', 'speedDemon', 'heavyHauler', 'galacticCourier']
/** Perks that only appear in Chapter 4 (the stars). */
export const CHAPTER4_PERKS: PerkId[] = ['launchContracts']
/** Perks that only appear in Chapter 5 (the Schnitzelverse). */
export const CHAPTER5_PERKS: PerkId[] = ['warpContracts']
export const HEAD_START_GROWTH = 5

export const FRANCHISE_MESSAGES = [
  'You sold the garage kitchen to a nice couple from the next street. The recipe stays in the family.',
  'Another franchise signed. The garage is empty again, but your name is on a sign somewhere.',
  'New garage, same mallet. The family knows the drill by now.',
]
