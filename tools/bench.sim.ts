// How long the engine takes per tick on the late-game Mars save, and where
// the time goes (CPU profile, self time per function).
// Run: npx vitest run --config vitest.playtest.config.ts tools/bench.sim.ts
// Report: bench-report.txt
import { readFileSync, writeFileSync } from 'node:fs'
import { Session } from 'node:inspector/promises'
import { it } from 'vitest'
import { fromExportString } from '../src/engine/save'
import { tick } from '../src/engine/tick'

const TICKS = 4000
const DT = 0.25

interface ProfileNode {
  id: number
  callFrame: { functionName: string; url: string; lineNumber: number }
  hitCount: number
}

it('bench: engine tick on the Mars save', async () => {
  const s = fromExportString(readFileSync('tools/saves/mars.txt', 'utf8').trim())
  for (let i = 0; i < 300; i++) tick(s, DT) // warm up

  const session = new Session()
  session.connect()
  await session.post('Profiler.enable')
  await session.post('Profiler.setSamplingInterval', { interval: 100 })
  await session.post('Profiler.start')
  const t = performance.now()
  for (let i = 0; i < TICKS; i++) tick(s, DT) // orders, farm, kitchen, delivery, managers, badges
  const ms = performance.now() - t
  const { profile } = (await session.post('Profiler.stop')) as { profile: { nodes: ProfileNode[] } }
  session.disconnect()

  const self = new Map<string, number>()
  let total = 0
  for (const n of profile.nodes) {
    const f = n.callFrame
    const where = f.url.includes('/src/') ? f.url.slice(f.url.indexOf('/src/') + 1) : f.url.includes('break_eternity') ? 'break_eternity' : f.url ? 'other' : ''
    const key = `${f.functionName || '(anonymous)'}  ${where}${where.startsWith('src/') ? ':' + (f.lineNumber + 1) : ''}`
    self.set(key, (self.get(key) ?? 0) + n.hitCount)
    total += n.hitCount
  }
  const top = [...self].sort((a, b) => b[1] - a[1]).slice(0, 30)
  writeFileSync(
    'bench-report.txt',
    `engine: ${((ms / TICKS) * 1000).toFixed(0)}µs per tick (${TICKS} ticks)\n\nself time:\n` +
      top.map(([k, v]) => `${((v / total) * 100).toFixed(1).padStart(5)}%  ${k}`).join('\n') +
      '\n',
  )
})
