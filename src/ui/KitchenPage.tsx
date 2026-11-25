// The kitchen tab: one column per step, like the family tree. Each station
// has its person (whose look changes as their crew upgrades), the step
// itself, hiring and its own gear. Above: cook all three and the stock;
// below: what helps the whole kitchen, and crispness.
import { BUFFER_SECONDS, ITEMS, MIN_BUFFERS, STAGE_IDS, STAGES, UPGRADES, WORKERS, type ItemId, type StageId } from '../engine/content'
import { fmt, fmtCompact, fmtShort } from '../engine/format'
import { clickStage, cookAll, hireWorker, missingForCookAll } from '../engine/actions'
import { clickAmount, getMods, meets, stageBuffer, stageInputs, taskCapacity, workerPlan, type Mods } from '../engine/rules'
import { stationOf } from '../engine/tiers'
import { workerLook } from '../engine/names'
import { useGame, type GameStore } from '../game/store'
import type { GameState } from '../engine/state'
import { Why } from './Why'
import { floatText } from './juice'
import { HintButton } from './HintButton'
import { guideHint } from './guide'
import { BuyAmountPicker, BuyLabel } from './BuyAmount'
import { GearList } from './FarmGear'
import { CountGoal } from './CountGoal'
import { UpgradesPanel } from './UpgradesPanel'
import { QualityPanel } from './QualityPanel'
import { affordShare, firstReason, needMoney, needRequirement } from './reasons'
import { useSteady } from './useSteady'

const STOCK: ItemId[] = ['cutlet', 'breaded', 'hot', 'cold']

/** Each station's own gear, cheapest first (the order you'd buy it in): built once. */
const GEAR_OF = new Map(STAGE_IDS.map((id) => [id, UPGRADES.filter((u) => stationOf(u) === id).sort((a, b) => a.cost - b.cost)]))

export function KitchenPage() {
  const game = useGame()
  const s = game.state
  const mods = getMods(s)
  // The slowest step (with staff), held so it doesn't flicker on a tie.
  const caps = STAGE_IDS.map((id) => taskCapacity(s, id, mods).toNumber())
  const min = Math.min(...caps)
  const slowNow = min > 0 && caps.filter((c) => c <= min * 1.02).length < 3 ? STAGE_IDS[caps.indexOf(min)] : null
  const slowest = useSteady(slowNow)

  return (
    <div className="kitchen-page">
      <KitchenHead game={game} s={s} />
      <div className="stations">
        {STAGE_IDS.map((id) => (
          <Station key={id} id={id} game={game} s={s} mods={mods} slowest={slowest === id} />
        ))}
      </div>
      <div className="tab-grid">
        <UpgradesPanel pillar="making" title="🧰 Whole kitchen" only={(u) => !stationOf(u)} />
        <QualityPanel />
      </div>
    </div>
  )
}

/** Cook all three, the hint and what's waiting between the steps. */
function KitchenHead({ game, s }: { game: GameStore; s: GameState }) {
  const missing = missingForCookAll(s)
  const hint = guideHint(s)
  return (
    <section className="panel panel-kitchen kitchen-head">
      <div className="panel-head">
        <h2>🍳 Kitchen</h2>
        <div className="kitchen-head-actions">
          <BuyAmountPicker />
          <HintButton
            className={`primary ${hint?.target === 'cook' ? 'pulse' : ''}`}
            title="Cook all three"
            explain="Pounds, breads and fries in one click: a whole schnitzel from raw meat, the same as pressing all three step buttons."
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
      </div>
      <p className="hint">
        Pound it thin, bread it, fry it golden. Each station has its own person, helpers and gear, with new gear at every place you reach
        (🔗 helps the next step, ✨ better schnitzel). 🎯 More helpers at a station make every one faster. Helpers keep working while you’re away.
      </p>
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

/** One step: who runs it, the step itself, hiring and its gear. */
function Station({ id, game, s, mods, slowest }: { id: StageId; game: GameStore; s: GameState; mods: Mods; slowest: boolean }) {
  const stage = STAGES[id]
  const worker = WORKERS.find((w) => w.task === id)!
  const look = workerLook(s, worker.id)
  const plan = workerPlan(s, worker.id)
  const inputs = Object.entries(stageInputs(s, id)) as [ItemId, number][]
  const missing = inputs.filter(([item, qty]) => s.items[item].lt(qty)).map(([item]) => item)
  const capacity = taskCapacity(s, id, mods).toNumber()
  const actual = game.rates[id]
  const starved = capacity > 0 && actual < capacity * 0.5 && missing.length > 0
  const staff = s.workers[worker.id]
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
    <section className={`panel station ${starved ? 'starved' : ''}`}>
      <div className="station-head">
        <span className="station-emoji">{look.emoji}</span>
        <div className="station-who">
          <b>{look.name}</b>
          <span className="muted small">
            {stage.emoji} {stage.name} · <span className="num">×{fmtCompact(staff)}</span>
          </span>
        </div>
        <span className={`station-slow ${slowest ? '' : 'quiet'}`} title="The slowest step: the kitchen only goes as fast as this one.">
          🐢
        </span>
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
        className={`primary station-click ${id === 'fry' && actual > 0 ? 'sizzle' : ''}`}
        whyNot={
          missing.length
            ? `Missing ${missing.map((m) => `${ITEMS[m].emoji} ${ITEMS[m].name.toLowerCase()}`).join(', ')}. ${
                missing.some((m) => m === 'cutlet' || m === 'breaded') ? 'Do the step before first.' : 'Restock in the 🛒 Corner shop.'
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
            {fmtCompact(actual, true)}/{fmtCompact(capacity, true)} per s
            <Why k={id} label={`${stage.name} speed`} />
          </>
        ) : (
          <span className="muted">no helpers yet</span>
        )}
      </div>
      <div
        className={`stage-status small ${status.cls}`}
        title={`Helpers keep about ${BUFFER_SECONDS} seconds of work ready for the next step (at least ${MIN_BUFFERS[id]}), then pause: cooking to order, so nothing goes cold.`}
      >
        {status.text || ' '}
      </div>

      <div className="station-hire">
        <span className="small muted" title={look.flavor}>
          {fmt(worker.rate * mods.speed[id])}/s each
          <Why k={id} label={`${look.name} speed`} base={`${fmt(worker.rate)}/s`} />
        </span>
        <HintButton
          whyNot={firstReason(needRequirement(s, worker.requires), needMoney(s, plan.cost, game.rates.income))}
          progress={meets(s, worker.requires) ? affordShare(s.money, plan.cost) : undefined}
          className={`buy-btn ${guideHint(s)?.target === 'hire' && worker.id === 'uncle' ? 'pulse' : ''}`}
          onClick={() => game.act((st) => hireWorker(st, worker.id, st.settings.buyAmount))}
        >
          <BuyLabel verb="Hire" plan={plan} />
        </HintButton>
      </div>

      <CountGoal count={staff} name={look.name} />

      <div className="station-gear">
        <div className="owned-title muted small">{stage.emoji} Gear</div>
        <GearList gear={GEAR_OF.get(id) ?? []} />
      </div>
    </section>
  )
}
