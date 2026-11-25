// Chapter 3: the fleet.

// ---------------------------------------------------------------- chapter 3: on the road

/** The fleet arrives with this many franchises. */
export const CHAPTER3_FRANCHISES = 5

/**
 * Star paprika (Chapters 4–5): every schnitzel flown past the Moon burns this
 * much fold paprika, and past the Sun this much deep-fold paprika. Without it
 * the ship drifts on solar sails and the schnitzel arrives cold.
 */
export const FUEL_PER_SCHNITZEL = 0.01
/** Trips at least this long (km) need fuel: Mars and beyond. */
export const FUEL_FROM_KM = 100_000_000

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
