import { CRISP_BASE_SKILL, CRISP_TEMP_BEST, CRISP_TEMP_MAX, CRISP_TEMP_MIN, OIL_LEVELS } from '../engine/content'
import { setCrisp } from '../engine/actions'
import { fmt } from '../engine/format'
import { crispness, crispSkill, fryerSpeed, getMods, oilLevel, temperatureQuality } from '../engine/rules'
import { useGame } from '../game/store'
import { UpgradesPanel } from './UpgradesPanel'

const pct = (x: number) => `${Math.round(x * 100)}%`

/** Crispness: unlocked with the next town. Prices and reputation × (1 + crispness). */
export function QualityPanel() {
  const game = useGame()
  const s = game.state
  if (!s.crisp.unlocked) return null
  const mods = getMods(s)
  const skill = crispSkill(s, mods.crisp)
  const temp = temperatureQuality(s.crisp.temperature)
  const oil = oilLevel(s)
  const q = crispness(s, mods.crisp)
  const speed = fryerSpeed(s)
  const t = s.crisp.temperature

  return (
    <section className="panel panel-quality">
      <h2>🥇 Crispness</h2>
      <p className="hint">
        A crisper schnitzel sells for more and makes more fans. Crispness = skill × fryer temperature × fresh oil.
      </p>

      <div className="crisp-score">
        <span className="crisp-value">+{pct(q)}</span>
        <span className="muted">price and reputation</span>
      </div>
      <div className="crisp-factors">
        <span title="Grandma’s tips plus technique">
          📖 skill <b>{fmt(skill, 2)}</b>
        </span>
        <span>×</span>
        <span title="How close the fryer is to 170 °C">
          🌡️ <b>{pct(temp)}</b>
        </span>
        <span>×</span>
        <span title="Fresher oil, crisper crust">
          🫗 <b>×{fmt(oil.quality, 1)}</b>
        </span>
      </div>

      <label className="crisp-control">
        <span>
          🌡️ Fryer <b>{t} °C</b>{' '}
          <span className="muted">
            {t === CRISP_TEMP_BEST
              ? '· just right'
              : t > CRISP_TEMP_BEST
                ? `· fries ${pct(speed - 1)} faster, edges burn`
                : `· fries ${pct(1 - speed)} slower, a bit soggy`}
          </span>
        </span>
        <input
          type="range"
          min={CRISP_TEMP_MIN}
          max={CRISP_TEMP_MAX}
          step={1}
          value={t}
          onChange={(e) => game.act((st) => setCrisp(st, Number(e.target.value), st.crisp.oil))}
        />
      </label>

      <div className="crisp-control">
        <span>🫗 Change the oil</span>
        <div className="buy-amount" role="radiogroup" aria-label="How often to change the oil">
          {OIL_LEVELS.map((level, i) => (
            <button
              key={level.name}
              role="radio"
              aria-checked={s.crisp.oil === i}
              className={s.crisp.oil === i ? 'on' : ''}
              title={`${level.oil} oil per schnitzel, crispness ×${level.quality}`}
              onClick={() => game.act((st) => setCrisp(st, st.crisp.temperature, i))}
            >
              {level.name}
            </button>
          ))}
        </div>
        <span className="muted small">
          Uses {oil.oil} 🫗 per schnitzel{oil.oil > 1 ? ': make sure the shop or farm keeps up' : ''}.
        </span>
      </div>

      <p className="hint">
        Skill starts at {CRISP_BASE_SKILL} (Grandma’s tips). Technique and the Crisp master perk raise it. Crispness is
        the first thing you can perfect; more will follow.
      </p>
      <UpgradesPanel quality />
    </section>
  )
}
