import type { ReactNode } from 'react'
import { FACILITIES, FARM_CHAINS, ITEMS, type FacilityId, type IngredientId, type ItemId } from '../engine/content'
import { fmt, fmtInt } from '../engine/format'
import { buyFacility } from '../engine/actions'
import {
  chapter2Unlocked,
  facilityCapacity,
  facilityPlan,
  farmSupply,
  getMods,
  shopSupplyRate,
  supplyNeeds,
  type Mods,
} from '../engine/rules'
import type { GameState } from '../engine/state'
import { useGame, type GameStore } from '../game/store'
import { SupplyPanel } from './SupplyPanel'
import { BuyLabel, PanelHead } from './BuyAmount'
import { Why } from './Why'
import { facilityLook } from '../engine/names'

/** The farm page; `equipment` sits next to the intro, so it isn't buried below the chains. */
export function FarmPanel({ equipment }: { equipment?: ReactNode }) {
  const game = useGame()
  const s = game.state
  if (!chapter2Unlocked(s)) return null
  const mods = getMods(s)
  const need = supplyNeeds(s, mods)

  return (
    <section className="farm-page">
      <div className="tab-grid farm-top">
      <div className="panel">
        <PanelHead>🚜 Grandpa’s farm</PanelHead>
        <p className="hint">
          The corner shop sells at most {fmt(shopSupplyRate(mods))} of each ingredient per second. Grow the rest yourself: the farm
          fills your stock first, the shop covers what’s missing. Buildings reset with each franchise.
        </p>
        <div className="legend">
          <span>
            <i className="swatch farm" /> farm
          </span>
          <span>
            <i className="swatch shop" /> shop
          </span>
          <span>
            <i className="swatch short" /> short
          </span>
        </div>
      </div>
      {equipment}
      </div>

      <div className="chain-grid">
        {FARM_CHAINS.map((chain) => (
          <div key={chain.id} className="panel chain">
            <h3>
              {chain.emoji} {chain.name}
            </h3>
            {chain.outputs.map((item) => (
              <Coverage key={item} item={item} need={need[item] ?? 0} farm={farmSupply(s, item, mods)} shop={shopSupplyRate(mods)} />
            ))}
            <div className="flow">
              {chain.buildings.map((id, i) => (
                <FlowStep key={id} id={id} first={i === 0} game={game} s={s} mods={mods} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <SupplyPanel backup />
    </section>
  )
}

/** One stacked bar: how much of the kitchen's need the farm covers, the shop adds, and what's missing. */
function Coverage({ item, need, farm, shop }: { item: IngredientId; need: number; farm: number; shop: number }) {
  const fromFarm = Math.min(farm, need)
  const fromShop = Math.min(shop, need - fromFarm)
  const short = Math.max(0, need - fromFarm - fromShop)
  const pct = (x: number) => (need > 0 ? (x / need) * 100 : 0)
  return (
    <div className="coverage">
      <div className="coverage-label">
        <span>
          {ITEMS[item].emoji} {ITEMS[item].name}
        </span>
        <span className="muted">kitchen uses {fmt(need)}/s</span>
      </div>
      <div className="stacked" title={`farm ${fmt(fromFarm)}/s · shop ${fmt(fromShop)}/s · short ${fmt(short)}/s`}>
        <div className="seg farm" style={{ width: `${pct(fromFarm)}%` }} />
        <div className="seg shop" style={{ width: `${pct(fromShop)}%` }} />
        <div className="seg short" style={{ width: `${pct(short)}%` }} />
      </div>
      <div className="coverage-nums">
        farm {fmt(fromFarm)} · shop {fmt(fromShop)}
        {short > 0.05 && <b className="warn"> · short {fmt(short)}/s</b>}
        {farm > need * 1.05 && need > 0 && <span className="muted"> · farm could make {fmt(farm)}</span>}
      </div>
    </div>
  )
}

function FlowStep({
  id,
  first,
  game,
  s,
  mods,
}: {
  id: FacilityId
  first: boolean
  game: GameStore
  s: GameState
  mods: Mods
}) {
  const f = FACILITIES.find((x) => x.id === id)!
  const look = facilityLook(s, id)
  const inputs = Object.entries(f.inputs) as [ItemId, number][]
  const count = s.facilities[f.id]
  const capacity = facilityCapacity(s, f, mods).toNumber() * f.yield
  const actual = game.farmRates[f.id] ?? 0
  const starvedBy = inputs
    .filter(([item, qty]) => farmSupply(s, item, mods) / qty < (capacity / f.yield) * 0.9)
    .map(([item]) => item)
  const plan = facilityPlan(s, f)
  const load = capacity > 0 ? Math.min(100, (actual / capacity) * 100) : 0
  let status = ''
  let warn = false
  if (count === 0) status = 'Not built yet'
  else if (actual >= capacity * 0.9) status = 'Running at full speed'
  else if (starvedBy.length) {
    status = `Needs more ${starvedBy.map((i) => ITEMS[i].emoji).join(' ')}`
    warn = true
  } else status = '⏸ Stock full'

  return (
    <>
      {!first && (
        <div className="flow-arrow" aria-hidden>
          <span>→</span>
          {inputs.map(([item]) => (
            <small key={item} title={`${ITEMS[item].name} waiting`}>
              {ITEMS[item].emoji} {fmtInt(s.items[item])}
            </small>
          ))}
        </div>
      )}
      <div className={`node ${count === 0 ? 'empty' : ''}`}>
        <div className="node-head">
          <span className="node-emoji">{look.emoji}</span>
          <span className="node-name" title={look.name !== look.original ? `${look.flavor} (started out as: ${look.original})` : look.flavor}>
            {look.name}
          </span>
          <span className="count">×{count}</span>
        </div>
        <div className="node-recipe muted">
          {inputs.map(([item, qty]) => `${qty > 1 ? qty : ''}${ITEMS[item].emoji}`).join(' ')}
          {inputs.length ? ' → ' : ''}
          {f.yield > 1 ? f.yield : ''}
          {ITEMS[f.output].emoji} · {fmt(f.rate * f.yield * mods.facility[f.group])}/s each
          <Why k={f.group} label={`${look.name} speed`} base={`${fmt(f.rate * f.yield)}/s`} />
        </div>
        {count > 0 && (
          <>
            <div className="mini-bar" title={`${Math.round(load)}% busy`}>
              <div style={{ width: `${load}%` }} />
            </div>
            <div className="node-rate">
              {fmt(actual)} / {fmt(capacity)} per s
            </div>
          </>
        )}
        <div className={warn ? 'warn small' : 'muted small'}>{status}</div>
        <button
          className="buy-btn"
          disabled={!plan.affordable}
          onClick={() => game.act((st) => buyFacility(st, f.id, st.settings.buyAmount))}
        >
          <BuyLabel verb="Build" plan={plan} />
        </button>
      </div>
    </>
  )
}
