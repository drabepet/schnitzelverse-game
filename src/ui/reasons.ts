// Why a button is greyed out, in plain words, and what unlocks it.
// Every disabled button in the game uses these (see HintButton).
import type { Decimal } from '../engine/decimal'
import { D } from '../engine/decimal'
import type { Requirement } from '../engine/content'
import { fmt, fmtMoney, fmtTime } from '../engine/format'
import type { GameState } from '../engine/state'

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

/** Reputation or franchises still missing. */
export function needRequirement(s: GameState, req: Requirement | undefined): string | null {
  if (!req) return null
  if (req.franchises !== undefined && s.prestige.franchises < req.franchises) {
    return `Unlocks after ${req.franchises} franchise${req.franchises === 1 ? '' : 's'} (you have ${s.prestige.franchises}).`
  }
  if (req.reputation !== undefined && s.reputation.lt(req.reputation)) {
    return `Needs ⭐ ${fmt(req.reputation)} reputation (you have ${fmt(s.reputation)}). Deliver hot schnitzels to earn more.`
  }
  return null
}
