// The three pipeline tabs (prep → making → distribution) are named after
// how far you've come in each. Every level is also a "promotion" badge.
import { STAGE_IDS, VEHICLES, type UpgradeDef } from './content'
import { chapter2Unlocked, getMods, taskCapacity } from './rules'
import type { GameState } from './state'

export type Pillar = 'prep' | 'making' | 'distribution'

export interface Tier {
  name: string
  emoji: string
  /** Shown as the promotion badge's goal. */
  goal: string
  /** The joke when you get there. */
  flavor: string
  reached: (s: GameState) => boolean
}

const kitchenSpeed = (s: GameState) => {
  const mods = getMods(s)
  return Math.min(...STAGE_IDS.map((t) => taskCapacity(s, t, mods).toNumber()))
}
const owns = (s: GameState, id: (typeof VEHICLES)[number]['id']) => s.vehicles[id] > 0

/** Lowest level first. The current level is the highest one reached. */
export const TIERS: Record<Pillar, Tier[]> = {
  prep: [
    { name: 'Corner shop', emoji: '🛒', goal: 'Start out', flavor: '', reached: () => true },
    {
      name: 'Farm',
      emoji: '🚜',
      goal: 'Get Grandpa’s farm',
      flavor: 'You now own more boots than shoes.',
      reached: (s) => chapter2Unlocked(s),
    },
    {
      name: 'Agro empire',
      emoji: '🌾',
      goal: 'Own 150 farm buildings at once, or Mega farms',
      flavor: 'Somewhere, a combine harvester has your face on it.',
      reached: (s) => !!s.upgrades.megaFarms || Object.values(s.facilities).reduce((n, c) => n + c, 0) >= 150,
    },
    {
      name: 'Space farms',
      emoji: '🌱',
      goal: 'Build hydroponic domes',
      flavor: 'The pigs wear tiny helmets. They refuse to take them off.',
      reached: (s) => !!s.upgrades.hydroponics,
    },
    {
      name: 'Terraformed worlds',
      emoji: '🪐',
      goal: 'Terraform a moon into farmland',
      flavor: 'Grandpa asked for “a bit more land”. He got Ganymede.',
      reached: (s) => !!s.upgrades.terraforming,
    },
  ],
  making: [
    { name: 'Garage', emoji: '🏚️', goal: 'Start out', flavor: '', reached: () => true },
    {
      name: 'House',
      emoji: '🏠',
      goal: 'Kitchen makes 2 schnitzels per second',
      flavor: 'Mum wants her kitchen back. Mum is not getting her kitchen back.',
      reached: (s) => kitchenSpeed(s) >= 2,
    },
    {
      name: 'Factory',
      emoji: '🏭',
      goal: 'Kitchen makes 20 schnitzels per second',
      flavor: 'Hairnets are now mandatory. Grandma refuses.',
      reached: (s) => kitchenSpeed(s) >= 20,
    },
    {
      name: 'Mega factory',
      emoji: '🏗️',
      goal: 'Kitchen makes 200 schnitzels per second',
      flavor: 'It can be seen from space. It smells great from space too.',
      reached: (s) => kitchenSpeed(s) >= 200,
    },
    {
      name: 'Crust complex',
      emoji: '🏛️',
      goal: 'Kitchen makes 2,000 schnitzels per second',
      flavor: 'A city of fryers. The mayor is a deep fryer now. Nobody objected.',
      reached: (s) => kitchenSpeed(s) >= 2000,
    },
    {
      name: 'Orbital kitchen',
      emoji: '🛰️',
      goal: 'Kitchen makes 20,000 schnitzels per second',
      flavor: 'Mission control: “We have crunch.”',
      reached: (s) => kitchenSpeed(s) >= 20000,
    },
    {
      name: 'Galactic kitchen',
      emoji: '🌌',
      goal: 'Kitchen makes 1 million schnitzels per second',
      flavor: 'Astronomers named a nebula after your fryer. It is shaped like a lemon wedge.',
      reached: (s) => kitchenSpeed(s) >= 1_000_000,
    },
  ],
  distribution: [
    { name: 'On foot', emoji: '🚶', goal: 'Start out', flavor: '', reached: () => true },
    {
      name: 'Bike courier',
      emoji: '🚲',
      goal: 'Hire a kid on a bike',
      flavor: 'Two wheels, one basket, zero brakes.',
      reached: (s) => s.workers.kid > 0,
    },
    {
      name: 'Delivery service',
      emoji: '🚐',
      goal: 'Get delivery vans',
      flavor: 'There is a jingle. Everyone hates it. Everyone hums it.',
      reached: (s) => !!s.upgrades.deliveryVan || owns(s, 'van'),
    },
    {
      name: 'Logistics',
      emoji: '🛣️',
      goal: 'Own a truck or a train',
      flavor: 'You say “supply chain” unironically now.',
      reached: (s) => owns(s, 'truck') || owns(s, 'train'),
    },
    {
      name: 'Global airline',
      emoji: '✈️',
      goal: 'Own a cargo plane',
      flavor: 'In-flight meal: guess.',
      reached: (s) => owns(s, 'plane'),
    },
    {
      name: 'Space program',
      emoji: '🚀',
      goal: 'Launch a schnitzel rocket',
      flavor: 'T-minus ten seconds to lunch.',
      reached: (s) => owns(s, 'rocket'),
    },
    {
      name: 'Interplanetary',
      emoji: '🛸',
      goal: 'Own a crust cruiser or a schnitzel ark',
      flavor: 'Delivery times now quoted in light-minutes.',
      reached: (s) => owns(s, 'cruiser') || owns(s, 'ark'),
    },
  ],
}

/** Index of the highest level reached. */
export function tierLevel(state: GameState, pillar: Pillar): number {
  const ladder = TIERS[pillar]
  for (let i = ladder.length - 1; i > 0; i--) if (ladder[i].reached(state)) return i
  return 0
}

export function currentTier(state: GameState, pillar: Pillar): Tier {
  return TIERS[pillar][tierLevel(state, pillar)]
}

/** Which pipeline tab an upgrade belongs to, from what it improves. */
export function upgradePillar(u: UpgradeDef): Pillar {
  const kinds = u.effects.map((e) => (e.kind === 'speed' ? (e.task === 'deliver' ? 'deliver' : 'kitchen') : e.kind))
  if (kinds.some((k) => k === 'packSize' || k === 'autoBuy' || k === 'facility' || k === 'shopSupply')) return 'prep'
  if (kinds.some((k) => k === 'deliver' || k === 'fleet' || k === 'cooling' || k === 'orders')) return 'distribution'
  return 'making'
}
