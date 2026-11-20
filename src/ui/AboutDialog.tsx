import { GAME_VERSION } from '../version'
import { Logo } from './Logo'

/** ☰ Game → About: what this is, why it exists, and which version you're playing. */
export function AboutDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="about-title" onClick={onClose}>
      <div className="dialog about" onClick={(e) => e.stopPropagation()}>
        <h2 id="about-title">
          <Logo size={40} /> Schnitzelverse
        </h2>
        <div className="about-version">
          Version <b>{GAME_VERSION}</b> <span className="muted">· licence to grill</span>
        </div>

        <p>
          An idle game about one frying pan, one garage and one very ambitious family. Pound, bread, fry, deliver. Hire
          Grandma. Then a farm, a fleet of trucks, a franchise empire, and finally rockets full of schnitzel.
        </p>

        <h3>Why?</h3>
        <p>
          Somewhere out there, someone is eating a soggy schnitzel. Right now. As you read this. On the Moon, nobody has
          ever had one at all. Grandma finds both of these facts unacceptable, and frankly, so should you.
        </p>
        <p className="muted">
          It plays itself while you’re away (up to 8 hours, more with the Night shift perk), saves in your browser every
          few seconds, and never needs an account.
        </p>

        <h3>In short</h3>
        <ul className="about-list">
          <li>🍳 Make schnitzels by hand, then hire the family to do it for you.</li>
          <li>🚚 Sell to ever bigger places: the street, the town, the planet, the stars.</li>
          <li>✨ Franchise: sell up, start over, keep Golden Crumbs for permanent perks.</li>
          <li>🚜 Grow your own ingredients, 🛣️ run a fleet, 🥇 perfect the crust.</li>
        </ul>

        <p className="muted small">
          Saves stay in this browser: use ☰ Game → Save to file to keep a copy or move to another computer.
        </p>

        <div className="btns">
          <button className="primary" onClick={onClose}>
            Back to the frying pan
          </button>
        </div>
      </div>
    </div>
  )
}
