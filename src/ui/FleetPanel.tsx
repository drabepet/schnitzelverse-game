import { FIT_OUTS, HELPER_RANGE_KM, REGIONS, UPGRADES, VEHICLES, type FitOut, type VehicleDef } from '../engine/content'
import { fmt, fmtKm as km } from '../engine/format'
import { buyVehicle, setFitOut } from '../engine/actions'
import {
  chapter3Unlocked,
  chapter4Unlocked,
  freshness,
  getMods,
  taskCapacity,
  vehicleCapacity,
  vehiclePlan,
  vehicleServes,
  vehicleVisible,
} from '../engine/rules'
import { useGame } from '../game/store'
import { BuyLabel, PanelHead } from './BuyAmount'
import { Why } from './Why'
import { HintButton } from './HintButton'
import { needMoney, affordShare } from './reasons'
import { CountGoal } from './CountGoal'
import { GearList } from './FarmGear'

/** Each vehicle's own gear, cheapest first: built once. */
const GEAR_OF = new Map(VEHICLES.map((v) => [v.id, UPGRADES.filter((u) => u.vehicle === v.id).sort((a, b) => a.cost - b.cost)]))

/** Standard / Cargo / Express for one kind of vehicle. The wormhole is always hot, so it has no Express. */
function FitOutPicker({ v }: { v: VehicleDef }) {
  const game = useGame()
  const current: FitOut = game.state.fitOuts[v.id] ?? 'standard'
  const choices = FIT_OUTS.filter((f) => !(f.id === 'express' && v.freshKm === Infinity))
  return (
    <div className="buy-amount fit-outs" role="radiogroup" aria-label={`How the ${v.name.toLowerCase()} is fitted out`}>
      {choices.map((f) => (
        <button
          key={f.id}
          role="radio"
          aria-checked={current === f.id}
          className={current === f.id ? 'on' : ''}
          title={`${f.name}: ${f.blurb} Switch any time, free; kept for your next run too.`}
          onClick={() => game.act((st) => setFitOut(st, v.id, f.id))}
        >
          {f.emoji} {f.name}
        </button>
      ))}
    </div>
  )
}

export function FleetPanel() {
  const game = useGame()
  const s = game.state
  if (!chapter3Unlocked(s)) return null
  const mods = getMods(s)
  // The farthest place of its kind (Earth or space) you deliver to, to show how fresh each vehicle gets there.
  const farthestFor = (space: boolean) =>
    [...REGIONS].reverse().find((r) => s.regions[r.id].unlocked && !!r.space === space)

  return (
    <section className="panel panel-fleet">
      <PanelHead>🛣️ Fleet</PanelHead>
      <p className="hint">
        Your helpers reach {km(HELPER_RANGE_KM)} ({fmt(taskCapacity(s, 'deliver', mods))}/s). Vehicles add capacity and
        range; faster ones arrive hotter, and hot arrivals earn critic stars. The fleet takes the farthest, best-paying places
        first. Fit each kind out for 📦 cargo (carries ×2, cools faster) or 🔥 express (stays hot further): free to switch,
        kept between runs. Vehicles and their gear reset with each franchise.
        {chapter4Unlocked(s) && ' Space vehicles fly only to space places; Earth vehicles stay on Earth.'}
      </p>
      <ul className="rows">
        {VEHICLES.filter((v) => vehicleVisible(s, v)).map((v) => {
          const count = s.vehicles[v.id]
          const farthest = farthestFor(!!v.space)
          const reaches = !!farthest && vehicleServes(v, farthest)
          const plan = vehiclePlan(s, v)
          return (
            <li key={v.id} className="row vehicle-row">
              <span className="emoji">{v.emoji}</span>
              <div className="row-main">
                <div className="row-title">
                  {v.name} <span className="count">×{count}</span>
                </div>
                <div className="row-sub">
                  {fmt(v.capacity * mods.fleet * mods.vehicleCap[v.id])}/s each
                  <Why k="fleet" label={`${v.name} capacity`} base={`${fmt(v.capacity)}/s`} /> · range {km(v.range)} ·{' '}
                  {v.speed.toLocaleString('en-US')} km/h
                  {count > 0 && <> · total {fmt(vehicleCapacity(s, v, mods))}/s</>}
                </div>
                <div className="row-sub">
                  {!farthest
                    ? 'No space places yet: unlock the orbital station'
                    : reaches
                      ? `${Math.round(freshness(v, farthest, mods) * 100)}% still hot at ${farthest.name.toLowerCase()}`
                      : `Can’t reach ${farthest.name.toLowerCase()}`}
                </div>
              </div>
              <HintButton
                className="buy-btn"
                whyNot={plan.affordable ? null : needMoney(s, plan.cost, game.rates.income)}
                progress={affordShare(s.money, plan.cost)}
                onClick={() => game.act((st) => buyVehicle(st, v.id, st.settings.buyAmount))}
              >
                <BuyLabel verb="Buy" plan={plan} />
              </HintButton>
              <div className="vehicle-extras">
                <FitOutPicker v={v} />
                {count > 0 && <CountGoal count={count} name={`${v.name}s`} />}
                {count > 0 && <GearList gear={GEAR_OF.get(v.id)!} />}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
