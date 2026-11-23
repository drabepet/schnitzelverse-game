import { HELPER_RANGE_KM, REGIONS, VEHICLES } from '../engine/content'
import { fmt, fmtKm as km } from '../engine/format'
import { buyVehicle } from '../engine/actions'
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
        range; faster ones arrive hotter. The fleet takes the farthest, best-paying places first. Vehicles reset with each
        franchise.{chapter4Unlocked(s) && ' Space vehicles fly only to space places; Earth vehicles stay on Earth.'}
      </p>
      <ul className="rows">
        {VEHICLES.filter((v) => vehicleVisible(s, v)).map((v) => {
          const count = s.vehicles[v.id]
          const farthest = farthestFor(!!v.space)
          const reaches = !!farthest && vehicleServes(v, farthest)
          const plan = vehiclePlan(s, v)
          return (
            <li key={v.id} className="row">
              <span className="emoji">{v.emoji}</span>
              <div className="row-main">
                <div className="row-title">
                  {v.name} <span className="count">×{count}</span>
                </div>
                <div className="row-sub">
                  {fmt(v.capacity * mods.fleet)}/s each
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
            </li>
          )
        })}
      </ul>
    </section>
  )
}
