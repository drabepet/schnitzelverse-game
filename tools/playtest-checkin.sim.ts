// The check-in player: the same bot, but it only looks in three times a day
// (every 8 hours) for a 15-minute session, sells only when the reward doubles
// (or after a whole day), and leaves the rest to the managers. Compare its SUMMARY and DRY lines with the main (active) run.
// Report: playtest-report.checkin.txt (or PLAYTEST_REPORT_CHECKIN). Length: PLAYTEST_HOURS (default 64).
import { it } from 'vitest'
import { H, runFranchises, startReport } from './bot'

startReport('checkin')

it('playtest: check-in player, three times a day', () => {
  runFranchises({
    name: 'Franchise: sell when reward doubles (15-minute sessions every 8 h)',
    sell: 'double',
    activeSeconds: 300,
    idleCheck: 8 * H,
    sessionMinutes: 15,
    stalledAfter: 24 * H,
    maxSeconds: Number(process.env.PLAYTEST_HOURS ?? 64) * H,
  })
})
