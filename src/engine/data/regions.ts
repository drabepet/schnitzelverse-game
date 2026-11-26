// Places to deliver to, and the chapters.

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
  | 'nextUniverse'
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
    id: 'nextUniverse',
    name: 'The universe next door',
    emoji: '🚪',
    flavor: 'Same street, different physics. They put ketchup on everything; Grandma is working on it.',
    population: 1e26,
    orderRate: 14_000_000_000,
    price: 5_500_000,
    unlockCost: 1.7e25,
    unlockReputation: 2.1e24,
    distance: 1e27,
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

/** The five chapters, shown in the header and on the welcome page. */
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
