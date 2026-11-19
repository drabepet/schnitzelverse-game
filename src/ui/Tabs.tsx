import { Fragment } from 'react'
import { BADGES } from '../engine/badges'
import { INGREDIENT_IDS, PERKS, REGIONS } from '../engine/content'
import { canUnlockRegion } from '../engine/actions'
import {
  canBuyPerk,
  canFranchise,
  canReach,
  chapter2Unlocked,
  farmSupply,
  getMods,
  nextRegion,
  shopSupplyRate,
  supplyNeeds,
} from '../engine/rules'
import type { GameState } from '../engine/state'
import { currentTier } from '../engine/tiers'
import { useGame } from '../game/store'

/** Prep → making → distribution is the pipeline; franchise and records sit beside it. */
export type TabId = 'prep' | 'making' | 'distribution' | 'franchise' | 'records'

interface TabInfo {
  id: TabId
  label: string
  emoji: string
  /** Part of the prep → making → distribution pipeline. */
  pipeline?: boolean
  /** Small marker: a number, "!" when something needs attention, "+" when something new is ready. */
  alert?: string
  alertTitle?: string
}

export function visibleTabs(s: GameState): TabInfo[] {
  const mods = getMods(s)
  const tier = (p: 'prep' | 'making' | 'distribution') => currentTier(s, p)

  // Prep: an ingredient the farm and shop can't cover, or (before the farm) one that ran out.
  let prepAlert: string | undefined
  if (chapter2Unlocked(s)) {
    const need = supplyNeeds(s, mods)
    if (INGREDIENT_IDS.some((i) => (need[i] ?? 0) - farmSupply(s, i, mods) - shopSupplyRate(mods) > 0.05)) prepAlert = '!'
  } else if (INGREDIENT_IDS.some((i) => s.items[i].lt(1))) prepAlert = '!'

  // Distribution: a place nothing can reach, or a new place ready to unlock.
  const next = nextRegion(s)
  const distAlert = REGIONS.some((r) => s.regions[r.id].unlocked && !canReach(s, r))
    ? '!'
    : next && canUnlockRegion(s, next.region.id)
      ? '+'
      : undefined

  const tabs: TabInfo[] = [
    { id: 'prep', label: tier('prep').name, emoji: tier('prep').emoji, pipeline: true, alert: prepAlert, alertTitle: 'An ingredient is running short' },
    { id: 'making', label: tier('making').name, emoji: tier('making').emoji, pipeline: true },
    {
      id: 'distribution',
      label: tier('distribution').name,
      emoji: tier('distribution').emoji,
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

export function TabBar({ active, onSelect }: { active: TabId; onSelect: (t: TabId) => void }) {
  const { state } = useGame()
  const tabs = visibleTabs(state)
  return (
    <nav className="tabs" role="tablist">
      {tabs.map((t, i) => {
        const prev = tabs[i - 1]
        return (
          <Fragment key={t.id}>
            {prev?.pipeline && t.pipeline && (
              <span className="tab-arrow" aria-hidden>
                →
              </span>
            )}
            {prev?.pipeline && !t.pipeline && <span className="tab-divider" aria-hidden />}
            <button
              role="tab"
              aria-selected={active === t.id}
              className={`tab ${active === t.id ? 'active' : ''}`}
              onClick={() => onSelect(t.id)}
            >
              <span aria-hidden>{t.emoji}</span> {t.label}
              {t.alert && (
                <span className={`tab-alert ${t.alert === '!' ? 'warn' : ''}`} title={t.alertTitle}>
                  {t.alert}
                </span>
              )}
            </button>
          </Fragment>
        )
      })}
    </nav>
  )
}
