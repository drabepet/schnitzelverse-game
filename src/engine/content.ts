// All game content lives here as plain data, so adding ingredients, staff,
// upgrades or regions never needs engine changes.
import { buildFarmGear, type FarmChainId, type FarmGearId } from './farmGear'
import type { GameState } from './state'

// ---------------------------------------------------------------- items

export type IngredientId = 'meat' | 'flour' | 'eggs' | 'crumbs' | 'oil'
export type IntermediateId = 'cutlet' | 'breaded' | 'hot' | 'cold'
/** Raw farm goods (Chapter 2). */
export type FarmGoodId = 'wheat' | 'seeds' | 'pigs'
export type ItemId = IngredientId | IntermediateId | FarmGoodId

export const INGREDIENT_IDS: IngredientId[] = ['meat', 'flour', 'eggs', 'crumbs', 'oil']
export const FARM_GOOD_IDS: FarmGoodId[] = ['wheat', 'seeds', 'pigs']
export const ITEM_IDS: ItemId[] = [...INGREDIENT_IDS, 'cutlet', 'breaded', 'hot', 'cold', ...FARM_GOOD_IDS]

export interface ItemMeta {
  name: string
  emoji: string
}

export const ITEMS: Record<ItemId, ItemMeta> = {
  meat: { name: 'Pork loin', emoji: '🥩' },
  flour: { name: 'Flour', emoji: '🫙' },
  eggs: { name: 'Eggs', emoji: '🥚' },
  crumbs: { name: 'Breadcrumbs', emoji: '🥖' },
  oil: { name: 'Frying oil', emoji: '🫗' },
  cutlet: { name: 'Pounded cutlets', emoji: '🫓' },
  breaded: { name: 'Breaded cutlets', emoji: '🍘' },
  hot: { name: 'Hot schnitzel', emoji: '🔥' },
  cold: { name: 'Cold schnitzel', emoji: '🧊' },
  wheat: { name: 'Wheat', emoji: '🌾' },
  seeds: { name: 'Sunflower seeds', emoji: '🌻' },
  pigs: { name: 'Pigs', emoji: '🐖' },
}

export interface ShopOffer {
  item: IngredientId
  packName: string
  packSize: number
  packPrice: number
}

/** The corner shop: the only ingredient source in the garage phase. */
export const SHOP: Record<IngredientId, ShopOffer> = {
  meat: { item: 'meat', packName: 'tray of 4 slices', packSize: 4, packPrice: 6 },
  flour: { item: 'flour', packName: 'bag', packSize: 20, packPrice: 2 },
  eggs: { item: 'eggs', packName: 'box of 10', packSize: 10, packPrice: 3 },
  crumbs: { item: 'crumbs', packName: 'bag', packSize: 15, packPrice: 2 },
  oil: { item: 'oil', packName: 'bottle', packSize: 10, packPrice: 4 },
}

// ---------------------------------------------------------------- kitchen

export type StageId = 'pound' | 'bread' | 'fry'
/** Anything a worker (or a click) can do. */
export type Task = StageId | 'deliver'
export const STAGE_IDS: StageId[] = ['pound', 'bread', 'fry']

export interface StageDef {
  id: StageId
  name: string
  verb: string
  emoji: string
  inputs: Partial<Record<ItemId, number>>
  output: ItemId
}

export const STAGES: Record<StageId, StageDef> = {
  pound: { id: 'pound', name: 'Pound', verb: 'Pound', emoji: '🔨', inputs: { meat: 1 }, output: 'cutlet' },
  bread: {
    id: 'bread',
    name: 'Bread',
    verb: 'Bread',
    emoji: '🥣',
    inputs: { cutlet: 1, flour: 1, eggs: 1, crumbs: 1 },
    output: 'breaded',
  },
  fry: { id: 'fry', name: 'Fry', verb: 'Fry', emoji: '🍳', inputs: { breaded: 1, oil: 1 }, output: 'hot' },
}

/**
 * Cook to order, automatically: staff stop a step once a few seconds of what
 * the next step can use are waiting (BUFFER_SECONDS), but never fewer than
 * MIN_BUFFERS. Enough to keep the next step busy, not so much that schnitzel
 * goes cold. Manual clicks ignore it.
 */
export const MIN_BUFFERS: Record<StageId, number> = { pound: 10, bread: 10, fry: 5 }
export const BUFFER_SECONDS = 3

/** Which task consumes each stage's output. */
export const NEXT_TASK: Record<StageId, Task> = { pound: 'bread', bread: 'fry', fry: 'deliver' }

/** Mum's fridge: if you are broke and cannot cook, Mum helps out after this long. */
export const RESCUE_AFTER_SECONDS = 5
/** Ingredients Mum puts in the fridge, per missing ingredient. */
export const RESCUE_AMOUNT = 2
export const RESCUE_MESSAGES = [
  'Mum: “You can’t run a business on an empty fridge.” She restocked the basics.',
  'Mum left a bag of groceries by the garage door. No note. Just a look.',
  'Mum: “Again? Pay me back in schnitzel.” The fridge is full-ish.',
]

/** Fraction of hot schnitzel stock that goes cold per second (before upgrades). */
export const BASE_COOLING = 0.01
/** Cold schnitzel sells for this fraction of the price. */
export const COLD_PRICE_FACTOR = 0.4
export const HOT_REPUTATION = 1
export const COLD_REPUTATION = 0.2

// ---------------------------------------------------------------- requirements

export interface Requirement {
  reputation?: number
  franchises?: number
  /** Reached this place in this run. */
  place?: RegionId
}

// ---------------------------------------------------------------- staff

export type WorkerId = 'uncle' | 'grandma' | 'cousin' | 'kid'

export interface WorkerDef {
  id: WorkerId
  name: string
  emoji: string
  flavor: string
  task: Task
  /** Units per second for one worker, before upgrades. */
  rate: number
  baseCost: number
  costGrowth: number
  requires?: Requirement
}

export const WORKERS: WorkerDef[] = [
  {
    id: 'uncle',
    name: 'Uncle with a mallet',
    emoji: '👨‍🦳',
    flavor: 'Retired butcher. Still keeps the mallet in his coat.',
    task: 'pound',
    rate: 0.4,
    baseCost: 15,
    costGrowth: 1.15,
  },
  {
    id: 'grandma',
    name: 'Grandma',
    emoji: '👵',
    flavor: 'Never measures anything. Never needs to.',
    task: 'bread',
    rate: 0.35,
    baseCost: 25,
    costGrowth: 1.15,
  },
  {
    id: 'cousin',
    name: 'Cousin at the stove',
    emoji: '🧑‍🍳',
    flavor: 'Burned his eyebrows off once. Learned a lot that day.',
    task: 'fry',
    rate: 0.35,
    baseCost: 35,
    costGrowth: 1.15,
  },
  {
    id: 'kid',
    name: 'Kid on a bike',
    emoji: '🚲',
    flavor: 'Paid in pocket money and the occasional schnitzel.',
    task: 'deliver',
    rate: 0.3,
    baseCost: 30,
    costGrowth: 1.15,
  },
]

// ---------------------------------------------------------------- upgrades

export type Effect =
  | { kind: 'speed'; task: Task; mult: number }
  | { kind: 'cooling'; mult: number }
  | { kind: 'packSize'; mult: number }
  | { kind: 'price'; mult: number }
  | { kind: 'orders'; mult: number }
  | { kind: 'autoBuy' }
  /** All three kitchen steps (not delivery). */
  | { kind: 'kitchen'; mult: number }
  /** Manual clicks only. */
  | { kind: 'click'; mult: number }
  | { kind: 'reputation'; mult: number }
  /** Farm buildings of one group (Chapter 2). */
  | { kind: 'facility'; group: FacilityGroup; mult: number }
  /** Fleet vehicle capacity (Chapter 3). */
  | { kind: 'fleet'; mult: number }
  /** Crispness skill, added up (see CRISP_*). */
  | { kind: 'crisp'; add: number }
  /** How much the corner shop can sell per second. */
  | { kind: 'shopSupply'; mult: number }
  /** One kind of farm building (farm gear, see farmGear.ts). */
  | { kind: 'building'; facility: FacilityId; mult: number }

/** The corner shop grows with every place you reach (from the country on), like the farm gear. */
export const SHOP_PLACES = [
  'country',
  'continent',
  'planet',
  'orbit',
  'moon',
  'mars',
  'belt',
  'jupiter',
  'solar',
  'nextStar',
  'cluster',
  'milkyWay',
  'nextGalaxy',
  'localGroup',
  'universe',
  'schnitzelverse',
] as const satisfies readonly RegionId[]
export type ShopRungId = `shop_${(typeof SHOP_PLACES)[number]}`

export type UpgradeId =
  | FarmGearId
  | ShopRungId
  | 'heavyMallet'
  | 'chalkboard'
  | 'biggerVan'
  | 'wholesaleCard'
  | 'secondVan'
  | 'miniMarket'
  | 'nightDeliveries'
  | 'supermarket'
  | 'regionalDepot'
  | 'groceryChain'
  | 'hypermarket'
  | 'galacticGrocer'
  | 'lemonWedges'
  | 'flyers'
  | 'streetGroup'
  | 'threeBowls'
  | 'castIronPan'
  | 'foil'
  | 'shoppingList'
  | 'bikeBasket'
  | 'neonSign'
  | 'cashAndCarry'
  | 'thermoBox'
  | 'deepFryer'
  | 'tenderizer'
  | 'breadingStation'
  | 'cargoBike'
  | 'lard'
  | 'tractor'
  | 'betterFeed'
  | 'industrialMill'
  | 'deliveryVan'
  | 'industrialKitchen'
  | 'reeferTrucks'
  | 'gpsRouting'
  | 'onboardFryers'
  | 'logisticsHub'
  | 'megaFarms'
  | 'doubleDip'
  | 'clarifiedButter'
  | 'restingRack'
  | 'pankoImport'
  | 'nitrogenTunnel'
  | 'crunchLab'
  | 'zeroGFryer'
  | 'hydroponics'
  | 'spaceElevator'
  | 'orbitalAds'
  | 'cosmicCrumbs'
  | 'dysonFryer'
  | 'teleportPantry'
  | 'orbitalMirrors'
  | 'cloneVats'
  | 'matterReplicators'
  | 'terraforming'
  | 'tenderizingCrew'
  | 'hydraulicPresses'
  | 'poundingRobots'
  | 'gravitonFlatteners'
  | 'breadingLine'
  | 'crumbCascade'
  | 'breadingBots'
  | 'crumbNebula'
  | 'fryBrigade'
  | 'industrialFryers'
  | 'fryOTrons'
  | 'plasmaFryers'
  | 'combineHarvesters'
  | 'megaBarns'
  | 'automatedPlants'
  // Chapter 5: the Schnitzelverse
  | 'singularityTenderizer'
  | 'crumbGalaxy'
  | 'supernovaFryers'
  | 'stasisCrates'
  | 'warpCoils'
  | 'constellationAds'
  | 'pigPlanets'
  | 'wheatWorlds'
  | 'nebulaMills'
  | 'quantumCrunch'
  | 'neutronStarFryer'
  | 'faceInTheStars'
  | 'michelinStars'
  | 'intergalacticGrocer'

export interface UpgradeDef {
  id: UpgradeId
  name: string
  emoji: string
  description: string
  cost: number
  requires?: Requirement
  /** Only shown once crispness is unlocked. */
  quality?: true
  /** Only shown in Chapter 4 (the stars). */
  space?: true
  /** Only shown in Chapter 5 (beyond the Solar System). Also set `space`. */
  deep?: true
  /** Farm gear for one building (shown on its card). */
  building?: FacilityId
  /** A farm hand for one chain (shown on the chain's card). */
  chain?: FarmChainId
  effects: Effect[]
}

/**
 * Crew promotions: each kitchen step has a ladder of equipment. Buying one
 * multiplies that step and renames its crew (see names.ts), e.g. Uncle with a
 * mallet → Tenderizing crew → Hydraulic presses → Pounding robots → Graviton flatteners.
 */
export interface CrewUpgrade {
  id: UpgradeId
  /** The equipment's name in the shop. */
  name: string
  task: StageId
  /** The crew's new name, emoji and joke once this is bought. */
  crew: { name: string; emoji: string; flavor: string }
  description: string
  mult: number
  cost: number
  requires: Requirement
  space?: true
  deep?: true
}

const LEVEL_A = { franchises: 2, reputation: 100_000 }
const LEVEL_B = { franchises: 3, reputation: 2_000_000 }
const LEVEL_C = { franchises: 5, reputation: 50_000_000 }
const LEVEL_D = { reputation: 5_000_000_000 }
const LEVEL_E = { reputation: 2e18 }

export const CREW_UPGRADES: CrewUpgrade[] = [
  // Pound
  {
    id: 'tenderizingCrew', name: 'Tenderizing crew', task: 'pound', mult: 3, cost: 2_000_000, requires: LEVEL_A,
    description: 'Uncle trains a whole crew to swing the mallet his way. Pounding ×3',
    crew: { name: 'Tenderizing crew', emoji: '👷', flavor: 'Trained by Uncle himself. They all hold the mallet the same way.' },
  },
  {
    id: 'hydraulicPresses', name: 'Hydraulic presses', task: 'pound', mult: 4, cost: 25_000_000, requires: LEVEL_B,
    description: 'Forty tonnes of gentle persuasion. Pounding ×4',
    crew: { name: 'Hydraulic press', emoji: '🗜️', flavor: 'Forty tonnes of gentle persuasion. Uncle runs the big red button.' },
  },
  {
    id: 'poundingRobots', name: 'Pounding robots', task: 'pound', mult: 5, cost: 600_000_000, requires: LEVEL_C,
    description: 'Robot arms with Uncle’s exact swing, uploaded. Pounding ×5',
    crew: { name: 'Pounding robot', emoji: '🦾', flavor: 'Its firmware is called “Uncle 2.0”. It hums polkas.' },
  },
  {
    id: 'gravitonFlatteners', name: 'Graviton flatteners', task: 'pound', mult: 8, cost: 60_000_000_000, requires: LEVEL_D, space: true,
    description: 'Bends spacetime until the cutlet is exactly 4 mm thin. Pounding ×8',
    crew: { name: 'Graviton flattener', emoji: '🌀', flavor: 'Bends spacetime until the cutlet is exactly 4 mm thin.' },
  },
  {
    id: 'singularityTenderizer', name: 'Singularity tenderizer', task: 'pound', mult: 8, cost: 2e19, requires: LEVEL_E, space: true, deep: true,
    description: 'A tiny black hole, on a leash. Cutlets come out one atom thin. Pounding ×8',
    crew: { name: 'Singularity tenderizer', emoji: '🕳️', flavor: 'A pet black hole. Uncle feeds it the bones.' },
  },
  // Bread
  {
    id: 'breadingLine', name: 'Breading line', task: 'bread', mult: 3, cost: 2_500_000, requires: LEVEL_A,
    description: 'Flour, egg, crumbs on a conveyor belt. Breading ×3',
    crew: { name: 'Breading line', emoji: '🥣', flavor: 'Flour, egg, crumbs, repeat. Grandma inspects every tenth one.' },
  },
  {
    id: 'crumbCascade', name: 'Crumb cascade', task: 'bread', mult: 4, cost: 30_000_000, requires: LEVEL_B,
    description: 'A waterfall of breadcrumbs. Cutlets go over the falls. Breading ×4',
    crew: { name: 'Crumb cascade', emoji: '🌊', flavor: 'A waterfall of breadcrumbs. Tourists come to watch.' },
  },
  {
    id: 'breadingBots', name: 'Breading bots', task: 'bread', mult: 5, cost: 700_000_000, requires: LEVEL_C,
    description: 'Programmed by Grandma, so they never measure anything. Breading ×5',
    crew: { name: 'Breading bot', emoji: '🤖', flavor: 'Programmed by Grandma. It also never measures anything.' },
  },
  {
    id: 'crumbNebula', name: 'Zero-g crumb nebula', task: 'bread', mult: 8, cost: 70_000_000_000, requires: LEVEL_D, space: true,
    description: 'Cutlets drift through a cloud of crumbs in zero g. Breading ×8',
    crew: { name: 'Zero-g crumb nebula', emoji: '🌌', flavor: 'Cutlets drift through a cloud of crumbs and come out perfect.' },
  },
  {
    id: 'crumbGalaxy', name: 'Crumb galaxy', task: 'bread', mult: 8, cost: 2.5e19, requires: LEVEL_E, space: true, deep: true,
    description: 'A spiral arm made entirely of breadcrumbs. Cutlets orbit through it. Breading ×8',
    crew: { name: 'Crumb galaxy', emoji: '💫', flavor: 'A spiral arm of breadcrumbs, a hundred light years wide. Grandma still sifts it.' },
  },
  // Fry
  {
    id: 'fryBrigade', name: 'Fry cook brigade', task: 'fry', mult: 3, cost: 3_000_000, requires: LEVEL_A,
    description: 'Every cousin, second cousin and their friends at a row of fryers. Frying ×3',
    crew: { name: 'Fry cook brigade', emoji: '🧑‍🍳', flavor: 'Thirty cousins, thirty fryers, zero eyebrows.' },
  },
  {
    id: 'industrialFryers', name: 'Industrial fryers', task: 'fry', mult: 4, cost: 35_000_000, requires: LEVEL_B,
    description: 'A swimming pool of oil, very hot, no swimming. Frying ×4',
    crew: { name: 'Industrial fryer', emoji: '🏭', flavor: 'A swimming pool of oil. Nobody swims in it. Twice.' },
  },
  {
    id: 'fryOTrons', name: 'Fry-o-trons', task: 'fry', mult: 5, cost: 800_000_000, requires: LEVEL_C,
    description: 'Golden brown, to the nanometre. Frying ×5',
    crew: { name: 'Fry-o-tron', emoji: '⚙️', flavor: 'Golden brown, to the nanometre.' },
  },
  {
    id: 'plasmaFryers', name: 'Plasma fryers', task: 'fry', mult: 8, cost: 80_000_000_000, requires: LEVEL_D, space: true,
    description: 'Fries at the temperature of a small star; still 170 °C inside. Frying ×8',
    crew: { name: 'Plasma fryer', emoji: '☄️', flavor: 'Fries at the temperature of a small star. Still 170 °C inside.' },
  },
  {
    id: 'supernovaFryers', name: 'Supernova fryers', task: 'fry', mult: 8, cost: 3e19, requires: LEVEL_E, space: true, deep: true,
    description: 'Every exploding star is now a fryer. The cutlets are timed to the second. Frying ×8',
    crew: { name: 'Supernova fryer', emoji: '💥', flavor: 'One exploding star, one perfect batch. The cousins wear very dark sunglasses.' },
  },
]

export const UPGRADES: UpgradeDef[] = [
  ...CREW_UPGRADES.map(
    (c): UpgradeDef => ({
      id: c.id,
      name: c.name,
      emoji: c.crew.emoji,
      description: c.description,
      cost: c.cost,
      requires: c.requires,
      space: c.space,
      deep: c.deep,
      effects: [{ kind: 'speed', task: c.task, mult: c.mult }],
    }),
  ),
  {
    id: 'combineHarvesters',
    name: 'Combine harvesters',
    emoji: '🚜',
    description: 'Big, green and air-conditioned. Fields ×3',
    cost: 40_000_000,
    requires: { franchises: 4, reputation: 3_000_000 },
    effects: [{ kind: 'facility', group: 'field', mult: 3 }],
  },
  {
    id: 'megaBarns',
    name: 'Mega barns',
    emoji: '🏚️',
    description: 'Room for every pig and hen, with heating and music. Animals ×3',
    cost: 60_000_000,
    requires: { franchises: 4, reputation: 5_000_000 },
    effects: [{ kind: 'facility', group: 'animal', mult: 3 }],
  },
  {
    id: 'automatedPlants',
    name: 'Automated plants',
    emoji: '🏭',
    description: 'Mill, bakery, oil press and butcher run around the clock. Processing ×3',
    cost: 90_000_000,
    requires: { franchises: 4, reputation: 8_000_000 },
    effects: [{ kind: 'facility', group: 'processor', mult: 3 }],
  },
  {
    id: 'heavyMallet',
    name: 'Heavier mallet',
    emoji: '🔨',
    description: 'Pounding ×2',
    cost: 30,
    effects: [{ kind: 'speed', task: 'pound', mult: 2 }],
  },
  {
    id: 'threeBowls',
    name: 'Three proper bowls',
    emoji: '🥣',
    description: 'Flour, egg, crumbs, in that order. Breading ×2',
    cost: 45,
    effects: [{ kind: 'speed', task: 'bread', mult: 2 }],
  },
  {
    id: 'foil',
    name: 'Aluminium foil',
    emoji: '🧻',
    description: 'Schnitzel cools down 50% slower',
    cost: 35,
    effects: [{ kind: 'cooling', mult: 0.5 }],
  },
  {
    id: 'castIronPan',
    name: 'Cast-iron pan',
    emoji: '🍳',
    description: 'Frying ×2',
    cost: 80,
    requires: { reputation: 15 },
    effects: [{ kind: 'speed', task: 'fry', mult: 2 }],
  },
  {
    id: 'shoppingList',
    name: "Auntie's shopping list",
    emoji: '📝',
    description: 'Automation: restocks ingredients from the corner shop for you',
    cost: 60,
    requires: { reputation: 10 },
    effects: [{ kind: 'autoBuy' }],
  },
  {
    id: 'bikeBasket',
    name: 'Bike basket',
    emoji: '🧺',
    description: 'Delivery ×2',
    cost: 120,
    requires: { reputation: 40 },
    effects: [{ kind: 'speed', task: 'deliver', mult: 2 }],
  },
  // Early orders and reputation: something to buy while the first places fill up.
  {
    id: 'chalkboard',
    name: 'Chalkboard by the gate',
    emoji: '🪧',
    description: '“SCHNITZEL TODAY” in Grandma’s handwriting. Orders ×1.3',
    cost: 150,
    requires: { reputation: 50 },
    effects: [{ kind: 'orders', mult: 1.3 }],
  },
  {
    id: 'lemonWedges',
    name: 'A lemon wedge on every plate',
    emoji: '🍋',
    description: 'Small thing, big smiles. Reputation per schnitzel ×1.5',
    cost: 250,
    requires: { reputation: 100 },
    effects: [{ kind: 'reputation', mult: 1.5 }],
  },
  {
    id: 'flyers',
    name: 'Flyers in every letterbox',
    emoji: '📬',
    description: 'Printed at school, folded by the kid. Orders ×1.3',
    cost: 450,
    requires: { reputation: 180 },
    effects: [{ kind: 'orders', mult: 1.3 }],
  },
  {
    id: 'streetGroup',
    name: 'Post in the street’s group chat',
    emoji: '💬',
    description: 'One photo of a golden schnitzel. Forty-two replies. Orders ×1.4',
    cost: 800,
    requires: { reputation: 350 },
    effects: [{ kind: 'orders', mult: 1.4 }],
  },
  // The corner shop grows with you: first to keep up until Grandpa's farm (Chapter 2),
  // then slowly into a grocery empire that backs up the farm (see SHOP_LOOKS in names.ts).
  {
    id: 'biggerVan',
    name: 'Mrs. Horáková’s bigger van',
    emoji: '🚚',
    description: 'You chip in for a bigger van; she brings more each trip. Shop supply ×1.5',
    cost: 3_000,
    requires: { reputation: 1_500 },
    effects: [{ kind: 'shopSupply', mult: 1.5 }],
  },
  {
    id: 'wholesaleCard',
    name: 'Wholesale market card',
    emoji: '🪪',
    description: 'Mrs. Horáková now shops at the wholesale market for you too. Shop supply ×2',
    cost: 20_000,
    requires: { reputation: 5_000 },
    effects: [{ kind: 'shopSupply', mult: 2 }],
  },
  // …and keeps growing slowly as a backup to the farm: small steps, all the way to the stars.
  {
    id: 'secondVan',
    name: 'A second delivery van',
    emoji: '🚐',
    description: 'Two vans, twice the honking. Shop supply ×1.25',
    cost: 150_000,
    requires: { franchises: 2, reputation: 20_000 },
    effects: [{ kind: 'shopSupply', mult: 1.25 }],
  },
  {
    id: 'miniMarket',
    name: 'Mini-market extension',
    emoji: '🏪',
    description: 'Mrs. Horáková knocks through to next door. Shop supply ×1.3',
    cost: 1_000_000,
    requires: { franchises: 2, reputation: 100_000 },
    effects: [{ kind: 'shopSupply', mult: 1.3 }],
  },
  {
    id: 'nightDeliveries',
    name: 'Night deliveries',
    emoji: '🌙',
    description: 'The van now runs while the town sleeps. Shop supply ×1.25',
    cost: 5_000_000,
    requires: { franchises: 3, reputation: 500_000 },
    effects: [{ kind: 'shopSupply', mult: 1.25 }],
  },
  {
    id: 'supermarket',
    name: 'A proper supermarket',
    emoji: '🏬',
    description: 'Trolleys, aisles, a cheese counter. Shop supply ×1.4',
    cost: 40_000_000,
    requires: { franchises: 5, reputation: 5_000_000 },
    effects: [{ kind: 'shopSupply', mult: 1.4 }],
  },
  {
    id: 'regionalDepot',
    name: 'Regional depot',
    emoji: '📦',
    description: 'Forklifts beep in Mrs. Horáková’s honour. Shop supply ×1.3',
    cost: 300_000_000,
    requires: { franchises: 6, reputation: 30_000_000 },
    effects: [{ kind: 'shopSupply', mult: 1.3 }],
  },
  {
    id: 'groceryChain',
    name: 'Horáková & Sons',
    emoji: '🏷️',
    description: 'Her grandsons open a shop in every town. Shop supply ×1.5',
    cost: 3_000_000_000,
    requires: { franchises: 8, reputation: 300_000_000 },
    effects: [{ kind: 'shopSupply', mult: 1.5 }],
  },
  {
    id: 'hypermarket',
    name: 'Hypermarket in orbit',
    emoji: '🛰️',
    description: 'Aisle 7: zero-g breadcrumbs. Shop supply ×1.5',
    cost: 50_000_000_000,
    requires: { reputation: 1_000_000_000 },
    space: true,
    effects: [{ kind: 'shopSupply', mult: 1.5 }],
  },
  {
    id: 'intergalacticGrocer',
    name: 'Intergalactic grocer',
    emoji: '🌌',
    description: 'A corner shop on every corner of the universe. Mrs. Horáková has never been prouder, or more tired. Shop supply ×1.5',
    cost: 5e19,
    requires: { reputation: 5e18 },
    space: true,
    deep: true,
    effects: [{ kind: 'shopSupply', mult: 1.5 }],
  },
  {
    id: 'galacticGrocer',
    name: 'Galactic grocer',
    emoji: '🛸',
    description: 'Same opening hours on every planet. Shop supply ×1.5',
    cost: 2_000_000_000_000,
    requires: { reputation: 100_000_000_000 },
    space: true,
    effects: [{ kind: 'shopSupply', mult: 1.5 }],
  },
  {
    id: 'neonSign',
    name: 'Neon sign on the garage',
    emoji: '💡',
    description: 'People notice. Orders ×1.5',
    cost: 1200,
    requires: { reputation: 300 },
    effects: [{ kind: 'orders', mult: 1.5 }],
  },
  {
    id: 'cashAndCarry',
    name: 'Cash & carry card',
    emoji: '💳',
    description: 'Packs from the shop are twice as big, same price',
    cost: 400,
    requires: { reputation: 120 },
    effects: [{ kind: 'packSize', mult: 2 }],
  },
  {
    id: 'thermoBox',
    name: 'Insulated delivery box',
    emoji: '📦',
    description: 'Schnitzel cools down 60% slower',
    cost: 600,
    requires: { reputation: 200 },
    effects: [{ kind: 'cooling', mult: 0.4 }],
  },
  {
    id: 'deepFryer',
    name: 'Second-hand deep fryer',
    emoji: '🛢️',
    description: 'Frying ×3',
    cost: 1500,
    requires: { reputation: 400 },
    effects: [{ kind: 'speed', task: 'fry', mult: 3 }],
  },
  {
    id: 'tenderizer',
    name: 'Electric tenderizer',
    emoji: '⚙️',
    description: 'Pounding ×3',
    cost: 2500,
    requires: { reputation: 600 },
    effects: [{ kind: 'speed', task: 'pound', mult: 3 }],
  },
  {
    id: 'breadingStation',
    name: 'Breading station',
    emoji: '🏭',
    description: 'Breading ×3',
    cost: 3500,
    requires: { reputation: 800 },
    effects: [{ kind: 'speed', task: 'bread', mult: 3 }],
  },
  {
    id: 'cargoBike',
    name: 'Cargo bike',
    emoji: '🛺',
    description: 'Delivery ×3',
    cost: 5000,
    requires: { reputation: 1200 },
    effects: [{ kind: 'speed', task: 'deliver', mult: 3 }],
  },
  {
    id: 'lard',
    name: "Grandma's secret: lard",
    emoji: '🤫',
    description: 'Fry in lard like it used to be done. Prices ×1.5',
    cost: 8000,
    requires: { reputation: 2000 },
    effects: [{ kind: 'price', mult: 1.5 }],
  },
  // Chapter 2: the farm
  {
    id: 'tractor',
    name: 'Second-hand tractor',
    emoji: '🚜',
    description: 'Fields ×2',
    cost: 250_000,
    requires: { franchises: 2, reputation: 20_000 },
    effects: [{ kind: 'facility', group: 'field', mult: 2 }],
  },
  {
    id: 'betterFeed',
    name: 'Better feed',
    emoji: '🌽',
    description: 'Chickens and pigs ×2',
    cost: 400_000,
    requires: { franchises: 2, reputation: 40_000 },
    effects: [{ kind: 'facility', group: 'animal', mult: 2 }],
  },
  {
    id: 'industrialMill',
    name: 'Industrial machines',
    emoji: '🏭',
    description: 'Mill, bakery, oil press and butcher ×2',
    cost: 600_000,
    requires: { franchises: 2, reputation: 60_000 },
    effects: [{ kind: 'facility', group: 'processor', mult: 2 }],
  },
  {
    id: 'deliveryVan',
    name: 'Delivery vans',
    emoji: '🚐',
    description: 'Retire the bikes. Delivery ×3',
    cost: 300_000,
    requires: { franchises: 2, reputation: 50_000 },
    effects: [{ kind: 'speed', task: 'deliver', mult: 3 }],
  },
  {
    id: 'industrialKitchen',
    name: 'Industrial kitchen',
    emoji: '🏗️',
    description: 'The garage gets an extension. Pounding, breading and frying ×3',
    cost: 1_000_000,
    requires: { franchises: 2, reputation: 150_000 },
    effects: [{ kind: 'kitchen', mult: 3 }],
  },
  {
    id: 'reeferTrucks',
    name: 'Refrigerated trucks',
    emoji: '🚚',
    description: 'Heated, actually. Delivery ×3, cooling 50% slower',
    cost: 3_000_000,
    requires: { franchises: 4, reputation: 500_000 },
    effects: [
      { kind: 'speed', task: 'deliver', mult: 3 },
      { kind: 'cooling', mult: 0.5 },
    ],
  },
  // Chapter 3: on the road
  {
    id: 'gpsRouting',
    name: 'Route planning software',
    emoji: '🧭',
    description: 'No more wrong turns. Fleet capacity ×2',
    cost: 50_000_000,
    requires: { franchises: 5, reputation: 3_000_000 },
    effects: [{ kind: 'fleet', mult: 2 }],
  },
  {
    id: 'onboardFryers',
    name: 'On-board fryers',
    emoji: '🍳',
    description: 'Fry on the way. Schnitzel cools 50% slower',
    cost: 500_000_000,
    requires: { franchises: 6, reputation: 30_000_000 },
    effects: [{ kind: 'cooling', mult: 0.5 }],
  },
  {
    id: 'logisticsHub',
    name: 'Logistics hub',
    emoji: '🏢',
    description: 'A warehouse the size of a village. Fleet capacity ×3',
    cost: 5_000_000_000,
    requires: { franchises: 8, reputation: 200_000_000 },
    effects: [{ kind: 'fleet', mult: 3 }],
  },
  {
    id: 'megaFarms',
    name: 'Mega farms',
    emoji: '🌾',
    description: 'Fields to the horizon. Every farm building ×3',
    cost: 100_000_000,
    requires: { franchises: 5, reputation: 10_000_000 },
    effects: [
      { kind: 'facility', group: 'field', mult: 3 },
      { kind: 'facility', group: 'animal', mult: 3 },
      { kind: 'facility', group: 'processor', mult: 3 },
    ],
  },

  // Crispness: technique, unlocked with the next town (see CRISP_UNLOCK_REGION).
  {
    id: 'doubleDip',
    name: 'Double dip',
    emoji: '🥚',
    description: 'Egg, crumbs, egg, crumbs. Crispness skill +0.05',
    cost: 200_000,
    quality: true,
    requires: { reputation: 15_000 },
    effects: [{ kind: 'crisp', add: 0.05 }],
  },
  {
    id: 'clarifiedButter',
    name: 'Clarified butter',
    emoji: '🧈',
    description: 'A splash in the oil, like Grandma does. Crispness skill +0.05',
    cost: 1_000_000,
    quality: true,
    requires: { reputation: 40_000 },
    effects: [{ kind: 'crisp', add: 0.05 }],
  },
  {
    id: 'restingRack',
    name: 'Resting rack',
    emoji: '🪜',
    description: 'No more soggy bottoms. Crispness skill +0.1',
    cost: 5_000_000,
    quality: true,
    requires: { reputation: 250_000 },
    effects: [{ kind: 'crisp', add: 0.1 }],
  },
  {
    id: 'pankoImport',
    name: 'Imported panko',
    emoji: '🍞',
    description: 'Flakier crumbs from far away. Crispness skill +0.1',
    cost: 30_000_000,
    quality: true,
    requires: { reputation: 1_000_000 },
    effects: [{ kind: 'crisp', add: 0.1 }],
  },
  {
    id: 'nitrogenTunnel',
    name: 'Nitrogen crisp tunnel',
    emoji: '🧪',
    description: 'Flash-chilled crumbs, flash-fried crust. Crispness skill +0.15',
    cost: 500_000_000,
    quality: true,
    requires: { reputation: 10_000_000 },
    effects: [{ kind: 'crisp', add: 0.15 }],
  },
  {
    id: 'crunchLab',
    name: 'Crunch lab',
    emoji: '🔬',
    description: 'Scientists with microphones measure every bite. Crispness skill +0.2',
    cost: 10_000_000_000,
    quality: true,
    requires: { reputation: 100_000_000 },
    effects: [{ kind: 'crisp', add: 0.2 }],
  },

  // Chapter 4: the stars.
  {
    id: 'zeroGFryer',
    name: 'Zero-g fryer',
    emoji: '🫧',
    description: 'Oil floats, cutlets float, everything fries from all sides at once. Kitchen ×3',
    cost: 2_000_000_000,
    space: true,
    requires: { reputation: 300_000_000 },
    effects: [{ kind: 'kitchen', mult: 3 }],
  },
  {
    id: 'hydroponics',
    name: 'Hydroponic domes',
    emoji: '🌱',
    description: 'Wheat under glass, pigs under glass (they love it). Every farm building ×3',
    cost: 5_000_000_000,
    space: true,
    requires: { reputation: 500_000_000 },
    effects: [
      { kind: 'facility', group: 'field', mult: 3 },
      { kind: 'facility', group: 'animal', mult: 3 },
      { kind: 'facility', group: 'processor', mult: 3 },
    ],
  },
  {
    id: 'teleportPantry',
    name: 'Teleport pantry',
    emoji: '📦',
    description: 'Mrs. Horáková’s shop, beamed up by the crate. Shop packs ×10',
    cost: 10_000_000_000,
    space: true,
    requires: { reputation: 1_000_000_000 },
    effects: [{ kind: 'packSize', mult: 10 }],
  },
  {
    id: 'orbitalMirrors',
    name: 'Orbital sun mirrors',
    emoji: '🪞',
    description: 'Mirrors in orbit point extra sunshine at your crops, day and night. Fields ×3',
    cost: 30_000_000_000,
    space: true,
    requires: { reputation: 3_000_000_000 },
    effects: [{ kind: 'facility', group: 'field', mult: 3 }],
  },
  {
    id: 'cloneVats',
    name: 'Cutlet cloning vats',
    emoji: '🧫',
    description: 'Every pig gets a twin. The pigs are fine with it. Animals ×3',
    cost: 80_000_000_000,
    space: true,
    requires: { reputation: 8_000_000_000 },
    effects: [{ kind: 'facility', group: 'animal', mult: 3 }],
  },
  {
    id: 'matterReplicators',
    name: 'Matter replicators',
    emoji: '🖨️',
    description: 'Tea, Earl Grey, hot. Breadcrumbs, golden, many. Processing ×3',
    cost: 300_000_000_000,
    space: true,
    requires: { reputation: 30_000_000_000 },
    effects: [{ kind: 'facility', group: 'processor', mult: 3 }],
  },
  {
    id: 'terraforming',
    name: 'Terraforming',
    emoji: '🪐',
    description: 'Turn whole moons into farmland. Every farm building ×5',
    cost: 5_000_000_000_000,
    space: true,
    requires: { reputation: 300_000_000_000 },
    effects: [
      { kind: 'facility', group: 'field', mult: 5 },
      { kind: 'facility', group: 'animal', mult: 5 },
      { kind: 'facility', group: 'processor', mult: 5 },
    ],
  },
  {
    id: 'spaceElevator',
    name: 'Space elevator',
    emoji: '🛗',
    description: 'A very long lift with a very small menu. Fleet ×2',
    cost: 20_000_000_000,
    space: true,
    requires: { reputation: 2_000_000_000 },
    effects: [{ kind: 'fleet', mult: 2 }],
  },
  {
    id: 'orbitalAds',
    name: 'Billboard on the Moon',
    emoji: '🪧',
    description: 'Visible from every kitchen on Earth. Orders ×2',
    cost: 100_000_000_000,
    space: true,
    requires: { reputation: 10_000_000_000 },
    effects: [{ kind: 'orders', mult: 2 }],
  },
  {
    id: 'cosmicCrumbs',
    name: 'Cosmic crumbs',
    emoji: '☄️',
    description: 'Breadcrumbs baked in a meteor shower. Crispness skill +0.3',
    cost: 1_000_000_000_000,
    space: true,
    requires: { reputation: 100_000_000_000 },
    effects: [{ kind: 'crisp', add: 0.3 }],
  },
  {
    id: 'dysonFryer',
    name: 'Dyson fryer',
    emoji: '🌞',
    description: 'A ring of fryers around the Sun. Mind the splatter. Kitchen ×5',
    cost: 10_000_000_000_000,
    space: true,
    requires: { reputation: 500_000_000_000 },
    effects: [{ kind: 'kitchen', mult: 5 }],
  },

  // Chapter 5: the Schnitzelverse.
  {
    id: 'stasisCrates',
    name: 'Stasis crates',
    emoji: '🧊',
    description: 'Time stops inside the box. A schnitzel fried today arrives in another galaxy still sizzling. Cooling on the way ÷100',
    cost: 3e18,
    space: true,
    deep: true,
    requires: { reputation: 5e17 },
    effects: [{ kind: 'cooling', mult: 0.01 }],
  },
  {
    id: 'warpCoils',
    name: 'Warp coils',
    emoji: '🌀',
    description: 'Space folds, the van does not. Fleet ×3',
    cost: 1e19,
    space: true,
    deep: true,
    requires: { reputation: 1e18 },
    effects: [{ kind: 'fleet', mult: 3 }],
  },
  {
    id: 'constellationAds',
    name: 'A constellation shaped like a schnitzel',
    emoji: '✨',
    description: 'Astronomers moved a few stars. Now everyone in the galaxy looks up and gets hungry. Orders ×3',
    cost: 2e20,
    space: true,
    deep: true,
    requires: { reputation: 2e19 },
    effects: [{ kind: 'orders', mult: 3 }],
  },
  {
    id: 'pigPlanets',
    name: 'Pig planets',
    emoji: '🐖',
    description: 'Whole planets of happy pigs and hens. Each one has a name. Animals ×5',
    cost: 5e19,
    space: true,
    deep: true,
    requires: { reputation: 5e18 },
    effects: [{ kind: 'facility', group: 'animal', mult: 5 }],
  },
  {
    id: 'wheatWorlds',
    name: 'Wheat worlds',
    emoji: '🌾',
    description: 'Planets that are one big field. The harvest takes a thousand years and never stops. Fields ×5',
    cost: 8e19,
    space: true,
    deep: true,
    requires: { reputation: 8e18 },
    effects: [{ kind: 'facility', group: 'field', mult: 5 }],
  },
  {
    id: 'nebulaMills',
    name: 'Nebula mills',
    emoji: '🌫️',
    description: 'A nebula spun into flour, oil and crumbs by the gravity of a dozen stars. Processing ×5',
    cost: 1.5e20,
    space: true,
    deep: true,
    requires: { reputation: 1.5e19 },
    effects: [{ kind: 'facility', group: 'processor', mult: 5 }],
  },
  {
    id: 'quantumCrunch',
    name: 'Quantum crunch',
    emoji: '⚛️',
    description: 'Every crumb is crispy and not crispy until you bite. Then it is very crispy. Crispness skill +0.3',
    cost: 1e21,
    space: true,
    deep: true,
    requires: { reputation: 1e20 },
    effects: [{ kind: 'crisp', add: 0.3 }],
  },
  {
    id: 'neutronStarFryer',
    name: 'Neutron star fryer',
    emoji: '🌟',
    description: 'A teaspoon of it weighs a billion tonnes and fries a billion schnitzels. Kitchen ×5',
    cost: 1e22,
    space: true,
    deep: true,
    requires: { reputation: 1e21 },
    effects: [{ kind: 'kitchen', mult: 5 }],
  },
  {
    id: 'faceInTheStars',
    name: 'Your face in the night sky',
    emoji: '🌠',
    description: 'A nebula that looks exactly like you holding a lemon. Every civilisation has heard of you. Reputation ×3',
    cost: 5e22,
    space: true,
    deep: true,
    requires: { reputation: 5e21 },
    effects: [{ kind: 'reputation', mult: 3 }],
  },
  {
    id: 'michelinStars',
    name: 'Three Michelin stars (actual stars)',
    emoji: '⭐',
    description: 'The inspectors gave you three stars. Real ones, from the next galaxy. Prices ×2',
    cost: 5e23,
    space: true,
    deep: true,
    requires: { reputation: 5e22 },
    effects: [{ kind: 'price', mult: 2 }],
  },
]

// ---------------------------------------------------------------- crispness

/** Crispness unlocks the first time you reach this place. */
export const CRISP_UNLOCK_REGION: RegionId = 'nextTown'
/** Prices × (1 + crispness); reputation gets this share of the bonus. */
export const CRISP_REPUTATION_SHARE = 0.25
/** Skill you start with once crispness is unlocked (Grandma's tips). */
export const CRISP_BASE_SKILL = 0.1
/** Fryer temperature range and the sweet spot, in °C. */
export const CRISP_TEMP_MIN = 150
export const CRISP_TEMP_MAX = 190
export const CRISP_TEMP_BEST = 170
/** How far from the sweet spot crispness drops to zero. */
export const CRISP_TEMP_SPREAD = 30
/** Frying speed gained per degree above the sweet spot (and lost below). */
export const CRISP_SPEED_PER_DEGREE = 0.015
/** Oil changes: oil used per schnitzel, and how much crisper it makes them. */
export const OIL_LEVELS = [
  { name: 'Now and then', oil: 1, quality: 1 },
  { name: 'Often', oil: 2, quality: 1.5 },
  { name: 'Every batch', oil: 3, quality: 1.8 },
]

// ---------------------------------------------------------------- distribution

export type RegionId =
  | 'neighbours'
  | 'friends'
  | 'street'
  | 'block'
  | 'district'
  | 'town'
  | 'nextTown'
  | 'city'
  | 'region'
  | 'country'
  | 'continent'
  | 'planet'
  | 'orbit'
  | 'moon'
  | 'mars'
  | 'belt'
  | 'jupiter'
  | 'solar'
  | 'nextStar'
  | 'cluster'
  | 'milkyWay'
  | 'nextGalaxy'
  | 'localGroup'
  | 'universe'
  | 'schnitzelverse'

export interface RegionDef {
  id: RegionId
  name: string
  emoji: string
  flavor: string
  population: number
  /** Orders per second, before upgrades. */
  orderRate: number
  price: number
  unlockCost: number
  unlockReputation: number
  /** Only reachable after this many franchises. */
  requiresFranchises?: number
  /** Kilometres from the garage. Vehicles need the range to get there (Chapter 3). */
  distance: number
  /** Off the planet (Chapter 4): only space vehicles get there. */
  space?: true
  /** Beyond the Solar System (Chapter 5): opens once the Solar System has been reached. Also set `space`. */
  deep?: true
}

/** Ordered from closest to farthest. Each one is the next step outward. */
export const REGIONS: RegionDef[] = [
  {
    id: 'neighbours',
    name: 'Next-door neighbours',
    emoji: '🏠',
    flavor: 'They can smell the frying through the wall.',
    population: 6,
    orderRate: 0.25,
    price: 5,
    unlockCost: 0,
    unlockReputation: 0,
    distance: 0.02,
  },
  {
    id: 'friends',
    name: 'Friends',
    emoji: '🍻',
    flavor: 'Throw a garage party and they will keep coming back.',
    population: 20,
    orderRate: 0.3,
    price: 6,
    unlockCost: 40,
    unlockReputation: 15,
    distance: 2,
  },
  {
    id: 'street',
    name: 'Your street',
    emoji: '🛣️',
    flavor: 'Flyers in every mailbox.',
    population: 120,
    orderRate: 0.8,
    price: 6.5,
    unlockCost: 200,
    unlockReputation: 200,
    distance: 0.5,
  },
  {
    id: 'block',
    name: 'The block',
    emoji: '🏘️',
    flavor: 'Word travels fast between balconies.',
    population: 600,
    orderRate: 2,
    price: 7,
    unlockCost: 1500,
    unlockReputation: 1100,
    distance: 1,
  },
  {
    id: 'district',
    name: 'The district',
    emoji: '🏙️',
    flavor: 'Office lunches. Lots of office lunches.',
    population: 5000,
    orderRate: 5,
    price: 8,
    unlockCost: 7500,
    unlockReputation: 4000,
    distance: 3,
  },
  {
    id: 'town',
    name: 'The whole town',
    emoji: '🌆',
    flavor: 'The mayor has your number now.',
    population: 40000,
    orderRate: 12,
    price: 9,
    unlockCost: 32000,
    unlockReputation: 10_000,
    distance: 6,
  },
  {
    id: 'nextTown',
    name: 'The next town over',
    emoji: '🚏',
    flavor: 'Your first franchise opened there. They have heard of you.',
    population: 60000,
    orderRate: 25,
    price: 10,
    unlockCost: 150_000,
    unlockReputation: 15_000,
    distance: 25,
    requiresFranchises: 1,
  },
  {
    id: 'city',
    name: 'The city',
    emoji: '🌃',
    flavor: 'Traffic, tourists, and a very serious food critic.',
    population: 500_000,
    orderRate: 60,
    price: 11,
    unlockCost: 750_000,
    unlockReputation: 40_000,
    distance: 60,
    requiresFranchises: 3,
  },
  {
    id: 'region',
    name: 'The whole region',
    emoji: '🗺️',
    flavor: 'Villages, motorway services, ski resorts. Everyone is hungry.',
    population: 1_300_000,
    orderRate: 150,
    price: 12,
    unlockCost: 2_000_000,
    unlockReputation: 250_000,
    distance: 150,
    requiresFranchises: 4,
  },
  {
    id: 'country',
    name: 'The whole country',
    emoji: '🏞️',
    flavor: 'Schnitzel is now officially a national dish. Again.',
    population: 10_000_000,
    orderRate: 400,
    price: 13,
    unlockCost: 6_000_000,
    unlockReputation: 1_000_000,
    distance: 400,
    requiresFranchises: 6,
  },
  {
    id: 'continent',
    name: 'The whole continent',
    emoji: '🌍',
    flavor: 'Forty countries, forty opinions on the side dish. All of them want schnitzel.',
    population: 450_000_000,
    orderRate: 1500,
    price: 15,
    unlockCost: 100_000_000,
    unlockReputation: 10_000_000,
    distance: 2000,
    requiresFranchises: 8,
  },
  {
    id: 'planet',
    name: 'The whole planet',
    emoji: '🌐',
    flavor: 'Every time zone, every table. The sun never sets on a schnitzel.',
    population: 8_000_000_000,
    orderRate: 8000,
    price: 18,
    unlockCost: 1_000_000_000,
    unlockReputation: 100_000_000,
    distance: 12000,
    requiresFranchises: 10,
  },

  // Chapter 4: the stars. Only space vehicles reach these.
  {
    id: 'orbit',
    name: 'The orbital station',
    emoji: '🛰️',
    flavor: 'Astronauts have eaten freeze-dried food for sixty years. Not any more.',
    population: 12,
    orderRate: 20_000,
    price: 30,
    unlockCost: 10_000_000_000,
    unlockReputation: 1_300_000_000,
    distance: 400,
    space: true,
  },
  {
    id: 'moon',
    name: 'Moon base',
    emoji: '🌕',
    flavor: 'One small bite for a man, one giant crunch for mankind.',
    population: 5_000,
    orderRate: 60_000,
    price: 60,
    unlockCost: 3e12,
    unlockReputation: 4e11,
    distance: 384_400,
    space: true,
  },
  {
    id: 'mars',
    name: 'Mars colony',
    emoji: '🔴',
    flavor: 'They grow potatoes. They desperately need something to go with them.',
    population: 1_000_000,
    orderRate: 200_000,
    price: 150,
    unlockCost: 5e14,
    unlockReputation: 7e13,
    distance: 225_000_000,
    space: true,
  },
  {
    id: 'belt',
    name: 'The asteroid belt',
    emoji: '🪨',
    flavor: 'Miners on rocks, hungry and very, very far from Mum.',
    population: 20_000_000,
    orderRate: 600_000,
    price: 400,
    unlockCost: 2.25e16,
    unlockReputation: 3e15,
    distance: 400_000_000,
    space: true,
  },
  {
    id: 'jupiter',
    name: 'Jupiter’s moons',
    emoji: '🪐',
    flavor: 'Europa has an ocean. Ganymede has a deep fryer now.',
    population: 300_000_000,
    orderRate: 2_000_000,
    price: 1000,
    unlockCost: 1.5e18,
    unlockReputation: 2e17,
    distance: 630_000_000,
    space: true,
  },
  {
    id: 'solar',
    name: 'The whole Solar System',
    emoji: '☀️',
    flavor: 'Every planet, every moon, every lonely probe. Pluto gets one too.',
    population: 20_000_000_000,
    orderRate: 8_000_000,
    price: 3000,
    unlockCost: 1.2e19,
    unlockReputation: 1.5e18,
    distance: 6_000_000_000,
    space: true,
  },
  // Chapter 5: the Schnitzelverse. Distances in km (a light year is 9.461e+12 km).
  {
    id: 'nextStar',
    name: 'The next-door star',
    emoji: '⭐',
    flavor: 'Alpha Centauri: three suns, one planet, and not one of them has ever had a schnitzel.',
    population: 1e11,
    orderRate: 25_000_000,
    price: 10_000,
    unlockCost: 9.6e19,
    unlockReputation: 1.2e19,
    distance: 3.97362e13,
    space: true,
    deep: true,
  },
  {
    id: 'cluster',
    name: 'Your star cluster',
    emoji: '✨',
    flavor: 'A few hundred stars that all know each other. Word of a good schnitzel gets around fast.',
    population: 1e12,
    orderRate: 80_000_000,
    price: 30_000,
    unlockCost: 1.1e21,
    unlockReputation: 1.4e20,
    distance: 4.7305e14,
    space: true,
    deep: true,
  },
  {
    id: 'milkyWay',
    name: 'The whole Milky Way',
    emoji: '🌀',
    flavor: 'Four hundred billion stars, and every single one can smell the frying.',
    population: 1e14,
    orderRate: 250_000_000,
    price: 100_000,
    unlockCost: 6.4e21,
    unlockReputation: 8e20,
    distance: 9.461e17,
    space: true,
    deep: true,
  },
  {
    id: 'nextGalaxy',
    name: 'The next galaxy over',
    emoji: '🌫️',
    flavor: 'Andromeda is heading our way anyway. Might as well feed it first.',
    population: 1e15,
    orderRate: 800_000_000,
    price: 300_000,
    unlockCost: 1.6e23,
    unlockReputation: 2e22,
    distance: 2.36525e19,
    space: true,
    deep: true,
  },
  {
    id: 'localGroup',
    name: 'The Local Group',
    emoji: '🫧',
    flavor: 'Fifty-odd galaxies, one group chat, one topic: lunch.',
    population: 1e16,
    orderRate: 2_500_000_000,
    price: 1_000_000,
    unlockCost: 2e24,
    unlockReputation: 2.5e23,
    distance: 9.461e19,
    space: true,
    deep: true,
  },
  {
    id: 'universe',
    name: 'The whole universe',
    emoji: '🌌',
    flavor: 'Every galaxy, every star, every lonely rock. The crust is now cosmic.',
    population: 1e22,
    orderRate: 8_000_000_000,
    price: 3_000_000,
    unlockCost: 8e24,
    unlockReputation: 1e24,
    distance: 4.35206e23,
    space: true,
    deep: true,
  },
  {
    id: 'schnitzelverse',
    name: 'The Schnitzelverse',
    emoji: '🍋',
    flavor: 'Every table in every universe, all at once. Grandma always said it would come to this.',
    population: 1e30,
    orderRate: 25_000_000_000,
    price: 10_000_000,
    unlockCost: 3.6e25,
    unlockReputation: 4.5e24,
    distance: 1e30,
    space: true,
    deep: true,
  },
]

/** The four chapters, shown in the header and on the welcome page. */
export const CHAPTERS = [
  { emoji: '🏚️', name: 'The garage' },
  { emoji: '🚜', name: 'Grandpa’s farm' },
  { emoji: '🚚', name: 'On the road' },
  { emoji: '🚀', name: 'The stars' },
  { emoji: '🍋', name: 'The Schnitzelverse' },
] as const

/** Chapter 4 starts the first time you reach this place. */
export const CHAPTER4_REGION: RegionId = 'planet'
/** Chapter 5 (the Schnitzelverse) starts the first time you reach this place. */
export const CHAPTER5_REGION: RegionId = 'solar'
/** The last place: reaching it shows the finale. */
export const FINAL_REGION: RegionId = 'schnitzelverse'

/** Your own delivery helpers (the "kid on a bike", later with vans) reach this far. */
export const HELPER_RANGE_KM = 400

// ---------------------------------------------------------------- chapter 2: the farm

/** The farm (and the shop's supply limit becoming a problem) arrives with this many franchises. */
export const CHAPTER2_FRANCHISES = 2

/**
 * The corner shop's shelves: each ingredient refills at this many units per
 * second and holds a minute's worth. Plenty for Chapter 1, the bottleneck by the city.
 */
export const SHOP_SUPPLY_RATE = 30
export const SHOP_SHELF_SECONDS = 60

export type FacilityGroup = 'field' | 'animal' | 'processor'
export type FacilityId = 'wheatField' | 'mill' | 'bakery' | 'sunflowers' | 'oilPress' | 'coop' | 'pigFarm' | 'butcher'

export interface FacilityDef {
  id: FacilityId
  name: string
  emoji: string
  flavor: string
  group: FacilityGroup
  inputs: Partial<Record<ItemId, number>>
  output: ItemId
  /** Units of output per cycle. */
  yield: number
  /** Cycles per second for one building, before upgrades. */
  rate: number
  baseCost: number
  costGrowth: number
}

/** In processing order: raw producers first, then the buildings that use their output. */
export const FACILITIES: FacilityDef[] = [
  {
    id: 'wheatField',
    name: 'Wheat field',
    emoji: '🌾',
    flavor: 'Grandpa still knows exactly when to harvest.',
    group: 'field',
    inputs: {},
    output: 'wheat',
    yield: 1,
    rate: 10,
    baseCost: 4_000,
    costGrowth: 1.1,
  },
  {
    id: 'sunflowers',
    name: 'Sunflower field',
    emoji: '🌻',
    flavor: 'Pretty, and full of frying oil.',
    group: 'field',
    inputs: {},
    output: 'seeds',
    yield: 1,
    rate: 10,
    baseCost: 6_000,
    costGrowth: 1.1,
  },
  {
    id: 'coop',
    name: 'Chicken coop',
    emoji: '🐔',
    flavor: 'The rooster starts work before anyone else.',
    group: 'animal',
    inputs: {},
    output: 'eggs',
    yield: 1,
    rate: 5,
    baseCost: 5_000,
    costGrowth: 1.1,
  },
  {
    id: 'pigFarm',
    name: 'Pig farm',
    emoji: '🐖',
    flavor: 'Happy pigs, muddy boots.',
    group: 'animal',
    inputs: {},
    output: 'pigs',
    yield: 1,
    rate: 1,
    baseCost: 15_000,
    costGrowth: 1.1,
  },
  {
    id: 'mill',
    name: 'Mill',
    emoji: '⚙️',
    flavor: 'The old water mill, back in business.',
    group: 'processor',
    inputs: { wheat: 1 },
    output: 'flour',
    yield: 1,
    rate: 10,
    baseCost: 8_000,
    costGrowth: 1.1,
  },
  {
    id: 'bakery',
    name: 'Bakery',
    emoji: '🥖',
    flavor: 'Bakes bread, then grates yesterday’s loaves into crumbs.',
    group: 'processor',
    inputs: { flour: 1 },
    output: 'crumbs',
    yield: 2,
    rate: 5,
    baseCost: 10_000,
    costGrowth: 1.1,
  },
  {
    id: 'oilPress',
    name: 'Oil press',
    emoji: '🫒',
    flavor: 'Squeezes every last drop out of the sunflowers.',
    group: 'processor',
    inputs: { seeds: 2 },
    output: 'oil',
    yield: 1,
    rate: 5,
    baseCost: 12_000,
    costGrowth: 1.1,
  },
  {
    id: 'butcher',
    name: 'Butcher',
    emoji: '🔪',
    flavor: 'Cousin Pavel, the family butcher. Nothing goes to waste.',
    group: 'processor',
    inputs: { pigs: 1 },
    output: 'meat',
    yield: 8,
    rate: 1,
    baseCost: 20_000,
    costGrowth: 1.1,
  },
]

/** How the Farm page groups buildings: one card per production chain. */
export interface FarmChain {
  id: string
  name: string
  emoji: string
  /** Kitchen ingredients this chain makes. */
  outputs: IngredientId[]
  /** Buildings in flow order, raw producer first. */
  buildings: FacilityId[]
}

export const FARM_CHAINS: FarmChain[] = [
  { id: 'meat', name: 'Meat', emoji: '🥩', outputs: ['meat'], buildings: ['pigFarm', 'butcher'] },
  {
    id: 'flour',
    name: 'Flour & breadcrumbs',
    emoji: '🌾',
    outputs: ['flour', 'crumbs'],
    buildings: ['wheatField', 'mill', 'bakery'],
  },
  { id: 'oil', name: 'Frying oil', emoji: '🫗', outputs: ['oil'], buildings: ['sunflowers', 'oilPress'] },
  { id: 'eggs', name: 'Eggs', emoji: '🥚', outputs: ['eggs'], buildings: ['coop'] },
]

/**
 * Goals for building counts: each one reached makes that kind of building
 * FARM_GOAL_MULT × faster (Grandpa's "just six more pig farms").
 */
export const FARM_GOALS = [10, 25, 50, 100, 200, 400, 800, 1600, 3200]
export const FARM_GOAL_MULT = 1.2

/** Farm goods waiting for processing are kept up to this (plus what the next step uses). */
export const FARM_GOOD_BUFFER = 50

// ---------------------------------------------------------------- chapter 3: on the road

/** The fleet arrives with this many franchises. */
export const CHAPTER3_FRANCHISES = 5

export type VehicleId = 'van' | 'truck' | 'train' | 'plane' | 'rocket' | 'cruiser' | 'ark' | 'warp' | 'wormhole'

export interface VehicleDef {
  id: VehicleId
  name: string
  emoji: string
  flavor: string
  /** Schnitzels per second one vehicle delivers, before upgrades. */
  capacity: number
  /** How far it can go, in km. */
  range: number
  /** km/h: faster means hotter on arrival. */
  speed: number
  /** Distance at which most of the heat is gone; default speed × FRESHNESS_KM_PER_KMH. */
  freshKm?: number
  /** Flies only to space places (Chapter 4). */
  space?: true
  /** Only in Chapter 5 (beyond the Solar System). Also set `space`. */
  deep?: true
  baseCost: number
  costGrowth: number
}

export const VEHICLES: VehicleDef[] = [
  {
    id: 'van',
    name: 'Delivery van',
    emoji: '🚐',
    flavor: 'Your name on the side, a hot box in the back.',
    capacity: 25,
    range: 300,
    speed: 80,
    baseCost: 2_000_000,
    costGrowth: 1.1,
  },
  {
    id: 'truck',
    name: 'Heated truck',
    emoji: '🚛',
    flavor: 'Forty tonnes of golden crust on the motorway.',
    capacity: 120,
    range: 2500,
    speed: 70,
    baseCost: 20_000_000,
    costGrowth: 1.1,
  },
  {
    id: 'train',
    name: 'Schnitzel express',
    emoji: '🚆',
    flavor: 'A dining car with no seats. Only crates.',
    capacity: 600,
    range: 6000,
    speed: 140,
    baseCost: 250_000_000,
    costGrowth: 1.1,
  },
  {
    id: 'plane',
    name: 'Cargo plane',
    emoji: '✈️',
    flavor: 'Fried at dawn, served across the ocean by lunch.',
    capacity: 3000,
    range: 20000,
    speed: 800,
    baseCost: 4_000_000_000,
    costGrowth: 1.1,
  },
  {
    id: 'rocket',
    name: 'Schnitzel rocket',
    emoji: '🚀',
    flavor: 'Fried on the launch pad, still sizzling in orbit.',
    capacity: 2_000,
    range: 400_000,
    speed: 40_000,
    freshKm: 2_000_000,
    space: true,
    baseCost: 1_000_000_000,
    costGrowth: 1.1,
  },
  {
    id: 'cruiser',
    name: 'Crust cruiser',
    emoji: '🛸',
    flavor: 'A fryer with engines bolted on. Or engines with a fryer. Nobody is sure.',
    capacity: 12_000,
    range: 1_000_000_000,
    speed: 1_000_000,
    freshKm: 5_000_000_000,
    space: true,
    baseCost: 50_000_000_000,
    costGrowth: 1.1,
  },
  {
    id: 'ark',
    name: 'Schnitzel ark',
    emoji: '🌌',
    flavor: 'Two of every schnitzel. Then two billion more.',
    capacity: 80_000,
    range: 10_000_000_000,
    speed: 10_000_000,
    freshKm: 50_000_000_000,
    space: true,
    baseCost: 2_000_000_000_000,
    costGrowth: 1.1,
  },
  {
    id: 'warp',
    name: 'Warp freighter',
    emoji: '🌠',
    flavor: 'Folds space, unfolds lunch. Needs stasis crates past the nearby stars.',
    capacity: 1_000_000,
    range: 1e18,
    speed: 1e13,
    freshKm: 1e16,
    space: true,
    deep: true,
    baseCost: 5e17,
    costGrowth: 1.1,
  },
  {
    id: 'wormhole',
    name: 'Wormhole gate',
    emoji: '🕳️',
    flavor: 'In one side hot, out the other side hot. Anywhere, instantly. Mind the gap.',
    capacity: 30_000_000,
    range: 1e31,
    speed: 1e30,
    freshKm: Infinity,
    space: true,
    deep: true,
    baseCost: 1e21,
    costGrowth: 1.1,
  },
]

/**
 * Freshness on arrival: the share of hot schnitzel still hot after a trip is
 * exp(-distance / (speed × FRESHNESS_KM_PER_KMH) × cooling multiplier).
 */
export const FRESHNESS_KM_PER_KMH = 20

/** The region that completes Chapter 1 and unlocks the Franchise. */
export const FRANCHISE_UNLOCK_REGION: RegionId = 'town'

// ---------------------------------------------------------------- franchise (prestige layer 1)

/**
 * Lifetime earnings are worth floor(sqrt(lifetime money earned / CRUMB_DIVISOR))
 * Golden Crumbs in total; a Franchise pays out the ones not collected yet.
 * Basing it on lifetime earnings means resetting early gives nothing extra:
 * the way to more crumbs is earning faster (going deeper, better perks).
 */
/**
 * Frontier sale: reaching your furthest place ever (again) lets you sell for
 * at least this share of your lifetime Golden Crumbs, even when earnings
 * alone wouldn't give one yet (e.g. right after a huge overnight run).
 */
export const FRONTIER_CRUMB_SHARE = 0.05

export const CRUMB_DIVISOR = 2500

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
  /** Other perks you need first, at least at these levels (see TREE below). */
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

/** Knocking on the neighbours' door: one extra order at most this often (seconds). */
export const KNOCK_COOLDOWN = 5

/** Offline progress: the family covers for you this long (plus Night shift). */
export const OFFLINE_CAP_HOURS = 8
export const NIGHT_SHIFT_HOURS = 4

/** Managers buy only things that cost at most this share of your money (at the Normal setting). */
export const MANAGER_SPEND_SHARE = 0.1
/** Equipment is a one-off, so the Quartermaster may spend more on it. */
export const QUARTERMASTER_SPEND_SHARE = 0.25
/** Managers look around this often (seconds of game time). */
export const MANAGER_INTERVAL = 1
/** Mum asks the others to save up only when the money still missing is at most this many seconds of recent income. */
export const SAVE_FOR_PLACE_SECONDS = 300
/** …and three times that from rank 2 on. */
export const SAVE_FOR_PLACE_SECONDS_RANK2 = 900

/** Places Old connections unlocks at the start of a run, one per level. */
export const START_REGIONS: RegionId[] = ['friends', 'street', 'block']

/** Auntie keeps this much money by default, so you can still hire after a reset. */
export const DEFAULT_AUTO_BUY_RESERVE = 25

export const HEAD_START_BASE = 50


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

/** Orders pile up for at most this many seconds before customers give up. */
export const ORDER_BACKLOG_SECONDS = 60
export const MIN_ORDER_BACKLOG = 5

// ---------------------------------------------------------------- story

export interface Milestone {
  id: string
  check: (s: GameState) => boolean
  text: string
}

export const MILESTONES: Milestone[] = [
  {
    id: 'firstServed',
    check: (s) => s.stats.served.gte(1),
    text: "Mrs. Novák from next door: “Is that schnitzel I smell? Bring me another one!”",
  },
  {
    id: 'firstCold',
    check: (s) => s.stats.servedCold.gte(1),
    text: 'Mr. Dvořák: “It was a bit cold… I ate it anyway.” (Hot schnitzel earns more and builds reputation.)',
  },
  {
    id: 'served10',
    check: (s) => s.stats.served.gte(10),
    text: 'Grandma: “You are doing it wrong. Move over.” Maybe the family can help?',
  },
  {
    id: 'friends',
    check: (s) => s.regions.friends.unlocked,
    text: 'The garage party was a hit. Your friends now want schnitzel every Friday.',
  },
  {
    id: 'earned1000',
    check: (s) => s.stats.earned.gte(1000),
    text: 'Dad: “So… is this a business now? Should I move the car out of the garage for good?”',
  },
  {
    id: 'served1000',
    check: (s) => s.stats.served.gte(1000),
    text: 'One thousand schnitzels. The garage floor is permanently covered in breadcrumbs.',
  },
  {
    id: 'town',
    check: (s) => s.regions.town.unlocked,
    text: 'The mayor called. Someone said the word “franchise”… You can now sell the business and start over with Golden Crumbs.',
  },
  {
    id: 'firstFranchise',
    check: (s) => s.prestige.franchises >= 1,
    text: 'Grandma: “Golden Crumbs? In my day we called that experience.” Spend them in the Franchise panel.',
  },
  {
    id: 'nextTown',
    check: (s) => s.regions.nextTown.unlocked,
    text: 'You drove past your first franchise. The queue went round the corner.',
  },
  {
    id: 'city',
    check: (s) => s.regions.city.unlocked,
    text: 'The city. A food critic booked a table under a fake name. Everybody knows it is her.',
  },
  {
    id: 'chapter2',
    check: (s) => s.prestige.franchises >= CHAPTER2_FRANCHISES,
    text: 'Grandpa called: “The old farm has been empty for years. Fields, a mill, a pigsty… take it.” Chapter 2: the farm is open.',
  },
  {
    id: 'soldOut',
    // Only once the farm exists: before that, 'grow your own' is advice you can't take.
    check: (s) => s.stats.soldOut > 0 && s.prestige.franchises >= CHAPTER2_FRANCHISES,
    text: 'Mrs. Horáková from the corner shop: “I’m out, dear. The van only comes so often. Have you thought about growing your own?”',
  },
  {
    id: 'region',
    check: (s) => s.regions.region.unlocked,
    text: 'Motorway services now sell your schnitzel. Truck drivers plan their routes around it.',
  },
  {
    id: 'country',
    check: (s) => s.regions.country.unlocked,
    text: 'The whole country. The president was photographed eating one. With a lemon wedge, correctly.',
  },
  {
    id: 'chapter3',
    check: (s) => s.prestige.franchises >= CHAPTER3_FRANCHISES,
    text: 'Your helpers can’t cycle to the other end of the country. Chapter 3: on the road. Buy a fleet.',
  },
  {
    id: 'continent',
    check: (s) => s.regions.continent.unlocked,
    text: 'The whole continent. Forty countries argue about potato salad versus fries. Everyone orders both.',
  },
  {
    id: 'planet',
    check: (s) => s.regions.planet.unlocked,
    text: 'The whole planet. Eight billion people, one schnitzel each. Grandma says you can stop now. You won’t. Chapter 4: the stars. Rockets are on the Fleet list, and space equipment is in every tab.',
  },
  {
    id: 'orbit',
    check: (s) => s.regions.orbit.unlocked,
    text: 'The orbital station placed its first order. The schnitzel arrived floating. Nobody minded.',
  },
  {
    id: 'moon',
    check: (s) => s.regions.moon.unlocked,
    text: 'Moon base unlocked. The flag is a lemon wedge on a stick.',
  },
  {
    id: 'mars',
    check: (s) => s.regions.mars.unlocked,
    text: 'Mars colony. The red planet now smells of golden crust.',
  },
  {
    id: 'solar',
    check: (s) => s.regions.solar.unlocked,
    text: 'The whole Solar System eats your schnitzel. Grandma looks up at the night sky and points further. Chapter 5: the Schnitzelverse.',
  },
  {
    id: 'nextStar',
    check: (s) => s.regions.nextStar.unlocked,
    text: 'The next-door star. Three suns rise over a plate of schnitzel. Nobody there has ever been this happy.',
  },
  {
    id: 'cluster',
    check: (s) => s.regions.cluster.unlocked,
    text: 'Your whole star cluster orders lunch. The group chat is just photos of crust.',
  },
  {
    id: 'milkyWay',
    check: (s) => s.regions.milkyWay.unlocked,
    text: 'The whole Milky Way. Four hundred billion stars, one menu.',
  },
  {
    id: 'nextGalaxy',
    check: (s) => s.regions.nextGalaxy.unlocked,
    text: 'The next galaxy over. Andromeda stops heading our way and starts queueing politely.',
  },
  {
    id: 'localGroup',
    check: (s) => s.regions.localGroup.unlocked,
    text: 'The Local Group. Fifty galaxies agree on one thing for the first time in history.',
  },
  {
    id: 'universe',
    check: (s) => s.regions.universe.unlocked,
    text: 'The whole universe eats your schnitzel. Only one table left to lay.',
  },
  {
    id: 'schnitzelverse',
    check: (s) => s.regions.schnitzelverse.unlocked,
    text: 'The Schnitzelverse. Every table in every universe. Grandma takes off her apron, just for a minute.',
  },
]

// Farm gear (farmGear.ts) needs the places and buildings above, so it joins UPGRADES last.
UPGRADES.push(...buildFarmGear(REGIONS, FACILITIES, CHAPTER2_FRANCHISES))

/** Shop rungs: the supply multiplier each one adds, and its price as a share of its place's price. */
export const SHOP_RUNG_MULT = 3
const SHOP_RUNG_COST_SHARE = 0.3
const SHOP_RUNGS: Record<(typeof SHOP_PLACES)[number], [emoji: string, name: string, flavor: string]> = {
  country: ['🚚', 'Horáková Express', 'Her own lorries, painted the colour of rye bread.'],
  continent: ['🚢', 'Container ships', 'Breadcrumbs by the shipload. The captain is her nephew.'],
  planet: ['🌐', 'Horáková worldwide', 'A shop in every time zone. She phones each one at opening time.'],
  orbit: ['🛰️', 'Orbital warehouse', 'Shelves in zero g. The tins float to the till.'],
  moon: ['🌕', 'Lunar pantry', 'Moon-dust-free flour. She checks every bag personally.'],
  mars: ['🔴', 'Red planet depot', 'Martian eggs: slightly dusty, very fresh.'],
  belt: ['🪨', 'Asteroid cash and carry', 'A hollowed-out asteroid with aisles a kilometre long.'],
  jupiter: ['🟠', 'Jupiter moon market', 'Open on all 95 moons. Closed for lunch on all 95.'],
  solar: ['☀️', 'Solar supply chain', 'Every planet’s pantry, joined up. She keeps all the receipts.'],
  nextStar: ['⭐', 'Starlight stock room', 'Four light years of shelves. The stock check takes a while.'],
  cluster: ['✨', 'Cluster co-op', 'A hundred stars, one loyalty card.'],
  milkyWay: ['🌀', 'Galactic wholesale', 'The whole galaxy shops here. The trolleys have warp drives.'],
  nextGalaxy: ['🌫️', 'Andromeda branch', 'Same prices, different galaxy. She insisted.'],
  localGroup: ['🫧', 'Local Group logistics', 'Fifty galaxies of shelves and one very long receipt.'],
  universe: ['🌌', 'Universal pantry', 'Everything, everywhere, always in stock. Except lemons, sometimes.'],
  schnitzelverse: ['🍋', 'The shop at the end of everything', 'Every universe’s corner shop, all run by one Mrs. Horáková. She knows your name.'],
}
UPGRADES.push(
  ...SHOP_PLACES.map((place): UpgradeDef => {
    const [emoji, name, flavor] = SHOP_RUNGS[place]
    const region = REGIONS.find((r) => r.id === place)!
    return {
      id: `shop_${place}`,
      name,
      emoji,
      description: `${flavor} Shop supply ×${SHOP_RUNG_MULT}`,
      cost: Math.round(region.unlockCost * SHOP_RUNG_COST_SHARE),
      requires: { place },
      space: region.space,
      deep: region.deep,
      effects: [{ kind: 'shopSupply', mult: SHOP_RUNG_MULT }],
    }
  }),
)
