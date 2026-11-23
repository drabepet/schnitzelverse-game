import { ITEMS, type IngredientId } from '../engine/content'
import { fmtCompact, fmtTime } from '../engine/format'
import { D } from '../engine/decimal'
import { canFranchise, chapter2Unlocked, crispness, pendingCrumbs } from '../engine/rules'
import { useGame } from '../game/store'
import { adviceFor, flow, ingredients, nextGoal } from './insights'
import { goTo } from './goTo'
import { BadgeQuote } from './BadgeQuote'
import { SidebarManagers } from './SidebarManagers'
import { guideHint } from './guide'
import { useSteady } from './useSteady'

/** Longer than this to the next place (s), and the sidebar suggests selling. */
const LONG_WAIT = 3 * 3600

/**
 * Always visible, on every tab: the numbers you check most. On wide screens
 * it is a sticky column; on narrow ones it collapses to a strip of key figures.
 * (Buttons live in their panels: Restock in the shop, Cook in the kitchen…)
 */
export function StatusSidebar() {
  const game = useGame()
  const s = game.state
  const f = flow(game)
  const goal = nextGoal(game)
  const p = s.prestige
  const showCrumbs = p.unlocked || p.franchises > 0
  const bottleneck = useSteady(f.bottleneck)
  const short = useSteady(f.short.join(' ')).split(' ').filter(Boolean) as IngredientId[]
  const advice = adviceFor(bottleneck, chapter2Unlocked(s))

  // Hints and tips change at most every few seconds, so they don't blink.
  const hint = useSteady(guideHint(s)?.text ?? null)
  // A long wait for the next place: selling and coming back is usually quicker.
  const pending = pendingCrumbs(s)
  const slow = goal && !goal.locked && !(goal.rep >= 1 && goal.money >= 1) && (goal.eta === null || goal.eta > LONG_WAIT)
  const sellHint = useSteady(slow && canFranchise(s) && pending.gte(D(p.totalCrumbs).mul(0.25).max(1)), 10_000)

  return (
    <aside className="sidebar" aria-label="Status">
      <div className="sb-section sb-key">
        <Stat label="Money" value={'$' + fmtCompact(s.money)} sub={`+$${fmtCompact(game.rates.income)}/s`} />
        <Stat label="Reputation" value={fmtCompact(s.reputation)} sub={`+${fmtCompact(game.reputationRate)}/s`} />
        {showCrumbs && (
          <Stat label="Crumbs" value={fmtCompact(D(p.crumbs).floor())} sub={`+${fmtCompact(pending.floor())} if sold`} />
        )}
        <Stat label="Served" value={fmtCompact(D(s.stats.served).floor())} sub={`${fmtCompact(game.rates.deliver)}/s`} />
      </div>

      {hint && (
        <div className="sb-section guide" role="status">
          👵 {hint}
        </div>
      )}

      <SidebarManagers />

      <div className="sb-section sb-detail">
        <div className="sb-title">Per second</div>
        <Row label="Orders" value={fmtCompact(f.demand, true)} limit={bottleneck === 'customers'} title="What every place you sell to orders per second." />
        <Row
          label="Ingredients"
          value={Number.isFinite(f.supplyMax) ? `for ${fmtCompact(f.supplyMax, true)}` : '—'}
          limit={bottleneck === 'supply'}
          title="How many schnitzels per second the farm and the corner shop bring in ingredients for."
        />
        <Row label="Fry" value={`${fmtCompact(f.fry, true)} of ${fmtCompact(f.kitchenMax, true)}`} limit={bottleneck === 'kitchen'} title="Frying now, of what the kitchen's slowest step allows." />
        <Row label="Deliver" value={`${fmtCompact(f.deliver, true)} of ${fmtCompact(f.deliverMax, true)}`} limit={bottleneck === 'delivery'} title="Delivering now, of what helpers and the fleet can carry." />
        {s.crisp.unlocked && <Row label="🥇 Crispness" value={`+${Math.round(crispness(s) * 100)}%`} />}
        <button className="sb-advice" onClick={() => goTo({ tab: advice.tab })} title="Go to the tab where you fix it">
          <span className="sb-advice-text">
            {advice.text}
            {bottleneck === 'supply' && short.length > 0 && <> Short: {short.map((i) => ITEMS[i].emoji).join(' ')}.</>} →
          </span>
        </button>
      </div>

      <div className="sb-section sb-detail">
        <div className="sb-title">Ingredients</div>
        {ingredients(game).map((i) => (
          <Row
            key={i.id}
            label={`${ITEMS[i.id].emoji} ${ITEMS[i.id].name}`}
            value={`${fmtCompact(D(i.stock).floor(), true)}${i.source ? ` · ${i.source}` : ''}`}
            limit={i.source === 'short' || (!i.source && i.stock < 1)}
          />
        ))}
        <Row label="🔥 Hot / 🧊 cold" value={`${fmtCompact(s.items.hot.floor(), true)} / ${fmtCompact(s.items.cold.floor(), true)}`} />
      </div>

      {goal && (
        <div className="sb-section sb-detail">
          <div className="sb-title">
            Next: {goal.region.emoji} {goal.region.name}
          </div>
          {goal.locked ? (
            <div className="muted small">🔒 Needs {goal.region.requiresFranchises} franchises</div>
          ) : (
            <>
              <Progress label="⭐" value={goal.rep} slowest={goal.slowest === 'rep'} name="Reputation" />
              <Progress label="$" value={goal.money} slowest={goal.slowest === 'money'} name="Money" />
              <div className="muted small sb-goal-eta">
                {goal.rep >= 1 && goal.money >= 1
                  ? 'Ready to expand!'
                  : goal.eta === null
                    ? s.stats.served.lt(1)
                      ? 'Cook and deliver to get going'
                      : 'Not getting closer yet'
                    : `About ${fmtTime(goal.eta)} at this pace, waiting on ${goal.slowest === 'rep' ? 'reputation' : 'money'}`}
              </div>
              {sellHint && (
                <div className="sb-sell-hint">
                  ✨ Faster: franchise now (+{fmtCompact(pending.floor())} Golden Crumbs) and spend the crumbs. The next run gets here sooner.
                </div>
              )}
            </>
          )}
        </div>
      )}

      <BadgeQuote />
    </aside>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="sb-stat">
      <div className="sb-label">{label}</div>
      <div className="sb-value">{value}</div>
      <div className="sb-sub">{sub}</div>
    </div>
  )
}

function Row({ label, value, limit, title }: { label: string; value: string; limit?: boolean; title?: string }) {
  return (
    <div className={`sb-row ${limit ? 'limit' : ''}`} title={limit ? `${title ?? ''} This is what holds you back now.`.trim() : title}>
      <span>
        {limit && <span aria-label="holds you back">🐢 </span>}
        {label}
      </span>
      <span>{value}</span>
    </div>
  )
}

function Progress({ label, value, slowest, name }: { label: string; value: number; slowest: boolean; name: string }) {
  return (
    <div
      className={`sb-progress${slowest ? ' slowest' : ''}`}
      title={slowest ? `${name} is what holds you back: it takes the longest to get there.` : `${name}: ${Math.round(value * 100)}% of what the next place needs.`}
    >
      <span>{label}</span>
      <div className="mini-bar">
        <div style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <span>
        {slowest && <span aria-label="holds you back">🐢 </span>}
        {Math.round(value * 100)}%
      </span>
    </div>
  )
}
