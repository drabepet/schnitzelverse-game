// Loose tuning numbers: knocking, offline time, manager spending, order backlog.
import type { RegionId } from './regions'

/** Knocking on the neighbours' door: one extra order at most this often (seconds). */
export const KNOCK_COOLDOWN = 5

/** Offline progress: the family covers for you this long (plus Night shift). */
export const OFFLINE_CAP_HOURS = 12
export const NIGHT_SHIFT_HOURS = 4

/** Managers buy only things that cost at most this share of your money (at the Normal setting). */
export const MANAGER_SPEND_SHARE = 0.1
/** Equipment is a one-off, so the Quartermaster may spend more on it. */
export const QUARTERMASTER_SPEND_SHARE = 0.25
/** Managers look around this often (seconds of game time). */
export const MANAGER_INTERVAL = 1
/**
 * While ingredients are the limit, Grandma grows the kitchen (and the kid the
 * fleet) only this far past what the farm and shop can feed: a little ahead,
 * so Grandpa always has something to catch up to, but no money on capacity
 * that would stand idle.
 */
export const SUPPLY_LEAD = 1.2
/** Mum asks the others to save up only when the money still missing is at most this many seconds of recent income. */
export const SAVE_FOR_PLACE_SECONDS = 300
/** …and three times that from rank 2 on. */
export const SAVE_FOR_PLACE_SECONDS_RANK2 = 900
/**
 * When customers are the limit (everything else keeps up), a new place is the
 * only thing that helps, so Mum saves this many times longer for it.
 */
export const SAVE_FOR_PLACE_CUSTOMERS = 3

/** Places Old connections unlocks at the start of a run, one per level. */
export const START_REGIONS: RegionId[] = ['friends', 'street', 'block']

/** Auntie keeps this much money by default, so you can still hire after a reset. */
export const DEFAULT_AUTO_BUY_RESERVE = 25

export const HEAD_START_BASE = 50



/** Orders pile up for at most this many seconds before customers give up. */
export const ORDER_BACKLOG_SECONDS = 60
export const MIN_ORDER_BACKLOG = 5

// ---------------------------------------------------------------- the epilogue: “Now, the lemon”

/**
 * Word of mouth stops here: everyone in every universe has heard. With every
 * source of orders capped, the most customers can ever order is fixed
 * (EVERYONE_ORDERS in rules.ts, worked out from the data), and that is the epilogue's goal.
 */
export const WORD_OF_MOUTH_MAX = 35
/** Shares of everyone fed that get a badge (and the last one, the closing card). */
export const FED_GOALS = [0.02, 0.05, 0.1, 0.25, 0.5, 0.75, 1] as const
