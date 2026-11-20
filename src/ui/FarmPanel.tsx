import { FACILITIES, FARM_CHAINS, FARM_GOAL_MULT, FARM_GOALS, INGREDIENT_IDS, ITEMS, UPGRADES, type FacilityId, type FarmChain, type IngredientId, type ItemId } from '../engine/content'
import { fmt, fmtInt } from '../engine/format'
import { buyFacility } from '../engine/actions'
import { farmBottleneck } from '../engine/automation'
import {
  chapter2Unlocked,
  facilityCapacity,
  facilityPlan,
  facilitySpeed,
  farmGoalBonus,
  farmGoalsReached,
  farmSupply,
  getMods,
  nextFarmGoal,
  shopSupplyRate,
  supplyNeeds,
  type Mods,
} from '../engine/rules'
import type { GameState } from '../engine/state'
import { useGame, type GameStore } from '../game/store'
import { SupplyPanel } from './SupplyPanel'
import { BuyLabel, PanelHead } from './BuyAmount'
import { Why } from './Why'
import { facilityLook, shopLook } from '../engine/names'
import { HintButton } from './HintButton'
import { needMoney } from './reasons'
import { UpgradesPanel } from './UpgradesPanel'
import { isShopGear } from '../engine/tiers'
import { GearList } from './FarmGear'

const CHAIN_OF: Partial<Record<IngredientId, FarmChain>> = Object.fromEntries(
  FARM_CHAINS.flatMap((c) => c.outputs.map((o) => [o, c])),
)

/**
 * The farm page: what the kitchen needs and where it comes from, the shop
 * (backup) with its own equipment, farm-wide equipment, then one card per
 * chain with its buildings, their gear and count goals.
 */
export function FarmPanel() {
  const game = useGame()
  const s = game.state
  if (!chapter2Unlocked(s)) return null
  const mods = getMods(s)
  const need = supplyNeeds(s, mods)

  // The building holding back each short ingredient.
  const slow = new Map<FacilityId, IngredientId[]>()
  for (const item of INGREDIENT_IDS) {
    const n = need[item] ?? 0
    if (n <= 0 || farmSupply(s, item, mods) >= n * 0.98) continue
    const f = farmBottleneck(s, item, mods)
    if (f && s.facilities[f.id] > 0) slow.set(f.id, [...(slow.get(f.id) ?? []), item])
  }

  return (
    <section className="farm-page">
      <div className="tab-grid farm-top">
        <div className="panel">
          <h2>🚜 What the kitchen needs</h2>
          <p className="hint">
            The farm fills your stock first; {shopLook(s).name} covers what’s missing, up to {fmt(shopSupplyRate(mods))} of each per
            second. Buildings and gear reset with each franchise.
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
          {INGREDIENT_IDS.map((item) => (
            <Coverage key={item} item={item} need={need[item] ?? 0} farm={farmSupply(s, item, mods)} shop={shopSupplyRate(mods)} />
          ))}
        </div>
        <SupplyPanel backup />
      </div>

      <UpgradesPanel pillar="prep" only={(u) => !isShopGear(u)} title="🚜 Farm-wide equipment" />

      <div className="farm-chains-head">
        <PanelHead>🏡 Grandpa’s farm</PanelHead>
        <p className="hint">
          Each chain runs left to right. 🐢 marks the slowest step. Every building has its own gear: a new piece each time you reach a
          further place, some help another chain (🔗) or make schnitzel worth more (✨). 🎯 Count goals make a building faster.
        </p>
      </div>
      <div className="chain-grid">
        {FARM_CHAINS.map((chain) => {
          const hand = UPGRADES.filter((u) => u.chain === chain.id)
          return (
            <div key={chain.id} className="panel chain">
              <div className="chain-head">
                <h3>
                  {chain.emoji} {chain.name}
                </h3>
                <span className="muted small">
                  {chain.outputs
                    .map((o) => `${ITEMS[o].emoji} ${fmt(farmSupply(s, o, mods))} of ${fmt(need[o] ?? 0)}/s`)
                    .join(' · ')}
                </span>
              </div>
              <GearList gear={hand} />
              <div className="flow">
                {chain.buildings.map((id, i) => (
                  <FlowStep key={id} id={id} first={i === 0} game={game} s={s} mods={mods} holdsBack={slow.get(id)} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** One stacked bar: how much of the kitchen's need the farm covers, the shop adds, and what's missing. */
function Coverage({ item, need, farm, shop }: { item: IngredientId; need: number; farm: number; shop: number }) {
  const fromFarm = Math.min(farm, need)
  const fromShop = Math.min(shop, need - fromFarm)
  const short = Math.max(0, need - fromFarm - fromShop)
  const pct = (x: number) => (need > 0 ? (x / need) * 100 : 0)
  const chain = CHAIN_OF[item]
  return (
    <div className="coverage">
      <div className="coverage-label">
        <span>
          {ITEMS[item].emoji} {ITEMS[item].name}
          {chain && <span className="muted small"> · {chain.emoji} {chain.name.toLowerCase()} chain</span>}
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

/** Progress to the next count goal for one kind of building. */
function Goal({ count, name }: { count: number; name: string }) {
  const next = nextFarmGoal(count)
  const reached = farmGoalsReached(count)
  const bonus = farmGoalBonus(count)
  if (next === null)
    return (
      <div className="count-goal small muted" title={`Every goal reached: ${name} ×${fmt(bonus)}`}>
        🎯 All goals reached · ×{fmt(bonus)}
      </div>
    )
  const prev = reached > 0 ? FARM_GOALS[reached - 1] : 0
  const pct = Math.max(0, Math.min(100, ((count - prev) / (next - prev)) * 100))
  return (
    <div
      className="count-goal small"
      title={`Own ${next} to make every one ×${FARM_GOAL_MULT} faster.${reached ? ` Goals reached so far: ${reached} (×${fmt(bonus)}).` : ''}`}
    >
      <span>
        🎯 {count}/{next} → ×{FARM_GOAL_MULT}
      </span>
      {reached > 0 && <span className="muted"> · now ×{fmt(bonus)}</span>}
      <div className="count-goal-bar">
        <div style={{ width: `${pct}%` }} />
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
  holdsBack,
}: {
  id: FacilityId
  first: boolean
  game: GameStore
  s: GameState
  mods: Mods
  holdsBack?: IngredientId[]
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
  const gear = UPGRADES.filter((u) => u.building === f.id)
  let status = ''
  let warn = false
  if (count === 0) status = 'Not built yet'
  else if (holdsBack?.length) {
    status = `🐢 Slowest step: holding back ${holdsBack.map((i) => ITEMS[i].emoji).join(' ')}`
    warn = true
  } else if (actual >= capacity * 0.9) status = 'Running at full speed'
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
      <div className={`node ${count === 0 ? 'empty' : ''} ${holdsBack?.length ? 'slowest' : ''}`}>
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
          {ITEMS[f.output].emoji} · {fmt(facilitySpeed(s, f, mods) * f.yield)}/s each
          <Why k={f.id} label={`${look.name} speed`} base={`${fmt(f.rate * f.yield)}/s`} />
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
        <Goal count={count} name={look.name} />
        <GearList gear={gear} />
        <HintButton
          className="buy-btn"
          whyNot={plan.affordable ? null : needMoney(s, plan.cost, game.rates.income)}
          onClick={() => game.act((st) => buyFacility(st, f.id, st.settings.buyAmount))}
        >
          <BuyLabel verb="Build" plan={plan} />
        </HintButton>
      </div>
    </>
  )
}
