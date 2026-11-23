// Which tabs a save shows, and the small markers on them. The tab bar (Tabs.tsx) draws them.
import { BADGES } from '../engine/badges'
import { INGREDIENT_IDS, PERKS, REGIONS } from '../engine/content'
import { canUnlockRegion } from '../engine/actions'
import { canBuyPerk, canFranchise, canReach, chapter2Unlocked, getMods, nextRegion, shopSupplyRate } from '../engine/rules'
import type { GameState } from '../engine/state'
import { currentTier } from '../engine/tiers'
import { farmSupplyNow, needsNow } from './derived'
import { perFrame } from './perFrame'

/** Prep → making → distribution is the pipeline; franchise and records sit beside it. */
export type TabId = 'prep' | 'making' | 'distribution' | 'franchise' | 'records'

export interface TabInfo {
  id: TabId
  label: string
  emoji: string
  /** Part of the prep → making → distribution pipeline. */
  pipeline?: boolean
  /** Small marker: a number, "!" when something needs attention, "+" when something new is ready. */
  alert?: string
  alertTitle?: string
}

/** The tabs this save shows, with their markers (worked out once per frame: the app and the tab bar both ask). */
export const visibleTabs = perFrame(computeTabs)

function computeTabs(s: GameState): TabInfo[] {
  const mods = getMods(s)
  const prep = currentTier(s, 'prep')
  const making = currentTier(s, 'making')
  const distribution = currentTier(s, 'distribution')

  // Prep: an ingredient the farm and shop can't cover, or (before the farm) one that ran out.
  let prepAlert: string | undefined
  if (chapter2Unlocked(s)) {
    const need = needsNow(s)
    const supply = farmSupplyNow(s)
    if (INGREDIENT_IDS.some((i) => (need[i] ?? 0) - supply(i) - shopSupplyRate(mods) > 0.05)) prepAlert = '!'
  } else if (INGREDIENT_IDS.some((i) => s.items[i].lt(1))) prepAlert = '!'

  // Distribution: a place nothing can reach, or a new place ready to unlock.
  const next = nextRegion(s)
  const distAlert = REGIONS.some((r) => s.regions[r.id].unlocked && !canReach(s, r))
    ? '!'
    : next && canUnlockRegion(s, next.region.id)
      ? '+'
      : undefined

  const tabs: TabInfo[] = [
    { id: 'prep', label: prep.name, emoji: prep.emoji, pipeline: true, alert: prepAlert, alertTitle: 'An ingredient is running short' },
    { id: 'making', label: making.name, emoji: making.emoji, pipeline: true },
    {
      id: 'distribution',
      label: distribution.name,
      emoji: distribution.emoji,
      pipeline: true,
      alert: distAlert,
      alertTitle: distAlert === '+' ? 'A new place is ready to unlock' : 'A place can’t be reached',
    },
  ]

  if (s.prestige.unlocked || s.prestige.franchises > 0) {
    const affordable = PERKS.filter((p) => canBuyPerk(s, p)).length
    tabs.push({
      id: 'franchise',
      label: 'Franchise',
      emoji: '✨',
      alert: affordable > 0 ? String(affordable) : canFranchise(s) ? '✨' : undefined,
      alertTitle: affordable > 0 ? 'Perks you can afford' : 'You can sell now',
    })
  }
  const fresh = Object.keys(s.badges).length - s.badgesSeen
  tabs.push({
    id: 'records',
    label: `Records ${Object.keys(s.badges).length}/${BADGES.length}`,
    emoji: '🏅',
    alert: fresh > 0 ? String(fresh) : undefined,
    alertTitle: 'New badges',
  })
  return tabs
}
