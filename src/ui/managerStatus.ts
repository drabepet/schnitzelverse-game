// What each manager is up to, in words and as a mood (for the sidebar dots
// and the Family at work cards).
import type { PerkId } from '../engine/content'
import { familyNextStep, farmNextStep, managerActive, managerRank, savingStatus } from '../engine/automation'
import { fmtMoney, fmtTime } from '../engine/format'
import type { GameState } from '../engine/state'

/** What this manager is busy with right now, in a few words. */
export function doingNow(s: GameState, id: PerkId): string {
  if (!managerActive(s, id)) return 'Switched off.'
  const saving = savingStatus(s)
  if (id === 'estateAgent')
    return saving
      ? `Saving for ${saving.region.emoji} ${saving.region.name.toLowerCase()}: ${fmtMoney(saving.remaining)} to go, about ${fmtTime(saving.eta)}.`
      : 'Opens the next place as soon as you can afford it.'
  if (saving) return `Waiting: Mum is saving for ${saving.region.emoji} ${saving.region.name.toLowerCase()}.`
  if (id === 'familyManager') {
    const step = familyNextStep(s)
    if (!step) return 'The kitchen keeps up with the customers. Nothing to do.'
    if (step.kind === 'wait') return `Saving for ${step.upgrade.emoji} ${step.upgrade.name.toLowerCase()} (${fmtMoney(step.remaining)} to go).`
    if (step.kind === 'equip') return `About to buy ${step.upgrade.emoji} ${step.upgrade.name.toLowerCase()}.`
    return `Hiring ${step.worker.emoji} ${step.worker.name.toLowerCase()} for the slowest step.`
  }
  if (id === 'farmManager') {
    const step = farmNextStep(s)
    if (!step) return 'The farm covers what the kitchen needs. Nothing to do.'
    if (step.kind === 'wait') return `Saving for ${step.upgrade.emoji} ${step.upgrade.name.toLowerCase()} (${fmtMoney(step.remaining)} to go).`
    if (step.kind === 'equip') return `About to buy ${step.upgrade.emoji} ${step.upgrade.name.toLowerCase()}.`
    return `Building ${step.facility.emoji} ${step.facility.name.toLowerCase()} for the shortest ingredient.`
  }
  if (id === 'quartermaster') return managerRank(s, id) >= 2 ? 'Buying the biggest equipment he can afford.' : 'Buying equipment, cheapest first.'
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
  if (savingStatus(s)) return 'saving'
  if (id === 'familyManager' && familyNextStep(s)?.kind === 'wait') return 'saving'
  if (id === 'farmManager' && farmNextStep(s)?.kind === 'wait') return 'saving'
  return 'idle'
}

export const MOOD_TEXT: Record<ManagerMood, string> = {
  off: 'Switched off',
  busy: 'Busy: bought something just now',
  saving: 'Saving up',
  idle: 'Nothing to do right now',
}
