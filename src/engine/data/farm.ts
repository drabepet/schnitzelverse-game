// Chapter 2: Grandpa’s farm.
import type { ItemId } from './items'
import type { Requirement } from './staff'

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
export type FacilityId =
  | 'wheatField'
  | 'mill'
  | 'bakery'
  | 'sunflowers'
  | 'oilPress'
  | 'coop'
  | 'pigFarm'
  | 'butcher'
  | 'paprikaDunes'
  | 'paprikaMill'
  | 'paprikaDistillery'

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
  /** Can only be built once this is met (the paprika chain: a place in this run). */
  requires?: Requirement
  /** Star paprika: Chapter 4 (and `deep`: Chapter 5). Not part of the ingredient farm. */
  space?: true
  deep?: true
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
  // Star paprika (Chapters 4–5): fuel for long space trips, see FUEL_PER_SCHNITZEL.
  {
    id: 'paprikaDunes',
    name: 'Paprika dunes',
    emoji: '🏜️',
    flavor: 'Star paprika only grows in red Martian sand. The crumb worms leave it alone. Mostly.',
    group: 'field',
    inputs: {},
    output: 'pods',
    yield: 1,
    rate: 10,
    baseCost: 5e13,
    costGrowth: 1.1,
    requires: { place: 'mars' },
    space: true,
  },
  {
    id: 'paprikaMill',
    name: 'Paprika mill',
    emoji: '⚗️',
    flavor: 'Grinds the pods into fold paprika. One pinch and a pilot sees the shortcut.',
    group: 'processor',
    inputs: { pods: 2 },
    output: 'fold',
    yield: 1,
    rate: 5,
    baseCost: 1e14,
    costGrowth: 1.1,
    requires: { place: 'mars' },
    space: true,
  },
  {
    id: 'paprikaDistillery',
    name: 'Paprika distillery',
    emoji: '🔮',
    flavor: 'Boils fold paprika down until it folds space between the stars.',
    group: 'processor',
    inputs: { fold: 2 },
    output: 'deepFold',
    yield: 1,
    rate: 20,
    baseCost: 1e17,
    costGrowth: 1.1,
    requires: { place: 'nextStar' },
    space: true,
    deep: true,
  },
]

/** Kitchen farm buildings (the ingredient chains), without the star paprika ones. */
export const KITCHEN_FACILITIES = FACILITIES.filter((f) => !f.space)
/** Star paprika buildings: they make ship fuel, not ingredients. */
export const FUEL_FACILITIES = FACILITIES.filter((f) => f.space)

/** How the Farm page groups buildings: one card per production chain. */
export interface FarmChain {
  id: string
  name: string
  emoji: string
  /** What this chain makes for the kitchen (or, for star paprika, for the fleet). */
  outputs: ItemId[]
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
  {
    id: 'paprika',
    name: 'Star paprika (ship fuel)',
    emoji: '🌶️',
    outputs: ['fold', 'deepFold'],
    buildings: ['paprikaDunes', 'paprikaMill', 'paprikaDistillery'],
  },
]

/**
 * Goals for building counts: each one reached makes that kind of building
 * FARM_GOAL_MULT × faster (Grandpa's "just six more pig farms").
 */
export const FARM_GOALS = [10, 25, 50, 100, 200, 400, 800, 1600, 3200]
export const FARM_GOAL_MULT = 1.2

/** Farm goods waiting for processing are kept up to this (plus what the next step uses). */
export const FARM_GOOD_BUFFER = 50
