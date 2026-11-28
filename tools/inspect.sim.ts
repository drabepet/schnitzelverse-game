// Load a save and print what holds the business back, then let the game run on
// (managers and Mum's selling rule as saved) and print it again at a few points.
// SAVE_FILE=path/to/export.txt (default tools/saves/finale.txt, a game just past the
// Schnitzelverse). INSPECT_HOURS="1,6,24,48" sets when to look again.
// Report: inspect-report.txt (or INSPECT_REPORT).
// npx vitest run --config vitest.playtest.config.ts tools/inspect.sim.ts
import { readFileSync, writeFileSync } from 'node:fs'
import { it } from 'vitest'
import { FACILITIES, INGREDIENT_IDS, REGIONS, STAGE_IDS, WORKERS, VEHICLES } from '../src/engine/content'
import { fromExportString } from '../src/engine/save'
import { tick } from '../src/engine/tick'
import {
  businessLimits,
  fedShare,
  deliveryCapacity,
  facilityCapacity,
  facilityCost,
  farmSupply,
  getMods,
  orderRate,
  pendingCrumbs,
  supplyNeeds,
  taskCapacity,
  vehicleCost,
  workerCost,
} from '../src/engine/rules'
import { fmt, fmtMoney, fmtTime } from '../src/engine/format'
import type { GameState } from '../src/engine/state'

const FILE = process.env.SAVE_FILE ?? 'tools/saves/finale.txt'
const REPORT = process.env.INSPECT_REPORT ?? 'inspect-report.txt'
const HOURS = (process.env.INSPECT_HOURS ?? '1,6,24,48').split(',').map(Number)

function look(s: GameState, title: string): string {
  const mods = getMods(s)
  const l = businessLimits(s, mods)
  const income = s.run.time > 60 ? s.run.earned.toNumber() / s.run.time : 0
  const minutes = (cost: number) => (income > 0 ? `${(cost / income / 60).toFixed(1)} min of income` : '')
  const out: string[] = [`===== ${title} (play time ${fmtTime(s.stats.playtime)}, run ${s.prestige.franchises + 1} at ${fmtTime(s.run.time)}) =====`]
  out.push(`money ${fmtMoney(s.money)}, income ~${fmtMoney(income)}/s this run, pending ✨${fmt(pendingCrumbs(s), 0)} of lifetime ✨${fmt(s.prestige.totalCrumbs, 0)}`)
  out.push(
    `LIMITS /s: customers ${fmt(l.customers)} | supply ${fmt(l.supply)} | kitchen ${fmt(l.kitchen)} | delivery ${fmt(l.delivery)} ` +
      `→ sells ${fmt(l.limit)} (${l.bottleneck}), ${((l.limit / l.customers) * 100).toFixed(2)}% of the orders`,
  )
  const standards = Object.keys(s.upgrades).filter((id) => id.startsWith('standards_')).map((id) => id.replace('standards_', '')).join(' ')
  out.push(`EPILOGUE fed now ${(fedShare(s, mods) * 100).toFixed(2)}%, best ${(s.stats.bestFed * 100).toFixed(2)}% | lemon crews ${['multiverseMallets', 'everyCrumbEverywhere', 'lastFryer'].filter((id) => s.upgrades[id as never]).length}/3 | standards ${standards || 'none'}`)
  out.push(`mods: orders ×${fmt(mods.orders)}, price ×${fmt(mods.price)}, speed pound ×${fmt(mods.speed.pound)} bread ×${fmt(mods.speed.bread)} fry ×${fmt(mods.speed.fry)} deliver ×${fmt(mods.speed.deliver)}, fleet ×${fmt(mods.fleet)}, shop ×${fmt(mods.shopSupply)}`)
  out.push('kitchen:')
  for (const t of [...STAGE_IDS, 'deliver' as const]) {
    const crews = WORKERS.filter((w) => w.task === t)
      .map((w) => `${w.id}:${s.workers[w.id]} (next ${fmtMoney(workerCost(s, w.id))}, ${minutes(workerCost(s, w.id).toNumber())})`)
      .join(', ')
    const cap = t === 'deliver' ? deliveryCapacity(s, mods) : taskCapacity(s, t, mods)
    out.push(`  ${t.padEnd(7)} ${fmt(cap).padStart(9)}/s  ${crews}`)
  }
  out.push('fleet: ' + VEHICLES.filter((v) => s.vehicles[v.id] > 0).map((v) => `${v.id}:${s.vehicles[v.id]} (next ${fmtMoney(vehicleCost(s, v))})`).join(', '))
  const need = supplyNeeds(s, mods)
  out.push('ingredients (farm makes / the kitchen needs at its real speed):')
  for (const i of INGREDIENT_IDS) out.push(`  ${i.padEnd(7)} farm ${fmt(farmSupply(s, i, mods)).padStart(9)}/s  need ${fmt(need[i] ?? 0).padStart(9)}/s  stock ${fmt(s.items[i])}`)
  out.push('farm buildings:')
  for (const f of FACILITIES) {
    if (!s.facilities[f.id]) continue
    const cost = facilityCost(s, f)
    out.push(`  ${f.id.padEnd(17)} ×${String(s.facilities[f.id]).padEnd(4)} ${fmt(facilityCapacity(s, f, mods).mul(f.yield)).padStart(9)} ${f.output}/s  next ${fmtMoney(cost)} (${minutes(cost.toNumber())})`)
  }
  const open = REGIONS.filter((r) => s.regions[r.id].unlocked)
  const top = [...open].sort((a, b) => orderRate(b, mods).cmp(orderRate(a, mods))).slice(0, 4)
  out.push('biggest customers: ' + top.map((r) => `${r.id} ${fmt(orderRate(r, mods))}/s`).join(', '))
  return out.join('\n')
}

it('inspect a save', () => {
  const s = fromExportString(readFileSync(FILE, 'utf8'))
  const parts = [look(s, `as saved (${FILE})`)]
  let done = 0
  for (const h of HOURS) {
    for (; done < h * 3600; done += 4) tick(s, 4)
    parts.push(look(s, `${h} h later`))
  }
  writeFileSync(REPORT, parts.join('\n\n') + '\n')
})
