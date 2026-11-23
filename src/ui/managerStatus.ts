// What each manager is up to, in words and as a mood (for the sidebar dots
// and the Family at work cards).
import type { PerkId } from '../engine/content'
import { fleetWaitsForSupply, managerActive, managerRank } from '../engine/automation'
import { familyStepNow, farmStepNow, savingNow } from './derived'
import { fmtMoney, fmtMoneyShort, fmtTime } from '../engine/format'
import { Decimal } from '../engine/decimal'
import { BEST_SALE_EARLY, BEST_SALE_MIN_SHARE, CRUMB_RATE_DROP } from '../engine/state'
import { crumbGrowth, pendingCrumbs } from '../engine/rules'
import type { GameState } from '../engine/state'

/** What this manager is busy with right now, in a few words. */
export function doingNow(s: GameState, id: PerkId): string {
  if (!managerActive(s, id)) return 'Switched off.'
  const saving = savingNow(s)
  if (id === 'estateAgent')
    return saving
      ? `Saving for ${saving.region.emoji} ${saving.region.name.toLowerCase()}: ${fmtMoneyShort(saving.remaining)} to go, about ${fmtTime(saving.eta)}.${saving.customers ? ' Only a new place helps now.' : ''}`
      : 'Opens the next place as soon as you can afford it.'
  if (saving) return `Waiting: Mum is saving for ${saving.region.emoji} ${saving.region.name.toLowerCase()}.`
  if (id === 'familyManager') {
    const step = familyStepNow(s)
    if (!step) return 'The kitchen keeps up with the customers. Nothing to do.'
    if (step.kind === 'hold') return 'Waiting for the farm: ingredients are the limit, so more helpers would stand idle.'
    if (step.kind === 'wait') return `Saving for ${step.upgrade.emoji} ${step.upgrade.name.toLowerCase()} (${fmtMoney(step.remaining)} to go).`
    if (step.kind === 'equip') return `About to buy ${step.upgrade.emoji} ${step.upgrade.name.toLowerCase()}.`
    return `Hiring ${step.worker.emoji} ${step.worker.name.toLowerCase()} for the slowest step.`
  }
  if (id === 'farmManager') {
    const step = farmStepNow(s)
    if (!step) return 'The farm covers what the kitchen needs. Nothing to do.'
    if (step.kind === 'wait') return `Saving for ${step.upgrade.emoji} ${step.upgrade.name.toLowerCase()} (${fmtMoney(step.remaining)} to go).`
    if (step.kind === 'equip') return `About to buy ${step.upgrade.emoji} ${step.upgrade.name.toLowerCase()}.`
    return `Building ${step.facility.emoji} ${step.facility.name.toLowerCase()} for the shortest ingredient.`
  }
  if (id === 'quartermaster')
    return managerRank(s, id) >= 2
      ? 'Equipment for the bottleneck first, the biggest first. Nothing that would stand idle.'
      : 'Equipment for the bottleneck first, the cheapest first. Nothing that would stand idle.'
  if (fleetWaitsForSupply(s)) return 'Waiting for the farm: the fleet carries all the ingredients can feed.'
  return 'Keeping a vehicle on every route and the fleet up with the kitchen.'
}


/** A manager bought something within this many seconds: they're busy. */
const BUSY_SECONDS = 60

export type ManagerMood = 'off' | 'busy' | 'saving' | 'idle'

/** For the sidebar dot: switched off, just bought something, saving up, or nothing to do. */
export function managerMood(s: GameState, id: PerkId): ManagerMood {
  if (!managerActive(s, id)) return 'off'
  const last = [...s.managerLog].reverse().find((e) => e.who === id)
  if (last && s.stats.playtime - last.t < BUSY_SECONDS) return 'busy'
  if (savingNow(s)) return 'saving'
  if (id === 'familyManager' && familyStepNow(s)?.kind === 'wait') return 'saving'
  if (id === 'farmManager' && farmStepNow(s)?.kind === 'wait') return 'saving'
  return 'idle'
}

export const MOOD_TEXT: Record<ManagerMood, string> = {
  off: 'Switched off',
  busy: 'Busy: bought something just now',
  saving: 'Saving up',
  idle: 'Nothing to do right now',
}

/**
 * Mum's selling rule in one line, and how close it is (Franchise tab): null
 * when she can't sell yet (below rank 3).
 */
export function mumSellStatus(s: GameState): string | null {
  if (managerRank(s, 'estateAgent') < 3) return null
  const a = s.autoSell
  if (!a.enabled) return 'Mum can sell for you by a rule you set (The family at work, below). She’s off now.'
  const pending = pendingCrumbs(s)
  const lifetime = Decimal.max(1, s.prestige.totalCrumbs)
  const share = pending.div(lifetime).toNumber()
  if (a.rule === 'time') {
    const left = a.minutes * 60 - s.run.time
    return left > 0 ? `Mum sells after ${a.minutes} minutes of a run: in ${fmtTime(left)}.` : `Mum sells after ${a.minutes} minutes of a run: now.`
  }
  if (a.rule === 'share') return `Mum sells when a sale adds +${a.percent}% of your crumbs: now +${pct(share)}.`
  if (share >= BEST_SALE_EARLY) return 'Mum sells at the best moment: now, it would triple your crumbs.'
  const g = crumbGrowth(s)
  const peak = s.run.growthPeak
  if (!(peak > 0)) return 'Mum sells at the best moment: she starts watching 15 minutes into a run.'
  return `Mum sells at the best moment: this run grows your crumbs ${pct(g)} an hour (best ${pct(peak)}); she sells once that dips below ${pct(peak * CRUMB_RATE_DROP)} and a sale adds +${pct(BEST_SALE_MIN_SHARE)} (now +${pct(share)}).`
}

/** 0.873 → "87%", 0.0042 → "0.4%". */
function pct(x: number): string {
  const p = x * 100
  return `${p >= 10 ? Math.round(p) : p.toFixed(1)}%`
}
