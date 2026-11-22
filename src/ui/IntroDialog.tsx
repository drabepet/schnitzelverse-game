import { useEffect, type ReactNode } from 'react'
import { setIntroSeen } from '../engine/actions'
import { useGame } from '../game/store'
import { GAME_VERSION } from '../version'
import { Logo } from './Logo'

const RULES: { emoji: string; title: string; text: ReactNode }[] = [
  { emoji: '🍳', title: 'Make', text: <>Every schnitzel goes 🔨 pound → 🥣 bread → 🍳 fry. Click to do it yourself.</> },
  { emoji: '🚲', title: 'Sell', text: <>Deliver to places that ordered. Hot ones earn the most and make fans; cold ones sell for less.</> },
  { emoji: '🛒', title: 'Restock', text: <>Ingredients come from Mrs. Horáková’s corner shop. Run out and the kitchen stops.</> },
  {
    emoji: '👨‍👩‍👧',
    title: 'Hire the family',
    text: <>Helpers cook and deliver by themselves, even while you’re away. This is how the game plays itself.</>,
  },
  { emoji: '⭐', title: 'Expand', text: <>Reputation plus money unlock the next place: the street, the block, the town…</> },
  {
    emoji: '✨',
    title: 'Franchise',
    text: <>Reach the whole town, sell up and start over with Golden Crumbs for permanent perks. Each run goes faster and further.</>,
  },
]

const STEPS: { text: ReactNode; star?: boolean }[] = [
  {
    text: (
      <>
        In the <b>🏚️ Garage</b> tab press <b>🍳 Cook all three</b>: pound, bread and fry in one go.
      </>
    ),
  },
  {
    text: (
      <>
        In the <b>🚶 On foot</b> tab press <b>Deliver</b> next to the neighbours. They pay. Mrs. Novák is hooked.
      </>
    ),
  },
  {
    text: (
      <>
        Ingredients running low? Press <b>🛒 Restock</b> in the <b>🛒 Corner shop</b> tab.
      </>
    ),
  },
  {
    star: true,
    text: (
      <>
        Save up <b>$60</b> for <b>📝 Auntie’s shopping list</b> (🛒 Corner shop tab). She restocks by herself: no more kitchen standing
        still because the eggs ran out.
      </>
    ),
  },
  {
    text: (
      <>
        Hire <b>Uncle with a mallet</b> ($15) in the 🏚️ Garage tab. Then Grandma, the cousin and the kid on a bike.
      </>
    ),
  },
  {
    text: (
      <>
        Watch <b>Next</b> in the sidebar: what the next place needs, and how long it will take.
      </>
    ),
  },
]

const JOURNEY: { emoji: string; chapter: string; text: string }[] = [
  { emoji: '🏚️', chapter: 'Chapter 1 · The garage', text: 'A pan, a family and the whole town.' },
  { emoji: '🚜', chapter: 'Chapter 2 · Grandpa’s farm', text: 'Grow your own pigs, wheat, eggs and sunflowers.' },
  { emoji: '🚚', chapter: 'Chapter 3 · On the road', text: 'Vans, trains and planes: the country, then the planet.' },
  { emoji: '🚀', chapter: 'Chapter 4 · The stars', text: 'Orbit, the Moon, Mars… Grandma says the stars look hungry.' },
  { emoji: '🍋', chapter: 'Chapter 5 · The Schnitzelverse', text: 'Beyond the Sun. Grandma won’t say more.' },
]

/** The welcome page: a little story, where it all goes, how it works, and how to start. */
export function IntroDialog() {
  const game = useGame()
  const open = !game.state.introSeen
  const close = () => game.act((st) => setIntroSeen(st, true))

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') game.act((st) => setIntroSeen(st, true))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, game])

  if (!open) return null

  return (
    <div className="overlay intro-overlay" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="dialog intro">
        <div className="intro-hero">
          <div className="intro-hero-art">
            <Logo size={104} />
          </div>
          <div>
            <p className="intro-kicker">Welcome to</p>
            <h1 id="intro-title">Schnitzelverse</h1>
            <p className="intro-tagline">From Grandma’s frying pan to every table in the galaxy.</p>
          </div>
          <span className="intro-version">v{GAME_VERSION}</span>
        </div>

        <div className="intro-body">
          <div className="intro-columns">
            <section className="intro-card intro-story">
              <h2>📜 How it started</h2>
              <p>
                It started, as all great empires do, in a garage. Between Dad’s bike and a box of Christmas lights you found
                Grandma’s old frying pan, still smelling faintly of 1974.
              </p>
              <p>Mum’s fridge held two pork cutlets, some flour, three eggs and a bag of breadcrumbs. Grandma looked at the pan, looked at you, and said only:</p>
              <blockquote>“Thin. Golden. Never soggy.”</blockquote>
              <p>
                Now the neighbours are leaning over the fence, sniffing. Today: the street. Tomorrow: the town. Some day: every
                table on the planet, and then the stars.
              </p>
            </section>

            <section className="intro-card intro-journey">
              <h2>🗺️ Where it goes</h2>
              <ol>
                {JOURNEY.map((j) => (
                  <li key={j.chapter}>
                    <span className="journey-dot" aria-hidden>
                      {j.emoji}
                    </span>
                    <div>
                      <b>{j.chapter}</b>
                      <span className="muted">{j.text}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <section>
            <h2 className="intro-section">⚙️ How it works</h2>
            <div className="intro-rules">
              {RULES.map((r) => (
                <div key={r.title} className="intro-rule">
                  <span className="intro-rule-icon" aria-hidden>
                    {r.emoji}
                  </span>
                  <div>
                    <b>{r.title}</b>
                    <p>{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="intro-section">⏱️ Your first minutes</h2>
            <ol className="intro-steps">
              {STEPS.map((step, i) => (
                <li key={i} className={step.star ? 'star' : ''}>
                  <span className="step-num" aria-hidden>
                    {i + 1}
                  </span>
                  <div>
                    {step.star && <span className="step-badge">⭐ Best first buy</span>}
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="intro-footer">
          <p className="muted">
            👵 Grandma whispers tips in the sidebar until Auntie’s list is on the fridge. You can read this again any time: ☰ Game → How
            to play.
          </p>
          <button className="primary intro-start" onClick={close}>
            Fire up the pan! 🔥
          </button>
        </div>
      </div>
    </div>
  )
}
