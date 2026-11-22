import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { FINAL_REGION, REGIONS, UPGRADES, VEHICLES } from './content'
import { newGame } from './state'
import { buyPerk, canUnlockRegion, unlockRegion } from './actions'
import { chapter5Unlocked, chapterNumber, freshness, getMods, upgradeVisible, vehicleServes, vehicleVisible } from './rules'
import { fmtKm } from './format'

const place = (id: string) => REGIONS.find((r) => r.id === id)!
const vehicle = (id: string) => VEHICLES.find((v) => v.id === id)!

describe('Chapter 5: the Schnitzelverse', () => {
  it('opens only once the Solar System has been reached', () => {
    const s = newGame(0)
    s.money = D(1e30)
    s.reputation = D(1e30)
    s.milestones.planet = true
    expect(canUnlockRegion(s, 'nextStar')).toBe(false)
    expect(vehicleVisible(s, vehicle('warp'))).toBe(false)
    expect(upgradeVisible(s, UPGRADES.find((u) => u.id === 'stasisCrates')!)).toBe(false)
    s.milestones.solar = true
    expect(chapter5Unlocked(s)).toBe(true)
    expect(chapterNumber(s)).toBe(5)
    expect(vehicleVisible(s, vehicle('warp'))).toBe(true)
    expect(unlockRegion(s, 'nextStar')).toBe(true)
  })

  it('ends at the Schnitzelverse, the last place', () => {
    expect(REGIONS[REGIONS.length - 1].id).toBe(FINAL_REGION)
  })

  it('warp freighters reach the Milky Way but need stasis crates to arrive hot; wormholes reach everything', () => {
    const s = newGame(0)
    const warp = vehicle('warp')
    expect(vehicleServes(warp, place('milkyWay'))).toBe(true)
    expect(vehicleServes(warp, place('nextGalaxy'))).toBe(false)
    expect(vehicleServes(vehicle('ark'), place('nextStar'))).toBe(false)
    expect(vehicleServes(vehicle('wormhole'), place('schnitzelverse'))).toBe(true)
    expect(freshness(vehicle('wormhole'), place('schnitzelverse'), getMods(s))).toBe(1)
    expect(freshness(warp, place('milkyWay'), getMods(s))).toBeLessThan(0.01)
    s.upgrades.stasisCrates = true
    expect(freshness(warp, place('milkyWay'), getMods(s))).toBeGreaterThan(0.3)
  })

  it('Warp contracts start runs with warp freighters, Launch contracts don’t', () => {
    const s = newGame(0)
    s.milestones.planet = true
    s.milestones.solar = true
    s.prestige.crumbs = D(1e12)
    s.prestige.perks.fleetContracts = 3
    buyPerk(s, 'launchContracts')
    expect(s.prestige.perks.launchContracts).toBe(1)
    expect(s.vehicles.warp).toBe(0)
    s.prestige.perks.launchContracts = 3
    buyPerk(s, 'warpContracts')
    expect(s.vehicles.warp).toBe(1)
  })

  it('shows distances in light years far away', () => {
    expect(fmtKm(3.97e13)).toBe('4.2 light years')
    expect(fmtKm(9.461e17)).toBe('100,000 light years')
    expect(fmtKm(2.36525e19)).toBe('2.5M light years')
    expect(fmtKm(1e30)).toBe('everywhere at once')
  })
})
