import { ITEMS } from '../engine/content'
import { fmt, fmtCompact, fmtInt, fmtTime } from '../engine/format'
import { D } from '../engine/decimal'
import { pendingCrumbs } from '../engine/rules'
import { useGame } from '../game/store'
import { flow, ingredients, nextGoal } from './insights'
import { ManagerToggles } from './Managers'
import { BadgeQuote } from './BadgeQuote'
import { guideHint } from './guide'
import { MANAGERS } from '../engine/automation'
import { crispness, perkLevel } from '../engine/rules'

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

  const hint = guideHint(s)

  return (
    <aside className="sidebar" aria-label="Status">
      <div className="sb-section sb-key">
        <Stat label="Money" value={'$' + fmtCompact(s.money)} sub={`+$${fmtCompact(game.rates.income)}/s`} />
        <Stat label="Reputation" value={fmtCompact(s.reputation)} sub={`+${fmtCompact(game.reputationRate)}/s`} />
        {showCrumbs && (
          <Stat label="Crumbs" value={fmtCompact(D(p.crumbs).floor())} sub={`+${fmtCompact(D(pendingCrumbs(s)).floor())} if sold`} />
        )}
        <Stat label="Served" value={fmtCompact(D(s.stats.served).floor())} sub={`${fmtCompact(game.rates.deliver)}/s`} />
      </div>

      {hint && (
        <div className="sb-section guide" role="status">
          👵 {hint.text}
        </div>
      )}

      {MANAGERS.some((m) => perkLevel(s, m.id) > 0) && (
        <div className="sb-section sb-detail">
          <div className="sb-title">🤖 Managers</div>
          <ManagerToggles compact />
        </div>
      )}

      <div className="sb-section sb-detail">
        <div className="sb-title">Per second</div>
        <Row label="Orders" value={fmt(f.demand)} limit={f.bottleneck === 'customers'} />
        <Row label="Fry" value={`${fmt(f.fry)} of ${fmt(f.kitchenMax)}`} limit={f.bottleneck === 'kitchen'} />
        <Row label="Deliver" value={`${fmt(f.deliver)} of ${fmt(f.deliverMax)}`} limit={f.bottleneck === 'delivery'} />
        {s.crisp.unlocked && <Row label="🥇 Crispness" value={`+${Math.round(crispness(s) * 100)}%`} />}
      </div>

      <div className="sb-section sb-detail">
        <div className="sb-title">Ingredients</div>
        {ingredients(game).map((i) => (
          <Row
            key={i.id}
            label={`${ITEMS[i.id].emoji} ${ITEMS[i.id].name}`}
            value={`${fmtInt(i.stock)}${i.source ? ` · ${i.source}` : ''}`}
            limit={i.source === 'short' || (!i.source && i.stock < 1)}
          />
        ))}
        <Row label="🔥 Hot / 🧊 cold" value={`${fmtInt(s.items.hot)} / ${fmtInt(s.items.cold)}`} />
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
              <Progress label="⭐" value={goal.rep} />
              <Progress label="$" value={goal.money} />
              <div className="muted small">
                {goal.rep >= 1 && goal.money >= 1
                  ? 'Ready to expand!'
                  : goal.eta === null
                    ? s.stats.served.lt(1)
                      ? 'Cook and deliver to get going'
                      : 'Not getting closer yet'
                    : `About ${fmtTime(goal.eta)} at this pace`}
              </div>
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

function Row({ label, value, limit }: { label: string; value: string; limit?: boolean }) {
  return (
    <div className={`sb-row ${limit ? 'limit' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div className="sb-progress">
      <span>{label}</span>
      <div className="mini-bar">
        <div style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <span>{Math.round(value * 100)}%</span>
    </div>
  )
}
