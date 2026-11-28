import { useEffect } from 'react'
import { setLemonSeen } from '../engine/actions'
import { fmtCompact, fmtTime } from '../engine/format'
import { useGame } from '../game/store'

/**
 * The epilogue's end: shown once, the first time everyone in every universe is
 * fed at once (stats.bestFed reaches 100%). Grandma's “Now, the lemon” pays off.
 */
export function LemonDialog() {
  const game = useGame()
  const s = game.state
  const open = s.stats.bestFed >= 1 && !s.lemonSeen

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') game.act((st) => setLemonSeen(st))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, game])

  if (!open) return null
  const close = () => game.act((st) => setLemonSeen(st))
  const numbers: [string, string][] = [
    ['Time played', fmtTime(s.stats.playtime)],
    ['Schnitzels served', fmtCompact(s.stats.served.floor())],
    ['Franchises', s.prestige.franchises.toLocaleString('en')],
  ]

  return (
    <div className="overlay intro-overlay" role="dialog" aria-modal="true" aria-labelledby="lemon-title">
      <div className="dialog intro finale">
        <div className="intro-hero finale-hero">
          <div className="intro-hero-art lemon-art" aria-hidden="true">
            🍋
          </div>
          <div>
            <p className="intro-kicker">Now, the lemon</p>
            <h1 id="lemon-title">Everyone is fed</h1>
            <p className="intro-tagline">Every order in every universe, served at once. Hot.</p>
          </div>
        </div>

        <div className="intro-body">
          <section className="intro-card finale-story">
            <p>
              For a moment nobody anywhere is waiting. Every plate in every universe has a schnitzel on it, thin and golden, and the queue at the end
              of everything is gone.
            </p>
            <p>
              Grandma wipes her hands on her apron, takes a lemon from her pocket, the same kind she always buys from Mrs. Horáková, and cuts it in
              two. She squeezes it over the very last plate. The whole of everything smells of it.
            </p>
            <blockquote>“There. Now it’s a schnitzel.”</blockquote>
          </section>

          <div className="finale-numbers">
            {numbers.map(([label, value]) => (
              <div key={label}>
                <span className="muted small">{label}</span>
                <b>{value}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="intro-footer">
          <p className="muted">That’s the whole story. The fryer stays on: badges, records and Grandma’s standards are still there to climb.</p>
          <button className="primary intro-start" onClick={close}>
            Keep frying 🍳
          </button>
        </div>
      </div>
    </div>
  )
}
