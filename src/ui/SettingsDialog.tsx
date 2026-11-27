import {
  setBadgePopups,
  setChapterColours,
  setEffects,
  setMusicVolume,
  setMuteHidden,
  setNotationSetting,
  setSoundMuted,
  setSoundVolume,
  setUiScale,
  setUpdateRate,
} from '../engine/actions'
import { chapterNumber } from '../engine/rules'
import { chapterTune, setSoundSettings, sfx } from './sound'
import { useEscape } from './useEscape'
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
import type { GameState } from '../engine/state'
import { fmtTime } from '../engine/format'
import { useGame } from '../game/store'

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  useEscape(onClose)
  const game = useGame()
  const s = game.state.settings
  /** Change a sound setting and hear it straight away (the next render would be a moment too late). */
  const sound = (change: (st: GameState) => void, sample?: () => void) => {
    game.act(change)
    setSoundSettings(game.state.settings)
    sample?.()
  }
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

        <div className="setting">
          <span>Sound</span>
          <label className="volume">
            <span>Effects</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(s.soundVolume * 100)}
              aria-label="Sound effects volume"
              onChange={(e) => sound((st) => setSoundVolume(st, Number(e.target.value) / 100), () => sfx('buy'))}
            />
            <span className="num">{Math.round(s.soundVolume * 100)}%</span>
          </label>
          <label className="volume">
            <span>Music</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(s.musicVolume * 100)}
              aria-label="Music volume"
              onChange={(e) => sound((st) => setMusicVolume(st, Number(e.target.value) / 100))}
              onPointerUp={() => chapterTune(chapterNumber(game.state))}
              onKeyUp={() => chapterTune(chapterNumber(game.state))}
            />
            <span className="num">{Math.round(s.musicVolume * 100)}%</span>
          </label>
          <span className="muted small">
            Effects: your clicks, buying, selling, badges and new places. Music: a short tune when you reach a new chapter. The game running
            by itself makes no sound.
          </span>
        </div>

        <label className="setting setting-check">
          <input type="checkbox" checked={s.soundMuted} onChange={(e) => sound((st) => setSoundMuted(st, e.target.checked))} />
          <span>Mute all sound (the 🔊 button at the top does the same)</span>
        </label>

        <label className="setting setting-check">
          <input type="checkbox" checked={s.muteHidden} onChange={(e) => sound((st) => setMuteHidden(st, e.target.checked))} />
          <span>Quiet while the game’s tab is in the background</span>
        </label>

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
