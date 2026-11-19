// The first run, played actively or mostly idle. Report: playtest-report.chapter1.txt
import { it } from 'vitest'
import { H, run, startReport } from './bot'

startReport('chapter1')

it('playtest: active player', () => {
  run({ name: 'Active (2 clicks/s, checks every 5s)', clicksPerSecond: 2, activeFor: Infinity, checkEvery: 5, maxSeconds: 4 * H })
})
it('playtest: idle player', () => {
  run({ name: 'Idle (plays 8 min, then checks every 2 min)', clicksPerSecond: 2, activeFor: 480, checkEvery: 120, maxSeconds: 8 * H })
})
