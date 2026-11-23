import { BUFFER_SECONDS, ITEMS, MIN_BUFFERS, STAGE_IDS, STAGES, WORKERS, type ItemId } from '../engine/content'
import { fmt, fmtCompact, fmtShort } from '../engine/format'
import { clickStage, cookAll, missingForCookAll } from '../engine/actions'
import { clickAmount, getMods, stageBuffer, stageInputs, taskCapacity } from '../engine/rules'
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
          const buffer = stageBuffer(s, id, mods).toNumber()
          const paused = staff > 0 && !starved && waiting >= buffer
          // One status line, always there (empty or not), so the cards never jump.
          const status = starved
            ? { text: `Waiting for ${missing.map((m) => ITEMS[m].emoji).join(' ')}`, cls: 'warn' }
            : paused
              ? { text: `⏸ ${fmt(buffer, 0)} ready, waiting for the next step`, cls: 'muted' }
              : staff > 0 && actual > 0
                ? { text: '▶ Working', cls: 'muted' }
                : { text: '', cls: 'muted' }

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
              <HintButton
                className={`primary ${id === 'fry' && actual > 0 ? 'sizzle' : ''}`}
                whyNot={
                  missing.length
                    ? `Missing ${missing.map((m) => `${ITEMS[m].emoji} ${ITEMS[m].name.toLowerCase()}`).join(', ')}. ${
                        missing.some((m) => m === 'cutlet' || m === 'breaded')
                          ? 'Do the step before first.'
                          : 'Restock in the 🛒 Corner shop.'
                      }`
                    : null
                }
                onClick={(e) => {
                  if (game.act((st) => clickStage(st, id))) floatText(e, `+${fmt(clickAmount(id, mods))} ${ITEMS[stage.output].emoji}`)
                }}
              >
                {stage.verb} ×{fmtShort(clickAmount(id, mods))}
              </HintButton>
              <div className="stage-foot">
                {staff > 0 ? (
                  <>
                    👥 {staff} · {fmtCompact(actual, true)}/{fmtCompact(capacity, true)} per s
                    <Why k={id} label={`${stage.name} speed`} />
                  </>
                ) : (
                  <span className="muted">no staff yet</span>
                )}
              </div>
              <div
                className={`stage-status small ${status.cls}`}
                title={`Staff keep about ${BUFFER_SECONDS} seconds of work ready for the next step (at least ${MIN_BUFFERS[id]}), then pause: cooking to order, so nothing goes cold.`}
              >
                {status.text || '\u00a0'}
              </div>
            </div>
          )
        })}
      </div>

      <div className="stock">
        {STOCK.map((id) => (
          <div key={id} className={`chip ${id}`} title={ITEMS[id].name}>
            {ITEMS[id].emoji} {ITEMS[id].name} <b>{fmtCompact(s.items[id].floor(), true)}</b>
          </div>
        ))}
      </div>
    </section>
  )
}
