import { ITEMS, STAGE_IDS, STAGES, WORKERS, type ItemId } from '../engine/content'
import { fmt, fmtInt } from '../engine/format'
import { clickStage, cookAll, missingForCookAll, setBuffer } from '../engine/actions'
import { clickAmount, getMods, stageInputs, taskCapacity } from '../engine/rules'
import { useGame } from '../game/store'
import { Why } from './Why'
import { floatText } from './juice'
import { HintButton } from './HintButton'
import { guideHint } from './guide'

const STOCK: ItemId[] = ['cutlet', 'breaded', 'hot', 'cold']

export function KitchenPanel() {
  const game = useGame()
  const s = game.state
  const mods = getMods(s)
  const missing = missingForCookAll(s)
  const hint = guideHint(s)

  return (
    <section className="panel panel-kitchen">
      <div className="panel-head">
        <h2>🍳 Kitchen</h2>
        <HintButton
          className={`primary ${hint?.target === 'cook' ? 'pulse' : ''}`}
          title="Cook all three"
          explain="Pounds, breads and fries in one click: a whole schnitzel from raw meat, the same as pressing all three buttons below."
          whyNot={
            missing.length
              ? `Not enough ingredients for every step (missing ${missing.map((i) => ITEMS[i].emoji).join(' ')}). Do the steps one by one, or restock in the 🛒 Corner shop.`
              : null
          }
          onClick={(e) => {
            if (game.act((st) => cookAll(st))) floatText(e, '+🔥')
          }}
        >
          🍳 Cook all three
        </HintButton>
      </div>
      <p className="hint">Pound it thin, bread it, fry it golden. Click to do it yourself, or hire family to help.</p>

      <div className="pipeline">
        {STAGE_IDS.map((id) => {
          const stage = STAGES[id]
          const inputs = Object.entries(stageInputs(s, id)) as [ItemId, number][]
          const missing = inputs.filter(([item, qty]) => s.items[item].lt(qty)).map(([item]) => item)
          const capacity = taskCapacity(s, id, mods).toNumber()
          const actual = game.rates[id]
          const starved = capacity > 0 && actual < capacity * 0.5 && missing.length > 0
          const staff = WORKERS.filter((w) => w.task === id).reduce((n, w) => n + s.workers[w.id], 0)
          const waiting = s.items[stage.output].floor().toNumber()
          const paused = staff > 0 && !starved && waiting >= s.buffers[id]

          return (
            <div key={id} className={`stage ${starved ? 'starved' : ''}`}>
              <div className="stage-head">
                <span className="emoji big">{stage.emoji}</span>
                <span className="stage-name">{stage.name}</span>
              </div>
              <div className="recipe">
                {inputs.map(([item, qty]) => (
                  <span key={item} className={missing.includes(item) ? 'missing' : ''} title={ITEMS[item].name}>
                    {qty > 1 ? qty : ''}
                    {ITEMS[item].emoji}
                  </span>
                ))}
                <span className="arrow">→</span>
                <span title={ITEMS[stage.output].name}>{ITEMS[stage.output].emoji}</span>
              </div>
              <button
                className={`primary ${id === 'fry' && actual > 0 ? 'sizzle' : ''}`}
                disabled={missing.length > 0}
                onClick={(e) => {
                  if (game.act((st) => clickStage(st, id))) floatText(e, `+${fmt(clickAmount(id, mods))} ${ITEMS[stage.output].emoji}`)
                }}
              >
                {stage.verb} ×{fmt(clickAmount(id, mods))}
              </button>
              <div className="stage-foot">
                {staff > 0 ? (
                  <>
                    👥 {staff} · {fmt(actual)}/{fmt(capacity)} per s
                    <Why k={id} label={`${stage.name} speed`} />
                  </>
                ) : (
                  <span className="muted">no staff yet</span>
                )}
              </div>
              {starved && (
                <div className="warn">Waiting for {missing.map((m) => ITEMS[m].emoji).join(' ')}</div>
              )}
              {staff > 0 && (
                <label className="buffer" title="Staff stop once this many are waiting for the next step. Cooking to order avoids waste.">
                  Max
                  <input
                    type="number"
                    min={0}
                    value={s.buffers[id]}
                    onChange={(e) => game.act((st) => setBuffer(st, id, Number(e.target.value)))}
                  />
                  {ITEMS[stage.output].emoji}
                </label>
              )}
              {paused && <div className="muted small">⏸ Enough ready, waiting for orders</div>}
            </div>
          )
        })}
      </div>

      <div className="stock">
        {STOCK.map((id) => (
          <div key={id} className={`chip ${id}`} title={ITEMS[id].name}>
            {ITEMS[id].emoji} {ITEMS[id].name} <b>{fmtInt(s.items[id])}</b>
          </div>
        ))}
      </div>
    </section>
  )
}
