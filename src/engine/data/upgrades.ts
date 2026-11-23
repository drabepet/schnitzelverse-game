// Equipment: crew gear, the big list, farm gear and the shop’s rungs.
import { CHAPTER2_FRANCHISES, FACILITIES, type FacilityGroup, type FacilityId } from './farm'
import type { StageId, Task } from './kitchen'
import { REGIONS, type RegionId } from './regions'
import type { Requirement } from './staff'
import { type FarmChainId, type FarmGearId, buildFarmGear } from '../farmGear'

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


// Farm gear (farmGear.ts) is built from the places and farm buildings, and joins UPGRADES after the list above.
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
