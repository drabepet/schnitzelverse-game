// The main balance run: sells when the crumbs would double. Report: playtest-report.main.txt
// (or PLAYTEST_REPORT). Length: PLAYTEST_HOURS (default 64).
import { it } from 'vitest'
import { H, runFranchises, startReport } from './bot'

startReport('main')

it('playtest: franchise, sell when reward doubles', () => {
  runFranchises({
    name: 'Franchise: sell when reward doubles (active 5 min/run, checks every 30s)',
    sell: 'double',
    activeSeconds: 300,
    idleCheck: 30,
    maxSeconds: Number(process.env.PLAYTEST_HOURS ?? 64) * H,
    snapshots: true,
  })
})
