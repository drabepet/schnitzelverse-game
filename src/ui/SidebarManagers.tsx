import { useEffect, useRef, useState } from 'react'
import { MANAGER_RANKS, type PerkId } from '../engine/content'
import { MANAGERS, describeManagerItems, managerRank, setManager } from '../engine/automation'
import { fmtMoney, fmtTime } from '../engine/format'
import { useGame } from '../game/store'
import { goTo } from './goTo'
import { doingNow, managerMood, MOOD_TEXT } from './managerStatus'

/** Pop-up width at the normal interface size (15px text). */
const POP_WIDTH = 270

/**
 * The sidebar's managers: one face per promoted family member with a dot
 * for what they're up to. Hover (or focus) for the details, click to switch
 * them on or off. The pop-up is pinned to the window (like the button hints),
 * so the scrolling sidebar can't cut it off. The full cards are on the
 * Franchise tab (⚙️).
 */
export function SidebarManagers() {
  const game = useGame()
  const s = game.state
  const [open, setOpen] = useState<{ id: PerkId; top: number; left: number; width: number } | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const owned = MANAGERS.filter((m) => managerRank(s, m.id) > 0)
  if (!owned.length) return null

  const show = (id: PerkId, el: HTMLElement) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const r = el.getBoundingClientRect()
      const width = POP_WIDTH * (parseFloat(getComputedStyle(document.documentElement).fontSize) / 15)
      const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8)
      setOpen({ id, top: r.bottom + 8, left, width })
    }, 250)
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    setOpen(null)
  }

  const m = open && owned.find((x) => x.id === open.id)
  const pop = (() => {
    if (!open || !m) return null
    const mood = managerMood(s, m.id)
    const rank = managerRank(s, m.id)
    const last = [...s.managerLog].reverse().find((e) => e.who === m.id)
    return (
      <span className="hint-pop sb-mgr-pop" role="tooltip" style={{ top: open.top, left: open.left, width: open.width }}>
        <b>
          {m.emoji} {m.name}
        </b>
        <span className="muted small">
          Rank {rank} · {MANAGER_RANKS[rank - 1]} · {MOOD_TEXT[mood]}
        </span>
        {mood !== 'off' && <span>{doingNow(s, m.id)}</span>}
        {last && (
          <span className="muted small">
            Last: {describeManagerItems(last.items)}
            {last.cost > 0 ? ` for ${fmtMoney(last.cost)}` : ''}, {fmtTime(Math.max(0, s.stats.playtime - last.t))} ago
          </span>
        )}
        <span className="sb-mgr-hint">Click to switch {mood === 'off' ? 'on' : 'off'}</span>
      </span>
    )
  })()

  return (
    <div className="sb-section sb-detail">
      <div className="sb-mgr-head">
        <span className="sb-title">🤖 Managers</span>
        <button
          className="sb-icon-btn"
          aria-label="Manager settings and log"
          title="Manager settings and log (Franchise tab)"
          onClick={() => goTo({ tab: 'franchise', anchor: 'family-at-work' })}
        >
          ⚙️
        </button>
      </div>
      <div className="sb-mgr-row">
        {owned.map((mgr) => {
          const mood = managerMood(s, mgr.id)
          const on = mood !== 'off'
          return (
            <button
              key={mgr.id}
              className={`sb-mgr ${mood}`}
              aria-pressed={on}
              aria-label={`${mgr.name}: ${MOOD_TEXT[mood]}. Click to switch ${on ? 'off' : 'on'}.`}
              onMouseEnter={(e) => show(mgr.id, e.currentTarget)}
              onMouseLeave={hide}
              onFocus={(e) => show(mgr.id, e.currentTarget)}
              onBlur={hide}
              onClick={() => game.act((st) => setManager(st, mgr.id, !on))}
            >
              <span className="sb-mgr-face" aria-hidden>
                {mgr.emoji}
              </span>
              <span className="sb-mgr-dot" aria-hidden />
            </button>
          )
        })}
      </div>
      {pop}
    </div>
  )
}
