// Selling strategies played to the end, so balance is measured the way real players play.
// The main bot force-sells every 2 hours, which late on adds only ~5% a run and makes it
// about 4× slower than a player who lets Mum sell when the sale triples lifetime crumbs
// (Franchise tab → Mum sells at 200%; the finale save in tools/saves reached the
// Schnitzelverse at 3d 11h that way). After the Schnitzelverse each bot plays the
// epilogue (feed everyone) and reports when it reached each share (EPILOGUE line),
// what it served at the finale and at the end (FINALE, END).
// Report: playtest-report.strategies.txt (or PLAYTEST_REPORT_STRATEGIES).
// Length cap: PLAYTEST_HOURS (default 340). Use PLAYTEST_IDLE_STEP=4 for speed.
// One bot only: PLAYTEST_ONLY=yours (or hybrid, best, checkin).
import { it } from 'vitest'
import { H, runFranchises, startReport } from './bot'

startReport('strategies')

const maxSeconds = Number(process.env.PLAYTEST_HOURS ?? 340) * H
/** How long to play on after the Schnitzelverse (the epilogue); stops an hour after everyone is fed. PLAYTEST_EPILOGUE_HOURS, default 96. */
const STOP_AFTER_FINALE = Number(process.env.PLAYTEST_EPILOGUE_HOURS ?? 96) * H
const only = process.env.PLAYTEST_ONLY
const play = (id: string, name: string, fn: () => void) => (only && only !== id ? it.skip : it)(name, fn)

play('yours', 'strategy: triples, no 2-hour cap (Mum at 200%)', () => {
  runFranchises({
    name: 'Yours: sell when the sale triples lifetime crumbs, no 2-hour cap (active 5 min/run, checks every 30s)',
    sell: 'triple',
    stalledAfter: 12 * H,
    activeSeconds: 300,
    idleCheck: 30,
    maxSeconds,
    stopAfterFinale: STOP_AFTER_FINALE,
  })
})

play('hybrid', 'strategy: doubles every 2 h until the planet, then triples', () => {
  runFranchises({
    name: 'Hybrid: doubles with the 2-hour cap until the whole planet, then triples with no cap',
    sell: 'double',
    lateSell: 'triple',
    lateFrom: 'planet',
    lateStalledAfter: 12 * H,
    activeSeconds: 300,
    idleCheck: 30,
    maxSeconds,
    stopAfterFinale: STOP_AFTER_FINALE,
  })
})

play('best', 'strategy: Mum’s best moment, no 2-hour cap', () => {
  runFranchises({
    name: 'Best moment: Mum’s default rule (triples early, then when crumb growth peaks), no 2-hour cap',
    sell: 'best',
    stalledAfter: 12 * H,
    activeSeconds: 300,
    idleCheck: 30,
    maxSeconds,
    stopAfterFinale: STOP_AFTER_FINALE,
  })
})

play('checkin', 'strategy: triples, check-in player', () => {
  runFranchises({
    name: 'Check-in: a 15-minute session every 8 hours, Mum sells at 200% while away (as in the finale save)',
    sell: 'triple',
    mumSellsAt: 200,
    stalledAfter: 24 * H,
    activeSeconds: 300,
    idleCheck: 8 * H,
    sessionMinutes: 15,
    maxSeconds,
    stopAfterFinale: STOP_AFTER_FINALE,
  })
})
