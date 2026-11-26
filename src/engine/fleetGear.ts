// Fleet gear: four rungs for each kind of vehicle, at the places where that
// vehicle does its work. They alternate 📦 (carries more) and ❄️ (keeps food
// hot further, which earns critic stars). The wormhole gate is always hot, so
// all its rungs carry more. Count goals for vehicles work like the farm's.
// Only data and a builder here: data/upgrades.ts appends the result to UPGRADES.
import type { Effect, RegionDef, RegionId, UpgradeDef, VehicleDef, VehicleId } from './content'

/** Each rung's place, per vehicle. */
export const FLEET_GEAR_PLACES = {
  van: ['nextTown', 'city', 'region', 'country'],
  truck: ['city', 'region', 'country', 'continent'],
  train: ['region', 'country', 'continent', 'planet'],
  plane: ['continent', 'planet', 'orbit', 'moon'],
  rocket: ['orbit', 'moon', 'mars', 'belt'],
  cruiser: ['moon', 'mars', 'belt', 'jupiter'],
  ark: ['mars', 'belt', 'jupiter', 'solar'],
  warp: ['nextStar', 'cluster', 'milkyWay', 'nextGalaxy'],
  wormhole: ['milkyWay', 'nextGalaxy', 'localGroup', 'universe'],
} as const satisfies Record<VehicleId, readonly RegionId[]>

export type FleetGearId = {
  [V in VehicleId]: `${V}_${(typeof FLEET_GEAR_PLACES)[V][number]}`
}[VehicleId]

/** A capacity rung carries this much more. */
export const FLEET_CAPACITY_MULT = 1.3
/** A fresh rung keeps food hot this much further. */
export const FLEET_FRESH_MULT = 1.3
/** Rung price: this share of its place's price, and never less than one vehicle. */
export const FLEET_RUNG_COST_SHARE = 0.15

type Rung = [emoji: string, name: string, flavor: string]

/** Rungs 1 and 3 carry more, 2 and 4 keep food hot (except the wormhole: all carry). */
const LADDERS: Record<VehicleId, Rung[]> = {
  van: [
    ['🧳', 'Roof rack', 'Two more crates on top. Bungee cords, lots of them.'],
    ['🧥', 'Quilted hot boxes', 'Grandma sewed the covers. The schnitzels are warmer than the driver.'],
    ['🚐', 'A longer wheelbase', 'Same van, an extra metre in the middle. Nobody asks how.'],
    ['🗺️', 'Sat-nav with shortcuts', 'It knows every back lane. Some of them are gardens.'],
  ],
  truck: [
    ['🚛', 'A second trailer', 'Forty tonnes becomes eighty. The bridges are mostly fine.'],
    ['♨️', 'Exhaust-heated cargo bay', 'The engine’s heat goes to the schnitzels. Finally a use for it.'],
    ['📦', 'Stackable crates', 'Folded flat on the way back, so the truck can carry more out.'],
    ['🛣️', 'Night runs on empty motorways', 'No traffic, no stops, still crackling on arrival.'],
  ],
  train: [
    ['🚃', 'Extra carriages', 'The train is now longer than the platform. They open the doors in turns.'],
    ['🔥', 'A fryer in the dining car', 'The last fry happens on the way. Fresh off the rails.'],
    ['🚂', 'A second locomotive', 'One pulls, one pushes, the schnitzels go nowhere but forward.'],
    ['⚡', 'High-speed line', 'Three hundred kilometres an hour. The crumbs don’t move an inch.'],
  ],
  plane: [
    ['🛫', 'Belly hold crates', 'Every gap in the plane is a crate. The pilot’s seat is negotiable.'],
    ['🌡️', 'Heated cargo hold', 'Twenty degrees outside the window, two hundred inside the crates.'],
    ['✈️', 'Wide-body planes', 'Twice the width, the same runway. Mostly.'],
    ['🪂', 'Hot drops', 'No landing: the crates come down on little parachutes, sizzling.'],
  ],
  rocket: [
    ['🧱', 'Stacked fairings', 'A taller nose cone, full of crates.'],
    ['🔥', 'Re-entry warming', 'The heat shield gets hot anyway. Now the schnitzels do too.'],
    ['🚀', 'Strap-on boosters', 'Four more engines, four more holds.'],
    ['🧊', 'Thermos hull', 'Vacuum between two walls: space keeps the food hot for you.'],
  ],
  cruiser: [
    ['🛸', 'Cargo pods', 'Clip-on pods, each one the size of a house.'],
    ['🌞', 'Sunlit hot decks', 'The crates ride on the sunny side. Rotated every hour.'],
    ['🛰️', 'A convoy of drones', 'Little helpers fly alongside with the extra crates.'],
    ['⏩', 'Gravity slingshots', 'Round the planets and away, faster than the crust can cool.'],
  ],
  ark: [
    ['🏙️', 'Cargo city decks', 'A whole floor of the ark, just shelves.'],
    ['🫕', 'Slow-cooker cabins', 'The trip takes months; the schnitzels stay toasty in stewpots of warm air.'],
    ['🌌', 'A second hull', 'The ark’s twin. It carries what the first one couldn’t.'],
    ['⏳', 'Stasis cupboards', 'Inside, time stands still. The schnitzel comes out as it went in.'],
  ],
  warp: [
    ['🌠', 'Folded holds', 'The holds are bigger on the inside. Much bigger.'],
    ['❄️', 'Warp-field insulation', 'Space folds round the crates, and the heat folds back in.'],
    ['📐', 'Wider warp bubble', 'Room for another freighter’s worth, if nobody leans out.'],
    ['🕰️', 'Arrive before you left', 'The schnitzel lands a second after it’s fried. Physicists are upset.'],
  ],
  wormhole: [
    ['🕳️', 'A wider mouth', 'Push the crates through two at a time.'],
    ['🔁', 'A conveyor belt through the gap', 'Crates go in on a belt, and come out on one.'],
    ['🌀', 'Twin gates', 'A second wormhole next to the first. Only slightly unsettling.'],
    ['🍽️', 'The gate opens onto the plate', 'No crates at all: the schnitzel goes straight from pan to plate.'],
  ],
}

/** The effect of rung i (0–3) for this vehicle. */
function rungEffect(v: VehicleDef, i: number): Effect {
  const hotForever = v.freshKm === Infinity
  return hotForever || i % 2 === 0
    ? { kind: 'vehicle', vehicle: v.id, capacity: FLEET_CAPACITY_MULT }
    : { kind: 'vehicle', vehicle: v.id, fresh: FLEET_FRESH_MULT }
}

/** The fleet gear as upgrades, given the places and vehicles (passed in to avoid an import cycle). */
export function buildFleetGear(regions: RegionDef[], vehicles: VehicleDef[], chapter3: number): UpgradeDef[] {
  const out: UpgradeDef[] = []
  for (const v of vehicles) {
    LADDERS[v.id].forEach(([emoji, name, flavor], i) => {
      const place = FLEET_GEAR_PLACES[v.id][i]
      const region = regions.find((r) => r.id === place)!
      out.push({
        id: `${v.id}_${place}` as FleetGearId,
        name,
        emoji,
        description: flavor,
        cost: Math.round(Math.max(region.unlockCost * FLEET_RUNG_COST_SHARE, v.baseCost)),
        requires: { place, franchises: chapter3 },
        space: v.space,
        deep: v.deep,
        vehicle: v.id,
        effects: [rungEffect(v, i)],
      })
    })
  }
  return out
}
