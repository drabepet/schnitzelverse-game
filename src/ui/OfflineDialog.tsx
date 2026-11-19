import { fmtInt, fmtMoney, fmtTime } from '../engine/format'
import { useGame } from '../game/store'

export function OfflineDialog() {
  const game = useGame()
  const report = game.offlineReport
  if (!report) return null
  const capped = report.cappedFrom > report.seconds

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="dialog">
        <h2>Welcome back! 👋</h2>
        <p>
          You were away for <b>{fmtTime(report.cappedFrom)}</b>.
          {capped && (
            <>
              {' '}
              The family only covers for you for {fmtTime(report.seconds)}. (The Night shift perk makes that longer.)
            </>
          )}
        </p>
        <p>
          While you were gone they served <b>{fmtInt(report.served)}</b> schnitzels and earned{' '}
          <b>{fmtMoney(report.earned)}</b>.
        </p>
        <button className="primary" onClick={() => game.dismissOfflineReport()}>
          Back to the garage
        </button>
      </div>
    </div>
  )
}
