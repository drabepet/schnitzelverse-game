// Why a button is greyed out, in plain words, and what unlocks it.
// Every disabled button in the game uses these (see HintButton).
import type { Decimal } from '../engine/decimal'
import { D } from '../engine/decimal'
import { REGION_BY_ID, type Requirement, type RegionDef, type UpgradeDef } from '../engine/content'
import { fmt, fmtMoney, fmtTime } from '../engine/format'
import type { GameState } from '../engine/state'
import { canBuyUpgrade } from '../engine/rules'

/** The first reason that applies, or null when nothing is in the way. */
export function firstReason(...reasons: (string | null | false | undefined)[]): string | null {
  for (const r of reasons) if (r) return r
  return null
}

/** Not enough money: how much more, and roughly how long at the current income. */
export function needMoney(s: GameState, cost: Decimal | number, income = 0): string | null {
  const c = D(cost)
  if (s.money.gte(c)) return null
  const missing = c.sub(s.money)
  const eta = income > 1e-3 ? missing.div(income).toNumber() : Infinity
  return `Costs ${fmtMoney(c)}: ${fmtMoney(missing)} more to go${Number.isFinite(eta) ? ` (about ${fmtTime(eta)} at this pace)` : ''}.`
}

/** How much of a price you have (0..1), for the fill in a greyed-out buy button. */
export function affordShare(have: Decimal, cost: Decimal | number): number {
  const c = D(cost)
  return c.lte(0) ? 1 : Math.min(1, have.div(c).toNumber())
}

/** A place's name inside a sentence: “the next town over”, not “The next town over”. */
export const placeName = (place: RegionDef): string => place.name.replace(/^The /, 'the ')

/** Why an upgrade can't be bought yet (its requirement, then the money), or null when it can. */
export function upgradeWhyNot(s: GameState, u: UpgradeDef, income: number): string | null {
  return canBuyUpgrade(s, u) ? null : firstReason(needRequirement(s, u.requires), needMoney(s, u.cost, income))
}

/** Reputation or franchises still missing. */
export function needRequirement(s: GameState, req: Requirement | undefined): string | null {
  if (!req) return null
  if (req.franchises !== undefined && s.prestige.franchises < req.franchises) {
    return `Unlocks after ${req.franchises} franchise${req.franchises === 1 ? '' : 's'} (you have ${s.prestige.franchises}).`
  }
  if (req.place !== undefined && !s.regions[req.place].unlocked) {
    const place = REGION_BY_ID[req.place]
    return `Unlocks once you reach ${place.emoji} ${placeName(place)} in this run.`
  }
  if (req.reputation !== undefined && s.reputation.lt(req.reputation)) {
    return `Needs ⭐ ${fmt(req.reputation)} reputation (you have ${fmt(s.reputation)}). Deliver hot schnitzels to earn more.`
  }
  return null
}
