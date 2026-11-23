import { NIGHT_SHIFT_HOURS, PERK_BY_ID, REGION_BY_ID } from '../engine/content'
import { perkLevel } from '../engine/rules'
import { fmt, fmtCompact, fmtInt, fmtMoney, fmtTime } from '../engine/format'
import { useGame, type FamilyDigest } from '../game/store'
import { nextGoal } from './insights'

/** “1,234 helpers, 5 farm buildings and 2 vehicles” (only what grew). */
function boughtLine(f: FamilyDigest): string | null {
  const parts = [
    f.hired && `${fmtInt(f.hired)} helper${f.hired === 1 ? '' : 's'}`,
    f.built && `${fmtInt(f.built)} farm building${f.built === 1 ? '' : 's'}`,
    f.vehicles && `${fmtInt(f.vehicles)} vehicle${f.vehicles === 1 ? '' : 's'}`,
    f.equipment && `${fmtInt(f.equipment)} piece${f.equipment === 1 ? '' : 's'} of equipment`,
  ].filter(Boolean) as string[]
  if (!parts.length) return null
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
  return `The family took on ${list}${f.spent > 0 ? ` for ${fmtMoney(f.spent)}` : ''}.`
}

/** Back after a while: how long, what the family earned and did, what comes next. */
export function OfflineDialog() {
  const game = useGame()
  const report = game.offlineReport
  if (!report) return null
  const capped = report.cappedFrom > report.seconds
  const f = report.family
  const bought = boughtLine(f)
  const goal = nextGoal(game)
  const nightShiftLeft = perkLevel(game.state, 'nightShift') < (PERK_BY_ID.nightShift.maxLevel ?? Infinity)

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="dialog welcome-back">
        <h2>Welcome back! 👋</h2>
        <p>
          You were away for <b>{fmtTime(report.cappedFrom)}</b>.
          {capped && <> The family covered for you for the first {fmtTime(report.seconds)}.</>} While you were gone they served{' '}
          <b>{fmtInt(report.served)}</b> schnitzels and earned <b>{fmtMoney(report.earned)}</b>.
        </p>
        {(bought || f.places.length > 0 || f.sales > 0) && (
          <ul className="welcome-back-list">
            {bought && <li>👪 {bought}</li>}
            {f.places.length > 0 && (
              <li>
                🏠 Mum opened {f.places.map((id) => `${REGION_BY_ID[id].emoji} ${REGION_BY_ID[id].name.replace(/^The /, 'the ')}`).join(', ')}.
              </li>
            )}
            {f.sales > 0 && (
              <li>
                🏷️ Mum sold the business {f.sales === 1 ? 'once' : `${f.sales} times`}: +{fmtCompact(f.crumbs.floor())} Golden Crumbs.
              </li>
            )}
          </ul>
        )}
        {goal && !goal.locked && (
          <p className="muted">
            Next: {goal.region.emoji} {goal.region.name.replace(/^The /, 'the ')} (⭐ {Math.round(goal.rep * 100)}%, $ {Math.round(goal.money * 100)}%).
          </p>
        )}
        <p className="muted small">
          The family covers for you for up to {fmt(report.cap / 3600, 0)} hours while you’re away
          {nightShiftLeft ? `; the Night shift perk adds ${NIGHT_SHIFT_HOURS} hours per level` : ''}.
        </p>
        <button className="primary" onClick={() => game.dismissOfflineReport()}>
          Back to the garage
        </button>
      </div>
    </div>
  )
}
