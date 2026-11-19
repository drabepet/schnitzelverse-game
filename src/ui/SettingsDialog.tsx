import { setBadgePopups, setNotationSetting, setUiScale } from '../engine/actions'
import type { UiScale } from '../engine/state'

const SCALES: { value: UiScale; label: string }[] = [
  { value: 'auto', label: 'Fit to window' },
  { value: 'small', label: 'Small' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
  { value: 'xl', label: 'Extra large' },
]
import { fmt } from '../engine/format'
import { offlineCap } from '../engine/rules'
import { fmtTime } from '../engine/format'
import { useGame } from '../game/store'

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const game = useGame()
  const s = game.state.settings
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Settings" onClick={onClose}>
      <div className="dialog settings" onClick={(e) => e.stopPropagation()}>
        <h2>⚙️ Settings</h2>

        <div className="setting">
          <span>Size</span>
          <div className="buy-amount" role="radiogroup" aria-label="Interface size">
            {SCALES.map((o) => (
              <button
                key={o.value}
                role="radio"
                aria-checked={s.uiScale === o.value}
                className={s.uiScale === o.value ? 'on' : ''}
                onClick={() => game.act((st) => setUiScale(st, o.value))}
              >
                {o.label}
              </button>
            ))}
          </div>
          <span className="muted small">Fit to window grows everything with your browser window. Browser zoom (Ctrl/⌘ +/−) works too.</span>
        </div>

        <div className="setting">
          <span>Numbers</span>
          <div className="buy-amount" role="radiogroup" aria-label="Number format">
            {(['short', 'scientific'] as const).map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={s.notation === n}
                className={s.notation === n ? 'on' : ''}
                onClick={() => game.act((st) => setNotationSetting(st, n))}
              >
                {n === 'short' ? 'Short' : 'Scientific'}
              </button>
            ))}
          </div>
          <span className="muted small">For example {fmt(1_234_567)}</span>
        </div>

        <label className="setting setting-check">
          <input
            type="checkbox"
            checked={s.badgePopups}
            onChange={(e) => game.act((st) => setBadgePopups(st, e.target.checked))}
          />
          <span>Pop-up when you earn a badge</span>
        </label>

        <p className="hint">
          While you’re away the family covers for you for up to {fmtTime(offlineCap(game.state))}. The Night shift perk
          makes that longer.
        </p>

        <div className="btns">
          <button className="primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
