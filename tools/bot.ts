// The balance bot: plays the real engine at high speed and writes a timeline.
// The *.sim.ts files next to this one run its play styles (in parallel, one
// report file each). Run with `npm run playtest`. Not part of the normal tests.
import { appendFileSync, writeFileSync } from 'node:fs'
import {
  FACILITIES,
  PERKS,
  REGIONS,
  STAGE_IDS,
  UPGRADES,
  VEHICLES,
  WORKERS,
  INGREDIENT_IDS,
  type FacilityId,
  type Task,
} from '../src/engine/content'
import { newGame, type GameState } from '../src/engine/state'
import { tick } from '../src/engine/tick'
import {
  buyFacility,
  buyIngredient,
  buyVehicle,
  buyPerk,
  buyUpgrade,
  canUnlockRegion,
  clickDeliver,
  clickStage,
  franchise,
  hireWorker,
  knockOnDoors,
  unlockRegion,
} from '../src/engine/actions'
import {
  canReach,
  chapter2Unlocked,
  chapter3Unlocked,
  deliveryCapacity,
  vehicleCost,
  facilityCapacity,
  facilityCost,
  canBuyPerk,
  canBuyUpgrade,
  canFranchise,
  canHire,
  getMods,
  orderRate,
  pendingCrumbs,
  perkCost,
  taskCapacity,
  vehicleServes,
  vehicleVisible,
  workerCost,
} from '../src/engine/rules'
import { Decimal } from '../src/engine/decimal'
import { fmt, fmtMoney, fmtTime } from '../src/engine/format'

interface Profile {
  name: string
  /** Manual clicks per second while the player is active. */
  clicksPerSecond: number
  /** The player stops clicking after this many seconds (Infinity = never). */
  activeFor: number
  /** The player checks in to buy things every N seconds. */
  checkEvery: number
  maxSeconds: number
}

/** Step while the bot is clicking (clicks need fine steps)… */
const DT = 0.25
/**
 * …and while it only checks in now and then. The game itself simulates
 * offline time in 1-second steps, so this changes nothing but the speed.
 */
const DT_IDLE = Number(process.env.PLAYTEST_IDLE_STEP ?? 1)
/** Vitest hides console output, so the timeline goes to a file. */
let REPORT = 'playtest-report.txt'

/** Start this file's report: playtest-report.<name>.txt (or PLAYTEST_REPORT for the main one). */
export function startReport(name: string): void {
  REPORT = name === 'main' && process.env.PLAYTEST_REPORT ? process.env.PLAYTEST_REPORT : `playtest-report.${name}.txt`
  writeFileSync(REPORT, '')
}

export const H = 3600

function demand(s: GameState): number {
  const mods = getMods(s)
  return REGIONS.filter((r) => s.regions[r.id].unlocked).reduce((n, r) => n + orderRate(r, mods).toNumber(), 0)
}

function manualClick(s: GameState): void {
  // Work backwards through the chain so finished food moves first.
  const best = [...REGIONS].reverse().find((r) => s.regions[r.id].unlocked && s.regions[r.id].orders.gte(1))
  if (best && clickDeliver(s, best.id)) return
  // A sensible player only cooks for open orders (plus a tiny buffer).
  const open = REGIONS.reduce((n, r) => n + (s.regions[r.id].unlocked ? s.regions[r.id].orders.toNumber() : 0), 0)
  const pipeline = s.items.hot.add(s.items.breaded).add(s.items.cutlet).toNumber()
  // Finish what is already started; only start new cutlets when needed.
  for (const stage of [...STAGE_IDS].reverse()) {
    if (stage === 'pound' && pipeline >= open + 2) break
    if (clickStage(s, stage)) return
  }
  // Nothing to cook for: customers are the limit, so knock on doors.
  if (knockEnabled) knockOnDoors(s)
}

function needsMore(s: GameState): boolean {
  const open = REGIONS.reduce((n, r) => n + (s.regions[r.id].unlocked ? s.regions[r.id].orders.toNumber() : 0), 0)
  return s.items.cutlet.add(s.items.breaded).add(s.items.hot).toNumber() < open + 4
}

/**
 * Chapter 2: buy the bottleneck building of whichever ingredient chain covers
 * the smallest share of what the kitchen can fry. Spends at most a quarter of
 * the money per building.
 */
/** Off to measure the game as it was before knocking existed (PLAYTEST_KNOCK=0). */
const knockEnabled = process.env.PLAYTEST_KNOCK !== '0'

/** Switched off by the "no farm" profile to measure what the farm is worth. */
let farmEnabled = true

/**
 * Chapter 3: first make sure every unlocked place can be reached, then add
 * the vehicle with the best capacity per dollar while delivery is the bottleneck.
 */
/** Vehicles you may buy that serve at least one place you deliver to. */
function usefulVehicles(s: GameState) {
  return VEHICLES.filter((v) => vehicleVisible(s, v) && REGIONS.some((r) => s.regions[r.id].unlocked && vehicleServes(v, r)))
}

function fleet(s: GameState): void {
  if (!chapter3Unlocked(s)) return
  const mods = getMods(s)
  for (const r of REGIONS) {
    if (!s.regions[r.id].unlocked || canReach(s, r)) continue
    const v = VEHICLES.find((x) => vehicleVisible(s, x) && vehicleServes(x, r))
    if (v && vehicleCost(s, v).lte(s.money.div(2))) buyVehicle(s, v.id)
  }
  for (let guard = 0; guard < 40; guard++) {
    const kitchen = Math.min(...STAGE_IDS.map((t) => taskCapacity(s, t, mods).toNumber()))
    if (deliveryCapacity(s, mods).toNumber() >= kitchen * 1.1) return
    const best = usefulVehicles(s)
      .map((v) => ({ v, value: (v.capacity * mods.fleet) / vehicleCost(s, v).toNumber() }))
      .filter((x) => vehicleCost(s, x.v).lte(s.money.div(4)))
      .sort((a, b) => b.value - a.value)[0]
    if (!best || !buyVehicle(s, best.v.id)) return
  }
}

function farm(s: GameState): void {
  if (!farmEnabled || !chapter2Unlocked(s)) return
  const mods = getMods(s)
  const cap = (id: FacilityId) => {
    const def = FACILITIES.find((f) => f.id === id)!
    return facilityCapacity(s, def, mods).toNumber() * def.yield
  }
  for (let guard = 0; guard < 40; guard++) {
    const fry = taskCapacity(s, 'fry', mods).toNumber()
    if (fry <= 0) return
    const bakeryFlour = cap('bakery') / 2
    // [supply per second, demand per second, bottleneck building]
    const chains: [number, number, FacilityId][] = [
      [Math.min(cap('pigFarm') * 8, cap('butcher')), fry, cap('pigFarm') * 8 < cap('butcher') ? 'pigFarm' : 'butcher'],
      [cap('coop'), fry, 'coop'],
      [Math.min(cap('wheatField'), cap('mill')), fry + bakeryFlour, cap('wheatField') < cap('mill') ? 'wheatField' : 'mill'],
      [cap('bakery'), fry, 'bakery'],
      [Math.min(cap('sunflowers') / 2, cap('oilPress')), fry, cap('sunflowers') / 2 < cap('oilPress') ? 'sunflowers' : 'oilPress'],
    ]
    chains.sort((a, b) => a[0] / a[1] - b[0] / b[1])
    // Buy for the neediest chain that is short and affordable.
    const pick = chains.find(([supply, need, id]) => {
      const def = FACILITIES.find((f) => f.id === id)!
      return supply < need * 1.1 && facilityCost(s, def).lte(s.money.div(4))
    })
    if (!pick || !buyFacility(s, pick[2])) return
  }
}

function shop(s: GameState, log: (t: string) => void): void {
  const mods = getMods(s)
  // 1. Expand whenever possible.
  for (const r of REGIONS) if (canUnlockRegion(s, r.id) && unlockRegion(s, r.id)) log(`unlock ${r.name} (${fmtMoney(s.money)} left)`)
  // 2. Manual restock before automation exists (always: an empty kitchen earns nothing).
  if (!mods.autoBuy && needsMore(s)) for (const i of INGREDIENT_IDS) if (s.items[i].lt(6)) buyIngredient(s, i, 1)
  // Auntie's shopping list comes first: like the welcome screen says.
  const list = UPGRADES.find((u) => u.id === 'shoppingList')!
  if (canBuyUpgrade(s, list) && buyUpgrade(s, list.id)) log(`upgrade ${list.name}`)
  // Saving up: if the next place only lacks money and is within ~1 hour
  // of income, stop buying other things until it is affordable.
  const next = REGIONS.find((r) => !s.regions[r.id].unlocked)
  const incomePerSecond = s.run.time > 60 ? s.run.earned.toNumber() / s.run.time : 0
  if (
    next &&
    s.prestige.franchises >= (next.requiresFranchises ?? 0) &&
    s.reputation.gte(next.unlockReputation) &&
    next.unlockCost > s.money.toNumber() &&
    next.unlockCost < incomePerSecond * 3600
  ) {
    return
  }
  // A careful player keeps money for ingredients (the game can soft-lock otherwise).
  const reserve = mods.autoBuy ? 0 : 20
  const affordable = (cost: number) => s.money.toNumber() - cost >= reserve
  // 3. Upgrades, cheapest first.
  for (const u of [...UPGRADES].sort((a, b) => a.cost - b.cost)) {
    if (canBuyUpgrade(s, u) && affordable(u.cost) && buyUpgrade(s, u.id)) log(`upgrade ${u.name}`)
  }
  farm(s)
  fleet(s)
  // 4. Hire for the bottleneck, but only while capacity is below demand × 1.3.
  for (let guard = 0; guard < 50; guard++) {
    const target = demand(s) * 1.3
    const tasks: Task[] = ['deliver', 'fry', 'bread', 'pound'] // ties: sell first
    const caps = tasks.map((t) => ({
      t,
      cap: (t === 'deliver' ? deliveryCapacity(s, mods) : taskCapacity(s, t, mods)).toNumber(),
    }))
    caps.sort((a, b) => a.cap - b.cap)
    const weakest = caps[0]
    if (weakest.cap >= target) break
    const worker = WORKERS.find((w) => w.task === weakest.t)!
    // Delivery: once the fleet is here, buy whichever is cheaper per schnitzel/s, a helper or a vehicle.
    if (weakest.t === 'deliver' && chapter3Unlocked(s)) {
      const kidPerUnit = workerCost(s, worker.id).toNumber() / (worker.rate * mods.speed.deliver)
      const vehicles = usefulVehicles(s).map((v) => ({ v, perUnit: vehicleCost(s, v).toNumber() / (v.capacity * mods.fleet) }))
      const best = vehicles.sort((a, b) => a.perUnit - b.perUnit)[0]
      if (best && best.perUnit < kidPerUnit) {
        if (!affordable(vehicleCost(s, best.v).toNumber()) || !buyVehicle(s, best.v.id)) break
        continue
      }
    }
    if (!canHire(s, worker) || !affordable(workerCost(s, worker.id).toNumber())) break
    const before = s.workers[worker.id]
    hireWorker(s, worker.id)
    if (before === 0) log(`hire first ${worker.name} (${fmt(workerCost(s, worker.id))} next)`)
  }
}

export function run(p: Profile): void {
  const s = newGame(0)
  const lines: string[] = []
  const log = (text: string) => lines.push(`${fmtTime(s.stats.playtime).padStart(8)}  ${text}`)
  let clickBudget = 0
  let nextCheck = 0
  let nextSnapshot = 300
  const gates: Record<string, { rep?: number; money?: number }> = {}

  for (let t = 0, dt = DT; t < p.maxSeconds; t += dt) {
    dt = t < p.activeFor ? DT : DT_IDLE
    if (t < p.activeFor) {
      clickBudget += p.clicksPerSecond * DT
      while (clickBudget >= 1) {
        manualClick(s)
        clickBudget--
      }
    }
    if (t >= nextCheck) {
      shop(s, log)
      nextCheck = t + (t < p.activeFor ? 5 : p.checkEvery)
    }
    tick(s, dt)
    if (t >= nextSnapshot) {
      const w = WORKERS.map((x) => `${x.id}:${s.workers[x.id]}`).join(' ')
      log(
        `-- $${fmt(s.money)} ⭐${fmt(s.reputation)} served ${fmt(s.stats.served)} ` +
          `(cold ${fmt(s.stats.servedCold)}) demand ${demand(s).toFixed(2)}/s | ${w}`,
      )
      nextSnapshot += 300
    }
    // Which requirement held each expansion back: money or reputation?
    for (const r of REGIONS) {
      const g = (gates[r.id] ??= {})
      if (g.rep === undefined && s.reputation.gte(r.unlockReputation)) g.rep = t
      if (g.money === undefined && s.money.gte(r.unlockCost)) g.money = t
    }
    if (s.regions.town.unlocked) {
      log('REACHED TOWN (end of chapter 1)')
      break
    }
  }
  for (const r of REGIONS.slice(1)) {
    const g = gates[r.id] ?? {}
    const at = (x?: number) => (x === undefined ? 'never' : fmtTime(x))
    lines.push(`gate ${r.name}: reputation reached ${at(g.rep)}, money reached ${at(g.money)}`)
  }
  appendFileSync(REPORT, `\n===== ${p.name} =====\n${lines.join('\n')}\n`)
}

/**
 * Several runs in a row with Franchise resets. The bot franchises once the
 * reward at least doubles its lifetime Golden Crumbs (a common idle-game rule
 * of thumb), and buys the cheapest perks first.
 */
type SellRule = 'atTown' | 'double' | 'triple'

interface FranchiseProfile {
  name: string
  sell: SellRule
  /** Seconds of active clicking at the start of each run. */
  activeSeconds: number
  /** How often the player checks in once idle. */
  idleCheck: number
  maxSeconds: number
  snapshots?: boolean
  noFarm?: boolean
}

/** Places whose first arrival the summary reports. */
const PLACES = REGIONS.slice(REGIONS.findIndex((r) => r.id === 'nextTown')).map((r) => r.id)

export function runFranchises(p: FranchiseProfile): void {
  farmEnabled = !p.noFarm
  const s = newGame(0)
  let soldOutAtRunStart = 0
  const lines: string[] = []
  const log = (text: string) => lines.push(`${fmtTime(s.stats.playtime).padStart(8)}  ${text}`)
  let clickBudget = 0
  let nextCheck = 0
  let townAt: number | undefined
  const reached: Record<string, number> = {}

  for (let t = 0, dt = DT; t < p.maxSeconds; t += dt) {
    // The very first run is always played actively until the town.
    const active = s.run.time < p.activeSeconds || (s.prestige.franchises === 0 && !s.regions.town.unlocked)
    dt = active ? DT : DT_IDLE
    if (active) {
      clickBudget += 2 * DT
      while (clickBudget >= 1) {
        manualClick(s)
        clickBudget--
      }
    }
    if (t >= nextCheck) {
      shop(s, () => {})
      if (townAt === undefined && s.regions.town.unlocked) townAt = s.run.time
      for (const r of PLACES) {
        if (reached[r] === undefined && s.regions[r].unlocked) reached[r] = t
      }
      for (;;) {
        const affordable = PERKS.filter((x) => canBuyPerk(s, x)).sort(
          (a, b) => perkCost(s, a).toNumber() - perkCost(s, b).toNumber(),
        )
        if (!affordable.length) break
        buyPerk(s, affordable[0].id)
      }
      const pending = pendingCrumbs(s)
      const lifetime = Decimal.max(1, s.prestige.totalCrumbs)
      const want =
        p.sell === 'atTown' ? s.regions.town.unlocked : p.sell === 'double' ? pending.gte(lifetime) : pending.gte(lifetime.mul(2))
      const stalled = s.run.time > 120 * 60
      if (canFranchise(s) && (want || stalled)) {
        const last = [...REGIONS].reverse().find((r) => s.regions[r.id].unlocked)!
        log(
          `franchise #${s.prestige.franchises + 1}: run took ${fmtTime(s.run.time)}, ` +
            `town at ${townAt === undefined ? '-' : fmtTime(townAt)}, reached ${last.name}, ` +
            `+${fmt(pending, 0)} ✨ (lifetime ${fmt(s.prestige.totalCrumbs.add(pending), 0)}), ` +
            `shop sold out ${s.stats.soldOut - soldOutAtRunStart}× this run`,
        )
        soldOutAtRunStart = s.stats.soldOut
        franchise(s)
        townAt = undefined
      }
      nextCheck = t + (active ? 5 : p.idleCheck)
    }
    tick(s, dt)
    if (townAt === undefined && s.regions.town.unlocked) townAt = s.run.time
    if (p.snapshots && s.run.time % 900 < dt) {
      const w = WORKERS.map((x) => `${x.id}:${s.workers[x.id]}`).join(' ')
      log(
        `-- run ${s.prestige.franchises + 1} at ${fmtTime(s.run.time)}: ${fmtMoney(s.money)} ` +
          `earned ${fmtMoney(s.run.earned)} ⭐${fmt(s.reputation)} pending ✨${fmt(pendingCrumbs(s), 0)} | ${w} | ` +
          `farm ${FACILITIES.map((f) => s.facilities[f.id]).join('/')} | soldOut ${s.stats.soldOut}\n            ` +
          `caps ${(['pound', 'bread', 'fry'] as const).map((t) => fmt(taskCapacity(s, t)))},deliver ${fmt(deliveryCapacity(s, getMods(s)))} ` +
          `fleet ${VEHICLES.map((v) => s.vehicles[v.id]).join('/')} ` +
          `| stock ${INGREDIENT_IDS.map((i) => fmt(s.items[i]))} cut ${fmt(s.items.cutlet)} br ${fmt(s.items.breaded)} hot ${fmt(s.items.hot)} ` +
          `| served ${fmt(s.stats.served)} | upgrades ${Object.keys(s.upgrades).length}/${UPGRADES.length}`,
      )
    }
  }
  const perks = PERKS.filter((x) => s.prestige.perks[x.id]).map((x) => `${x.id}:${s.prestige.perks[x.id]}`)
  lines.push(`perks: ${perks.join(' ')}`)
  const badges = Object.entries(s.badges).sort((a, b) => a[1] - b[1])
  lines.push(`badges (${badges.length}): ${badges.map(([id, t]) => `${id} ${fmtTime(t)}`).join(', ')}`)
  lines.push(
    `SUMMARY after ${fmtTime(p.maxSeconds)}: ${s.prestige.franchises} franchises, ` +
      `lifetime ✨${fmt(s.prestige.totalCrumbs, 0)}, first reached: ` +
      PLACES.map((r) => `${r} ${reached[r] === undefined ? 'never' : fmtTime(reached[r])}`).join(', '),
  )
  appendFileSync(REPORT, `\n===== ${p.name} =====\n${lines.join('\n')}\n`)
}

