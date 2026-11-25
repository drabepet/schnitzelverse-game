// Count goals: owning 10, 25, 50… of a farm building or kitchen helper makes every one faster.
import { FARM_GOAL_MULT, FARM_GOALS } from '../engine/content'
import { fmt } from '../engine/format'
import { farmGoalBonus, farmGoalsReached, nextFarmGoal } from '../engine/rules'

/** Progress to the next count goal for one kind of building or kitchen crew. */
export function CountGoal({ count, name }: { count: number; name: string }) {
  const next = nextFarmGoal(count)
  const reached = farmGoalsReached(count)
  const bonus = farmGoalBonus(count)
  if (next === null)
    return (
      <div className="count-goal small muted" title={`Every goal reached: ${name} ×${fmt(bonus)}`}>
        🎯 All goals reached · ×{fmt(bonus)}
      </div>
    )
  const prev = reached > 0 ? FARM_GOALS[reached - 1] : 0
  const pct = Math.max(0, Math.min(100, ((count - prev) / (next - prev)) * 100))
  return (
    <div
      className="count-goal small"
      title={`Own ${next} to make every one ×${FARM_GOAL_MULT} faster.${reached ? ` Goals reached so far: ${reached} (×${fmt(bonus)}).` : ''}`}
    >
      <span>
        🎯 {count}/{next} → ×{FARM_GOAL_MULT}
      </span>
      {reached > 0 && <span className="muted"> · now ×{fmt(bonus)}</span>}
      <div className="count-goal-bar">
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
