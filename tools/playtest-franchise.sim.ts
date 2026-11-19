// Other franchise strategies. Report: playtest-report.franchise.txt
import { it } from 'vitest'
import { H, runFranchises, startReport } from './bot'

startReport('franchise')

it('playtest: franchise, no farm', () => {
  runFranchises({ name: 'Franchise: doubles, but never builds a farm', sell: 'double', activeSeconds: 300, idleCheck: 30, maxSeconds: 32 * H, noFarm: true })
})
it('playtest: franchise, sell at town every time', () => {
  runFranchises({ name: 'Franchise: sell as soon as the town is reached', sell: 'atTown', activeSeconds: 300, idleCheck: 30, maxSeconds: 8 * H })
})
it('playtest: franchise, sell when reward triples', () => {
  runFranchises({ name: 'Franchise: sell when reward triples', sell: 'triple', activeSeconds: 300, idleCheck: 30, maxSeconds: 8 * H })
})
it('playtest: franchise, idle player', () => {
  runFranchises({ name: 'Franchise: idle (no clicking after run 1, checks every 10 min)', sell: 'double', activeSeconds: 0, idleCheck: 600, maxSeconds: 8 * H })
})
