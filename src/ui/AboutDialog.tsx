import { useEffect } from 'react'
import { CHANGELOG } from '../changelog'
import { GAME_VERSION } from '../version'
import { Logo } from './Logo'

/** ☰ Game → About & what's new: what this is, why it exists, and what changed in each version. */
export function AboutDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay intro-overlay" role="dialog" aria-modal="true" aria-labelledby="about-title" onClick={onClose}>
      <div className="dialog intro about" onClick={(e) => e.stopPropagation()}>
        <div className="intro-hero">
          <div className="intro-hero-art">
            <Logo size={104} />
          </div>
          <div>
            <p className="intro-kicker">About</p>
            <h1 id="about-title">Schnitzelverse</h1>
            <p className="intro-tagline">
              Version {GAME_VERSION} · <i>licence to grill</i>
            </p>
          </div>
          <button className="about-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="intro-body">
          <div className="about-columns">
            <section className="intro-card about-text">
              <h2>What is this?</h2>
              <p>
                An idle game about one frying pan, one garage and one very ambitious family. Pound, bread, fry, deliver. Hire Grandma.
                Then a farm, a fleet of trucks, a franchise empire, and finally rockets full of schnitzel.
              </p>
              <h2>Why?</h2>
              <p>
                Somewhere out there, someone is eating a soggy schnitzel. Right now. As you read this. On the Moon, nobody has ever had one
                at all. Grandma finds both of these facts unacceptable, and frankly, so should you.
              </p>
              <h2>Good to know</h2>
              <ul className="about-list">
                <li>It plays itself while you’re away: up to 8 hours, more with the Night shift perk.</li>
                <li>It saves in this browser every few seconds. No account, no sign-up.</li>
                <li>To move to another computer: ☰ Game → Saves → Keep a copy.</li>
              </ul>
            </section>

            <section className="intro-card about-news">
              <h2>What’s new</h2>
              <ol className="changelog">
                {CHANGELOG.map((entry, i) => (
                  <li key={entry.version} className={i === 0 ? 'latest' : ''}>
                    <span className="journey-dot" aria-hidden>
                      {entry.emoji}
                    </span>
                    <div>
                      <div className="changelog-head">
                        <b>{entry.title}</b>
                        <span className="changelog-version">v{entry.version}</span>
                        <span className="muted small">{entry.date}</span>
                        {i === 0 && <span className="new-pill">You’re playing this</span>}
                      </div>
                      <ul>
                        {entry.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>

        <div className="intro-footer">
          <p className="muted">Made with a lot of breadcrumbs. Thanks for playing!</p>
          <button className="primary intro-start" onClick={onClose}>
            Back to the frying pan 🍳
          </button>
        </div>
      </div>
    </div>
  )
}
