// Requirements, and the family you hire.
import type { Task } from './kitchen'
import type { RegionId } from './regions'

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
