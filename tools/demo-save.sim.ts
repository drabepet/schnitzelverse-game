// Writes a ready-made late-game save (Chapter 4, Mars colony just unlocked) to
// tools/saves/mars.txt, to look at the late game without playing 105 hours.
// Run: npx vitest run --config vitest.playtest.config.ts tools/demo-save.sim.ts
// Load it in the game: ☰ Game → Load from file.
import { writeFileSync } from 'node:fs'
import { it } from 'vitest'
import { D } from '../src/engine/decimal'
import { FACILITIES, REGIONS, UPGRADES, type PerkId, type RegionId } from '../src/engine/content'
import { toExportString } from '../src/engine/save'
import { addLog, newGame, type GameState } from '../src/engine/state'
import { tick } from '../src/engine/tick'

const H = 3600

function marsSave(): GameState {
  const s = newGame()
  const upTo: RegionId = 'mars'
  const last = REGIONS.findIndex((r) => r.id === upTo)

  // Lifetime: ~105 hours (when the bot reaches Mars), 52 franchises, every chapter unlocked.
  s.stats.playtime = 105 * H
  s.stats.earned = D(2.4e14)
  s.stats.served = D(6.1e9)
  s.stats.servedCold = D(4.2e7)
  s.stats.clicks = 21_400
  s.stats.rescues = 2
  s.stats.soldOut = 1_900_000
  s.stats.bestTownTime = 1
  s.prestige = {
    unlocked: true,
    franchises: 52,
    crumbs: D(1850),
    totalCrumbs: D(307_000),
    perks: {
      familyRecipe: 12, headStart: 6, auntieRemembers: 1, loyalFamily: 8, wordOfMouth: 11, betterPans: 11,
      fastHands: 5, bulkContracts: 3, thermos: 3, localLegend: 11, oldConnections: 3, farmDeeds: 6,
      greenThumb: 10, fleetContracts: 5, logisticsDegree: 8, crispMaster: 6, nightShift: 3, launchContracts: 2,
      familyManager: 1, quartermaster: 1, estateAgent: 1, farmManager: 1, dispatcher: 1,
    } satisfies Partial<Record<PerkId, number>>,
  }
  s.crisp = { unlocked: true, temperature: 172, oil: 1 }
  s.milestones.planet = true

  // This run: 1h 30m in, Mars colony just unlocked.
  s.run = { earned: D(9.5e11), time: 1.5 * H, served: D(4.1e7), servedCold: D(2.1e5) }
  s.money = D(3.2e10)
  s.reputation = D(1.9e10)
  REGIONS.forEach((r, i) => (s.regions[r.id].unlocked = i <= last))
  for (const u of UPGRADES) {
    if (['crunchLab', 'cosmicCrumbs', 'dysonFryer', 'terraforming'].includes(u.id)) continue
    s.upgrades[u.id] = true
  }
  Object.assign(s.workers, { uncle: 132, grandma: 151, cousin: 151, kid: 9 })
  const farm: Record<string, number> = { wheatField: 95, sunflowers: 118, coop: 92, pigFarm: 80, mill: 95, bakery: 62, oilPress: 118, butcher: 80 }
  for (const f of FACILITIES) s.facilities[f.id] = farm[f.id] ?? 60
  Object.assign(s.vehicles, { van: 6, truck: 6, train: 5, plane: 5, rocket: 6, cruiser: 3, ark: 0 })
  for (const item of ['meat', 'flour', 'eggs', 'crumbs', 'oil'] as const) s.items[item] = D(400)

  // Income history: 8 hours of 2-hour runs climbing towards Mars.
  s.history.points = []
  for (let i = 0; i < 480; i++) {
    const t = s.stats.playtime - (480 - i) * 60
    const intoRun = (i % 120) / 120
    const run = Math.floor(i / 120)
    s.history.points.push({ t, income: 10 ** (6.2 + run * 0.12 + intoRun * 2.3), f: 48 + run })
  }
  s.history.earned = s.stats.earned
  s.history.clock = 0

  // Run history (Records): 52 runs, short ones early, two-hour ones near the end, each a bit further.
  s.stats.runs = []
  let end = 0
  for (let i = 0; i < 52; i++) {
    const time = i < 10 ? 20 * 60 + i * 6 * 60 : i < 30 ? 50 * 60 : 2 * H
    end += time
    const place = Math.min(last - 1, 5 + Math.floor(i / 4.5))
    s.stats.runs.push({ end, time, place, crumbs: Math.round(2 * 1.35 ** i), earned: 10 ** (5 + i * 0.13), served: 10 ** (3.5 + i * 0.1) })
  }
  s.stats.bestIncome = 10 ** (6.2 + 3 * 0.12 + 2.3)
  s.stats.bestSale = D(s.stats.runs[51].crumbs)
  s.stats.bestRunServed = D(s.stats.runs[51].served)
  s.stats.longestRun = 2 * H
  s.stats.bestPlace = last

  s.log = []
  addLog(s, '🔴 Mars colony. The red planet now smells of golden crust.')
  addLog(s, '🌕 Moon base unlocked. The flag is a lemon wedge on a stick.')
  addLog(s, '🛰️ The orbital station placed its first order. The schnitzel arrived floating. Nobody minded.')
  s.log.reverse()

  // One short tick: badges and milestones catch up, rates settle.
  tick(s, 0.05)
  // Spread badge dates over the 90 hours (no pop-up storm), all already seen.
  const ids = Object.keys(s.badges)
  ids.forEach((id, i) => (s.badges[id] = Math.round(((i + 1) / (ids.length + 1)) * (s.stats.playtime - H))))
  s.badgesSeen = ids.length
  s.lastSaved = Date.now()
  return s
}

it('writes the Mars demo save', () => {
  const s = marsSave()
  writeFileSync('tools/saves/mars.txt', toExportString(s))
})
