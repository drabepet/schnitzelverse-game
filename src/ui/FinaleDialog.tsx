import { useEffect } from 'react'
import { FINAL_REGION } from '../engine/content'
import { BADGE_BY_ID, BADGES } from '../engine/badges'
import { setFinaleSeen } from '../engine/actions'
import { fmtCompact, fmtTime } from '../engine/format'
import { useGame } from '../game/store'
import { Logo } from './Logo'

/** Who made it happen. Shown as the credits. */
const CREDITS: [string, string][] = [
  ['👵 Grandma', 'the recipe, the pan, the standards'],
  ['🔨 Uncle', 'every cutlet, pounded'],
  ['🍳 The cousins', 'frying, eyebrows not included'],
  ['🚲 The kid', 'deliveries, from the next street to the next galaxy'],
  ['🚜 Grandpa', 'pigs, wheat, sunflowers and hens on a thousand worlds'],
  ['🧔 Cousin Pavel', 'the cutting, and the polka'],
  ['🛒 Mrs. Horáková', 'never once closed for lunch (she did)'],
  ['🏠 Mrs. Novák', 'the very first customer'],
  ['🍋 You', 'everything else'],
]

/** The end of the road: shown once, the first time you reach the Schnitzelverse. */
export function FinaleDialog() {
  const game = useGame()
  const s = game.state
  const open = s.regions[FINAL_REGION].unlocked && !s.finaleSeen

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') game.act((st) => setFinaleSeen(st))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, game])

  if (!open) return null
  const close = () => game.act((st) => setFinaleSeen(st))
  const badges = Object.keys(s.badges).filter((id) => BADGE_BY_ID[id]).length
  const numbers: [string, string][] = [
    ['Time played', fmtTime(s.stats.playtime)],
    ['Schnitzels served', fmtCompact(s.stats.served.floor())],
    ['Money earned', '$' + fmtCompact(s.stats.earned)],
    ['Franchises', s.prestige.franchises.toLocaleString('en')],
    ['Badges', `${badges} of ${BADGES.length}`],
  ]

  return (
    <div className="overlay intro-overlay" role="dialog" aria-modal="true" aria-labelledby="finale-title">
      <div className="dialog intro finale">
        <div className="intro-hero finale-hero">
          <div className="intro-hero-art">
            <Logo size={104} />
          </div>
          <div>
            <p className="intro-kicker">The end of the pan</p>
            <h1 id="finale-title">You fed the Schnitzelverse</h1>
            <p className="intro-tagline">Every table in every universe. Thin. Golden. Never soggy.</p>
          </div>
        </div>

        <div className="intro-body">
          <section className="intro-card finale-story">
            <p>
              It started in a garage, between Dad’s bike and a box of Christmas lights. Two pork cutlets, some flour, three eggs and Grandma’s
              old pan.
            </p>
            <p>
              Now there is a schnitzel on every plate, on every planet, around every star, in every galaxy, in every universe there is. Somewhere
              very far away, someone takes the first bite and goes quiet for a moment.
            </p>
            <p>Grandma takes off her apron, just for a minute, looks at you and says only:</p>
            <blockquote>“Not bad. Now, the lemon.”</blockquote>
          </section>

          <div className="finale-numbers">
            {numbers.map(([label, value]) => (
              <div key={label}>
                <span className="muted small">{label}</span>
                <b>{value}</b>
              </div>
            ))}
          </div>

          <section>
            <h2 className="intro-section">🎬 Credits</h2>
            <ul className="finale-credits">
              {CREDITS.map(([who, what]) => (
                <li key={who}>
                  <b>{who}</b>
                  <span className="muted">{what}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="intro-footer">
          <p className="muted">
            That’s the end of the story, for now. The fryer keeps going: badges, perks and records are still there to chase.
          </p>
          <button className="primary intro-start" onClick={close}>
            Keep frying 🍳
          </button>
        </div>
      </div>
    </div>
  )
}
