import { useState } from 'react'
import { BADGE_BY_ID } from '../engine/badges'
import { useGame } from '../game/store'

/** How long (seconds of play) a new badge stays on screen. */
const SHOW_FOR = 6

/** Pop-ups for badges earned in the last few seconds. */
export function BadgeToasts() {
  const { state } = useGame()
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())
  const now = state.stats.playtime
  const recent = Object.entries(state.badges)
    .filter(([id, at]) => now - at < SHOW_FOR && !dismissed.has(id) && BADGE_BY_ID[id])
    .slice(-3)

  if (!recent.length || !state.settings.badgePopups) return null
  return (
    <div className="toasts" aria-live="polite">
      {recent.map(([id]) => {
        const b = BADGE_BY_ID[id]
        return (
          <button key={id} className="toast" onClick={() => setDismissed((d) => new Set(d).add(id))}>
            <span className="toast-emoji">{b.emoji}</span>
            <span>
              <span className="toast-title">Badge unlocked: {b.name}</span>
              <span className="toast-text">{b.flavor}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
