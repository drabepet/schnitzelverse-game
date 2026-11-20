import { useEffect, useState } from 'react'
import { BADGE_BY_ID, BADGE_CATEGORIES, BADGES, unseenBadges } from '../engine/badges'
import { fmtTime } from '../engine/format'
import { markBadgesSeen } from '../engine/actions'
import { useGame } from '../game/store'
import { BADGE_BONUS } from '../engine/badgeBonus'
import { badgeBonus } from '../engine/rules'

export function BadgesPage() {
  const game = useGame()
  const s = game.state
  const earnedCount = Object.keys(s.badges).length
  // Badges that were new when you opened the page stay highlighted until you leave it
  // (and so do any earned while you're looking).
  const [fresh] = useState(() => new Set(unseenBadges(s)))
  const [openedAt] = useState(() => s.stats.playtime)
  const isNew = (id: string) => fresh.has(id) || (s.badges[id] ?? -1) >= openedAt
  const newList = BADGES.filter((b) => s.badges[b.id] !== undefined && isNew(b.id))

  const jumpTo = (id: string) => {
    const el = document.getElementById(`badge-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.remove('flash')
    void el.offsetWidth // restart the animation
    el.classList.add('flash')
  }

  // Looking at the page clears the "new" marker on the tab.
  useEffect(() => {
    if (s.badgesSeen !== earnedCount) game.act((st) => markBadgesSeen(st))
  }, [earnedCount, s.badgesSeen, game])

  const pct = Math.round((earnedCount / BADGES.length) * 100)

  return (
    <section className="panel badges-page">
      <div className="badges-head">
        <h2>🏅 Badges</h2>
        <span className="muted">
          {earnedCount} of {BADGES.length} · {pct}%
        </span>
      </div>
      <div className="bar badges-bar">
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="hint">
        Badges survive every franchise. Some are secret. The hard ones (an hour of play or more) also raise all your prices:
        right now <b>+{Math.round(badgeBonus(s) * 100)}%</b>.
      </p>

      {newList.length > 0 && (
        <div className="new-badges" role="status">
          <span className="new-badges-title">✨ New since your last visit:</span>
          {newList.map((b) => (
            <button key={b.id} className="new-badge-chip" onClick={() => jumpTo(b.id)} title="Show this badge">
              {BADGE_BY_ID[b.id].emoji} {b.name}
            </button>
          ))}
        </div>
      )}

      {BADGE_CATEGORIES.map((cat) => {
        const list = BADGES.filter((b) => b.category === cat.id)
        const got = list.filter((b) => s.badges[b.id] !== undefined).length
        return (
          <div key={cat.id} className="badge-group">
            <h3>
              {cat.name} <span className="muted">{got}/{list.length}</span>
            </h3>
            <div className="badge-grid">
              {list.map((b) => {
                const at = s.badges[b.id]
                const earned = at !== undefined
                const hidden = !earned && b.secret
                return (
                  <div key={b.id} id={`badge-${b.id}`} className={`badge ${earned ? 'earned' : 'locked'} ${earned && isNew(b.id) ? 'new' : ''}`}>
                    {earned && isNew(b.id) && <span className="new-tag">NEW</span>}
                    <div className="badge-emoji">{hidden ? '❓' : b.emoji}</div>
                    <div className="badge-text">
                      <div className="badge-name">{hidden ? 'Secret badge' : b.name}</div>
                      <div className="badge-goal">{hidden ? 'Nobody knows. Not even Grandma.' : b.goal}</div>
                      {earned && <div className="badge-flavor">{b.flavor}</div>}
                      {earned && <div className="badge-when">Earned at {fmtTime(at)} of play</div>}
                      {BADGE_BONUS[b.id] && !hidden && (
                        <div className={`badge-bonus ${earned ? '' : 'muted'}`}>💰 +{Math.round(BADGE_BONUS[b.id] * 100)}% income</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </section>
  )
}
