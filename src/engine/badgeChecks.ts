// Small building blocks for badge goals (shared by badges.ts and badgesExtra.ts).
import { FACILITIES, type FacilityId, type RegionId, type StageId, type VehicleId, VEHICLES, type WorkerId, WORKERS } from './content'
import { D } from './decimal'
import type { GameState } from './state'

export const served = (n: number | string) => (s: GameState) => s.stats.served.gte(D(n))
export const earned = (n: number | string) => (s: GameState) => s.stats.earned.gte(D(n))
export const fame = (n: number | string) => (s: GameState) => s.reputation.gte(D(n))
export const workers = (id: WorkerId, n: number) => (s: GameState) => s.workers[id] >= n
export const building = (id: FacilityId, n: number) => (s: GameState) => s.facilities[id] >= n
export const vehicles = (id: VehicleId, n: number) => (s: GameState) => s.vehicles[id] >= n
export const place = (id: RegionId) => (s: GameState) => s.regions[id].unlocked
export const byHand = (stage: StageId, n: number) => (s: GameState) => s.stats.byHand[stage] >= n
export const hours = (h: number) => (s: GameState) => s.stats.playtime >= h * 3600
export const franchises = (n: number) => (s: GameState) => s.prestige.franchises >= n
export const totalCrumbs = (n: number | string) => (s: GameState) => s.prestige.totalCrumbs.gte(D(n))
export const badgeCount = (n: number) => (s: GameState) => Object.keys(s.badges).length >= n
export const totalWorkers = (s: GameState) => WORKERS.reduce((n, w) => n + s.workers[w.id], 0)
export const totalFacilities = (s: GameState) => FACILITIES.reduce((n, f) => n + s.facilities[f.id], 0)
export const totalVehicles = (s: GameState) => VEHICLES.reduce((n, v) => n + s.vehicles[v.id], 0)
export const ownedUpgrades = (s: GameState) => Object.keys(s.upgrades).length
/** Reached this place within `minutes` of starting the run. */
export const speedrun = (id: RegionId, minutes: number) => (s: GameState) => s.regions[id].unlocked && s.run.time <= minutes * 60
