// Crispness: temperature and oil.
import type { RegionId } from './regions'

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
