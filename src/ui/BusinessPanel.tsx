import { fmt, fmtMoney, fmtTime } from '../engine/format'
import { canFranchise, pendingCrumbs } from '../engine/rules'
import { useGame } from '../game/store'
import { flow, nextGoal } from './insights'

/** The business at a glance: this run, quality, what to fix, what's next. */
export function BusinessPanel() {
  const game = useGame()
  const s = game.state
  const f = flow(game)
  const goal = nextGoal(game)
  const run = s.run
  const hours = run.time / 3600
  const avg = run.time > 0 ? run.earned.toNumber() / run.time : 0
  const hotShare = run.served.gt(0) ? 1 - run.servedCold.div(run.served).toNumber() : 1
  const pending = pendingCrumbs(s)
  const franchise = s.prestige.unlocked || s.prestige.franchises > 0
  const doubles = canFranchise(s) && pending.gte(s.prestige.totalCrumbs.max(1))

  return (
    <section className="panel panel-business">
      <h2>📈 Business</h2>
      <div className="kpis">
        <Kpi label="This run" value={fmtTime(run.time)} sub={`${fmtMoney(run.earned)} earned`} />
        <Kpi label="Income" value={`${fmtMoney(game.rates.income)}/s`} sub={`average ${fmtMoney(avg)}/s`} />
        <Kpi
          label="Served hot"
          value={`${Math.round(hotShare * 100)}%`}
          sub={`⭐ +${fmt(game.reputationRate)}/s`}
          warn={hotShare < 0.8}
        />
        {franchise && (
          <Kpi
            label="Crumbs per hour"
            value={`✨ ${fmt(hours > 0.01 ? pending.toNumber() / hours : 0)}`}
            sub={`+${fmt(pending, 0)} if you sell now`}
          />
        )}
      </div>

      <p className="advice">🎯 {f.advice}</p>
      {doubles && <p className="advice good">✨ Selling now would at least double your lifetime Golden Crumbs.</p>}

      {goal && (
        <div className="goal">
          <div className="goal-title">
            Next: {goal.region.emoji} {goal.region.name}
          </div>
          {goal.locked ? (
            <div className="muted small">🔒 Needs {goal.region.requiresFranchises} franchises first</div>
          ) : (
            <>
              <GoalBar label="Reputation" value={goal.rep} />
              <GoalBar label="Money" value={goal.money} />
              <div className="muted small">
                {goal.rep >= 1 && goal.money >= 1
                  ? 'Ready: expand in Distribution.'
                  : goal.eta === null
                    ? 'Not getting closer yet.'
                    : `About ${fmtTime(goal.eta)} at this pace.`}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}

function Kpi({ label, value, sub, warn }: { label: string; value: string; sub: string; warn?: boolean }) {
  return (
    <div className={`kpi ${warn ? 'warn-border' : ''}`}>
      <div className="sb-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="sb-sub">{sub}</div>
    </div>
  )
}

function GoalBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div className="goal-bar">
      <span>{label}</span>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${pct}%` }} />
        <span className="bar-label">{pct}%</span>
      </div>
    </div>
  )
}
