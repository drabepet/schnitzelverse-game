// All game content lives here as plain data, so adding ingredients, staff,
// upgrades or regions never needs engine changes.
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
 * Cook to order: staff stop a step once this many of its output are waiting
 * (plus whatever the next step can take this tick). Manual clicks ignore it.
 */
export const DEFAULT_BUFFERS: Record<StageId, number> = { pound: 10, bread: 10, fry: 5 }

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

export type UpgradeId =
  | 'heavyMallet'
  | 'chalkboard'
  | 'biggerVan'
  | 'wholesaleCard'
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
}

const LEVEL_A = { franchises: 2, reputation: 100_000 }
const LEVEL_B = { franchises: 3, reputation: 2_000_000 }
const LEVEL_C = { franchises: 5, reputation: 50_000_000 }
const LEVEL_D = { reputation: 5_000_000_000 }

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
  // The corner shop grows a little with you, until Grandpa's farm takes over (Chapter 2).
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
    unlockCost: 3_000_000_000,
    unlockReputation: 400_000_000,
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
    unlockCost: 300_000_000_000,
    unlockReputation: 40_000_000_000,
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
    unlockCost: 30_000_000_000_000,
    unlockReputation: 4_000_000_000_000,
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
    unlockCost: 3e15,
    unlockReputation: 4e14,
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
    unlockCost: 3e17,
    unlockReputation: 4e16,
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
    unlockCost: 3e19,
    unlockReputation: 4e18,
    distance: 6_000_000_000,
    space: true,
  },
]

/** Chapter 4 starts the first time you reach this place. */
export const CHAPTER4_REGION: RegionId = 'planet'

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

/** Farm goods waiting for processing are kept up to this (plus what the next step uses). */
export const FARM_GOOD_BUFFER = 50

// ---------------------------------------------------------------- chapter 3: on the road

/** The fleet arrives with this many franchises. */
export const CHAPTER3_FRANCHISES = 5

export type VehicleId = 'van' | 'truck' | 'train' | 'plane' | 'rocket' | 'cruiser' | 'ark'

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
  | 'nightShift'

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
}

/** Permanent upgrades bought with Golden Crumbs. They survive every franchise. */
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
  // Managers: they keep buying while you're away. Each one buys only what
  // costs at most MANAGER_SPEND_SHARE of your money, so they never empty the till.
  {
    id: 'familyManager',
    name: 'Grandma, head of staff',
    emoji: '👵',
    description:
      'Hires helpers for whichever step is slowest, while customers want more. If equipment for that step does more per dollar, she buys that instead (or saves for it when it’s a few minutes away)',
    baseCost: 2,
    costGrowth: 1,
    maxLevel: 1,
    manager: true,
  },
  {
    id: 'quartermaster',
    name: 'Uncle, the quartermaster',
    emoji: '🧔',
    description: 'Buys equipment, cheapest first',
    baseCost: 3,
    costGrowth: 1,
    maxLevel: 1,
    manager: true,
  },
  {
    id: 'estateAgent',
    name: 'Mum, the estate agent',
    emoji: '👩',
    description:
      'Unlocks the next place as soon as you can. When it’s only a few minutes of income away, she asks the others to wait so the money gets there sooner',
    baseCost: 4,
    costGrowth: 1,
    maxLevel: 1,
    manager: true,
  },
  {
    id: 'farmManager',
    name: 'Grandpa, farm boss',
    emoji: '👴',
    description:
      'Builds whichever farm building holds back the shortest ingredient. If farm equipment for it does more per dollar, he buys that instead (or saves for it when it’s a few minutes away)',
    baseCost: 10,
    costGrowth: 1,
    maxLevel: 1,
    manager: true,
  },
  {
    id: 'dispatcher',
    name: 'The kid, now a dispatcher',
    emoji: '🧑‍💼',
    description: 'Buys vehicles to reach every place and keep up with the kitchen',
    baseCost: 40,
    costGrowth: 1,
    maxLevel: 1,
    manager: true,
  },
]

/** Knocking on the neighbours' door: one extra order at most this often (seconds). */
export const KNOCK_COOLDOWN = 5

/** Offline progress: the family covers for you this long (plus Night shift). */
export const OFFLINE_CAP_HOURS = 8
export const NIGHT_SHIFT_HOURS = 4

/** Managers buy only things that cost at most this share of your money. */
export const MANAGER_SPEND_SHARE = 0.1
/** Equipment is a one-off, so the Quartermaster may spend more on it. */
export const QUARTERMASTER_SPEND_SHARE = 0.25
/** Managers look around this often (seconds of game time). */
export const MANAGER_INTERVAL = 1
/** Mum asks the others to save up only when the money still missing is at most this many seconds of recent income. */
export const SAVE_FOR_PLACE_SECONDS = 300

/** Places Old connections unlocks at the start of a run, one per level. */
export const START_REGIONS: RegionId[] = ['friends', 'street', 'block']

/** Auntie keeps this much money by default, so you can still hire after a reset. */
export const DEFAULT_AUTO_BUY_RESERVE = 25

export const HEAD_START_BASE = 50

/** Perks that only appear once the farm (Chapter 2) is unlocked. */
export const CHAPTER2_PERKS: PerkId[] = ['farmDeeds', 'greenThumb', 'farmManager']
/** Perks that only appear once the fleet (Chapter 3) is unlocked. */
export const CHAPTER3_PERKS: PerkId[] = ['fleetContracts', 'logisticsDegree', 'dispatcher']
/** Perks that only appear in Chapter 4 (the stars). */
export const CHAPTER4_PERKS: PerkId[] = ['launchContracts']
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
    text: 'The whole Solar System eats your schnitzel. Grandma looks up at the night sky and nods. (The galaxy is next. Some day.)',
  },
]
