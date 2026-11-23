// Names that grow with the business. Helpers and farm buildings keep their
// ids (and saves); only what they are called changes as each pipeline tab
// is promoted (see tiers.ts): Uncle with a mallet → … → Graviton flattener.
import {
  CREW_UPGRADES,
  FACILITY_BY_ID,
  type FacilityId,
  type StageId,
  type UpgradeId,
  WORKER_BY_ID,
  type WorkerId,
} from './content'
import type { GameState } from './state'
import { tierLevel, type Pillar } from './tiers'

export interface Look {
  /** From this tier of the pillar upward (ignored when `upgrade` is set). */
  from: number
  /** Or: once this equipment is bought. */
  upgrade?: UpgradeId
  name: string
  emoji: string
  flavor: string
}

/** Kitchen helpers follow the making tab; the kid follows distribution. */
export const WORKER_PILLAR: Record<WorkerId, Pillar> = {
  uncle: 'making',
  grandma: 'making',
  cousin: 'making',
  kid: 'distribution',
}

// Distribution tiers: 0 On foot, 1 Bike courier, 2 Delivery service, 3 Logistics, 4 Global airline, 5 Space program, 6 Interplanetary.
export const WORKER_LOOKS: Record<WorkerId, Look[]> = {
  // Kitchen crews follow their equipment (CREW_UPGRADES), see crewLooks().
  uncle: [],
  grandma: [],
  cousin: [],
  kid: [
    { from: 2, name: 'Courier', emoji: '🛵', flavor: 'The kid grew up and hired friends. Scooters now.' },
    { from: 3, name: 'Delivery driver', emoji: '🚗', flavor: 'Knows every shortcut and every dog on the route.' },
    { from: 4, name: 'Delivery drone', emoji: '🛸', flavor: 'Drops schnitzel on balconies. Mostly the right ones.' },
    { from: 5, name: 'Jetpack courier', emoji: '🧑‍🚀', flavor: 'Lands on your doorstep with a whoosh and a lemon wedge.' },
  ],
}

// Prep tiers: 0 Corner shop, 1 Farm, 2 Agro empire, 3 Space farms, 4 Terraformed worlds.
export const FACILITY_LOOKS: Record<FacilityId, Look[]> = {
  wheatField: [
    { from: 2, name: 'Wheat plains', emoji: '🌾', flavor: 'Golden to the horizon. The combine has cruise control.' },
    { from: 3, name: 'Hydroponic wheat bay', emoji: '🧪', flavor: 'Wheat in glowing tubes. It grows to synth-pop.' },
    { from: 4, name: 'Terraformed prairie', emoji: '🪐', flavor: 'A whole moon of wheat. It waves in a breeze you built.' },
  ],
  sunflowers: [
    { from: 2, name: 'Sunflower estate', emoji: '🌻', flavor: 'They all turn to the sun. And then to the fryer.' },
    { from: 3, name: 'Solar sunflower array', emoji: '🔆', flavor: 'Half sunflower, half solar panel. Fully frying oil.' },
    { from: 4, name: 'Dyson sunflower ring', emoji: '☀️', flavor: 'They no longer turn to the sun. The sun turns to them.' },
  ],
  coop: [
    { from: 2, name: 'Egg factory', emoji: '🥚', flavor: 'Very happy hens, very big building.' },
    { from: 3, name: 'Zero-g hen habitat', emoji: '🐔', flavor: 'Floating hens lay floating eggs. Catching them is a sport.' },
    { from: 4, name: 'Cosmic coop', emoji: '🪺', flavor: 'Which came first? Out here, nobody can tell.' },
  ],
  pigFarm: [
    { from: 2, name: 'Pork ranch', emoji: '🐖', flavor: 'Cowboys, but for pigs. Pigboys.' },
    { from: 3, name: 'Orbital pig habitat', emoji: '🛰️', flavor: 'The pigs wear tiny helmets. They refuse to take them off.' },
    { from: 4, name: 'Pig planet', emoji: '🌍', flavor: 'A whole world of mud. They have never been happier.' },
  ],
  mill: [
    { from: 2, name: 'Flour works', emoji: '🏭', flavor: 'The old water mill, now with a dozen bigger siblings.' },
    { from: 3, name: 'Centrifuge mill', emoji: '🌀', flavor: 'Spins grain into flour at a thousand g. Do not lean on it.' },
    { from: 4, name: 'Quantum mill', emoji: '⚛️', flavor: 'Grinds the wheat before it is harvested. Very efficient.' },
  ],
  bakery: [
    { from: 2, name: 'Crumb factory', emoji: '🥖', flavor: 'Bakes bread purely to destroy it. Industrial art.' },
    { from: 3, name: 'Crumb synthesizer', emoji: '🔬', flavor: 'Prints breadcrumbs atom by atom. Crunchier than real ones.' },
    { from: 4, name: 'Crumb star forge', emoji: '✨', flavor: 'Toasts breadcrumbs in starlight. Grandma approves, reluctantly.' },
  ],
  oilPress: [
    { from: 2, name: 'Oil refinery', emoji: '🛢️', flavor: 'Sunflower oil by the tanker. Smells like summer.' },
    { from: 3, name: 'Cold-fusion oil press', emoji: '⚡', flavor: 'Squeezes sunflowers with the power of a tiny sun.' },
    { from: 4, name: 'Oil nebula condenser', emoji: '🌫️', flavor: 'Frying oil, condensed straight out of space.' },
  ],
  butcher: [
    { from: 2, name: 'Meat plant', emoji: '🔪', flavor: 'Cousin Pavel runs it with a clipboard now.' },
    { from: 3, name: 'Laser butcher', emoji: '🔦', flavor: 'Perfect cutlets, cut with light. Pavel misses his knife.' },
    { from: 4, name: 'Matter carver', emoji: '💠', flavor: 'Reshapes pork at the molecular level. Still tastes of Sunday.' },
  ],
}

/** A kitchen crew's looks: one per piece of crew equipment, in order (built once per step). */
const CREW_LOOKS = new Map<StageId, Look[]>()
function crewLooks(task: StageId): Look[] {
  let looks = CREW_LOOKS.get(task)
  if (!looks) {
    looks = CREW_UPGRADES.filter((c) => c.task === task).map((c) => ({ from: 0, upgrade: c.id, ...c.crew }))
    CREW_LOOKS.set(task, looks)
  }
  return looks
}

function pick(state: GameState, base: Look, looks: Look[], tier: number): Look {
  let out = base
  for (const l of looks) if (l.upgrade ? state.upgrades[l.upgrade] : tier >= l.from) out = l
  return out
}

/** What a helper is called right now, and the family member they started as. */
export function workerLook(state: GameState, id: WorkerId): Look & { original: string } {
  const def = WORKER_BY_ID[id]
  const base = { from: 0, name: def.name, emoji: def.emoji, flavor: def.flavor }
  const looks = def.task === 'deliver' ? WORKER_LOOKS[id] : crewLooks(def.task)
  // Crew looks follow their equipment, not the tab's tier: only work the tier out when a look needs it.
  const tier = looks.some((l) => !l.upgrade) ? tierLevel(state, WORKER_PILLAR[id]) : 0
  return { ...pick(state, base, looks, tier), original: def.name }
}

/** What a farm building is called right now. */
export function facilityLook(state: GameState, id: FacilityId): Look & { original: string } {
  const def = FACILITY_BY_ID[id]
  const base = { from: 0, name: def.name, emoji: def.emoji, flavor: def.flavor }
  return { ...pick(state, base, FACILITY_LOOKS[id], tierLevel(state, 'prep')), original: def.name }
}

/** Panel titles that grow with the business. */
export function staffTitle(state: GameState, pillar: 'making' | 'distribution'): string {
  const t = tierLevel(state, pillar)
  if (pillar === 'making') return t >= 7 ? '💫 Cosmic crew' : t >= 6 ? '🌌 Galactic crew' : t >= 5 ? '🧑‍🚀 Orbital crew' : t >= 4 ? '🤖 Machines' : t >= 2 ? '👷 Kitchen staff' : '👨‍👩‍👧 Family in the kitchen'
  return t >= 7 ? '🌠 Warp couriers' : t >= 4 ? '🛸 Courier network' : t >= 2 ? '🛵 Couriers' : '🚲 Delivery helpers'
}

/** Mrs. Horáková's shop, as it grows (each look comes with the upgrade that builds it). */
export const SHOP_LOOKS: Look[] = [
  { from: 0, upgrade: 'miniMarket', name: 'Horáková’s mini-market', emoji: '🏪', flavor: 'She knocked through to next door. The cat came with it.' },
  { from: 0, upgrade: 'supermarket', name: 'Horáková’s supermarket', emoji: '🏬', flavor: 'Aisles, trolleys and a cheese counter. She still knows everyone’s name.' },
  { from: 0, upgrade: 'regionalDepot', name: 'Horáková wholesale depot', emoji: '📦', flavor: 'Forklifts, pallets and a very small office with a very big kettle.' },
  { from: 0, upgrade: 'groceryChain', name: 'Horáková & Sons grocery chain', emoji: '🏷️', flavor: 'A shop in every town, all of them smelling faintly of rye bread.' },
  { from: 0, upgrade: 'hypermarket', name: 'Horáková orbital hypermarket', emoji: '🛰️', flavor: 'Aisle 7: zero-g breadcrumbs. Please hold on to your trolley.' },
  { from: 0, upgrade: 'galacticGrocer', name: 'Horáková galactic grocer', emoji: '🛸', flavor: 'Same opening hours on every planet. She still closes for lunch.' },
  { from: 0, upgrade: 'intergalacticGrocer', name: 'Horáková’s universe', emoji: '🌌', flavor: 'A corner shop on every corner of the universe. The cat came too. All of the cats.' },
]

/** What the corner shop has grown into. */
export function shopLook(state: GameState): Look {
  const base = { from: 0, name: 'Mrs. Horáková’s corner shop', emoji: '🛒', flavor: 'Round the block, open since forever.' }
  return pick(state, base, SHOP_LOOKS, 0)
}
