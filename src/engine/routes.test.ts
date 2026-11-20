import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { REGIONS } from './content'
import { newGame } from './state'
import { getMods } from './rules'
import { advance } from './tick'
import { buildLanes, carriers, placeStatus, routeKey } from './routes'

/** Chapter 3: vans (farthest stop: the region) and helpers, plenty of everything. */
function fleetGame() {
  const s = newGame(0)
  for (const r of REGIONS.slice(0, REGIONS.findIndex((x) => x.id === 'country') + 1)) s.regions[r.id].unlocked = true
  s.workers.kid = 50
  s.vehicles.van = 10
  return s
}

describe('route map', () => {
  it('records who delivered where, vans to their farthest place first', () => {
    const s = fleetGame()
    s.items.hot = D(1e6)
    for (const r of REGIONS) s.regions[r.id].orders = D(100)
    const flows = advance(s, 1)
    expect(flows.routes[routeKey('van', 'region')]?.toNumber()).toBeGreaterThanOrEqual(100)
    expect(flows.routes[routeKey('van', 'country')]).toBeUndefined() // out of range
    expect(flows.routes[routeKey('helpers', 'country')]?.toNumber()).toBeGreaterThan(0)
  })

  it('lanes end at the farthest place each carrier reaches', () => {
    const s = fleetGame()
    const rows = REGIONS.filter((r) => s.regions[r.id].unlocked)
    const lanes = buildLanes(carriers(s, getMods(s)), rows, { [routeKey('van', 'region')]: 5 })
    const van = lanes.find((l) => l.carrier.id === 'van')!
    expect(rows[van.last].id).toBe('region')
    expect(rows[van.servedTo].id).toBe('region')
    const helpers = lanes.find((l) => l.carrier.id === 'helpers')!
    expect(rows[helpers.last].id).toBe('country')
    expect(helpers.servedTo).toBe(-1)
  })

  it('says whether the kitchen or the fleet holds a place back', () => {
    const s = fleetGame()
    const mods = getMods(s)
    const all = carriers(s, mods)
    const city = REGIONS.find((r) => r.id === 'city')!
    s.regions.city.orders = D(1e12) // full
    // Vans idle: not enough schnitzel.
    expect(placeStatus(s, mods, city, {}, all).kind).toBe('kitchen')
    // Everyone flat out: the fleet is the limit.
    const busy = Object.fromEntries(all.map((c) => [routeKey(c.id, 'city'), c.capacity]))
    expect(placeStatus(s, mods, city, busy, all).kind).toBe('fleet')
    s.regions.city.orders = D(0)
    expect(placeStatus(s, mods, city, busy, all).kind).toBe('keeping')
  })
})
