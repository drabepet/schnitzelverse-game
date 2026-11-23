// The kitchen: pound, bread, fry, and how schnitzel cools.
import type { ItemId } from './items'

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
