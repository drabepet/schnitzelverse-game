import { setBadgePopups, setChapterColours, setEffects, setNotationSetting, setUiScale, setUpdateRate } from '../engine/actions'
import { UPDATE_RATES, type EffectsLevel, type UiScale } from '../engine/state'

const EFFECTS: { value: EffectsLevel; label: string; hint: string }[] = [
  { value: 'full', label: 'Full', hint: 'Crumbs, sizzles and a big moment for each new chapter.' },
  { value: 'calm', label: 'Calm', hint: 'Only the big moments: a new chapter and selling the business.' },
  { value: 'off', label: 'Off', hint: 'No effects at all.' },
]

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
            {(['short', 'named', 'scientific'] as const).map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={s.notation === n}
                className={s.notation === n ? 'on' : ''}
                onClick={() => game.act((st) => setNotationSetting(st, n))}
              >
                {n === 'short' ? 'Short' : n === 'named' ? 'Named' : 'Scientific'}
              </button>
            ))}
          </div>
          <span className="muted small">
            For example {fmt(1_234_567)} and {fmt(4.56e15)}.{s.notation === 'named' && ' Small spaces (the sidebar, tiles, buttons) keep short numbers.'}
          </span>
        </div>

        <div className="setting">
          <span>Display speed</span>
          <div className="buy-amount" role="radiogroup" aria-label="Display speed">
            {UPDATE_RATES.map((r) => (
              <button
                key={r}
                role="radio"
                aria-checked={s.updateRate === r}
                className={s.updateRate === r ? 'on' : ''}
                onClick={() => game.act((st) => setUpdateRate(st, r))}
              >
                {r === 20 ? 'Smooth' : r === 10 ? 'Relaxed' : 'Calm'}
              </button>
            ))}
          </div>
          <span className="muted small">
            How often numbers update: {s.updateRate} times a second. The game runs just as fast either way; slower is easier on your
            eyes and battery.
          </span>
        </div>

        <div className="setting">
          <span>Effects</span>
          <div className="buy-amount" role="radiogroup" aria-label="Effects">
            {EFFECTS.map((o) => (
              <button
                key={o.value}
                role="radio"
                aria-checked={s.effects === o.value}
                className={s.effects === o.value ? 'on' : ''}
                onClick={() => game.act((st) => setEffects(st, o.value))}
              >
                {o.label}
              </button>
            ))}
          </div>
          <span className="muted small">{EFFECTS.find((o) => o.value === s.effects)?.hint} Your system’s “reduce motion” setting is respected too.</span>
        </div>

        <label className="setting setting-check">
          <input type="checkbox" checked={s.chapterColours} onChange={(e) => game.act((st) => setChapterColours(st, e.target.checked))} />
          <span>Each chapter gives the game its own colours</span>
        </label>

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
