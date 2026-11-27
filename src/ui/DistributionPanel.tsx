import { CRITIC_STARS, ITEMS, KNOCK_COOLDOWN, REGIONS, STAR_PRICE, type RegionDef, type ShipFuelId } from '../engine/content'
import type { GameState } from '../engine/state'
import { farmSupplyNow, needsNow } from './derived'
import { fuelStatus } from './insights'
import { goTo } from './goTo'
import { PaprikaStory } from './PaprikaStory'
import { fmt, fmtCompact, fmtInt, fmtKm, fmtMoney } from '../engine/format'
import { useSteady } from './useSteady'
import { LabelStack } from './LabelStack'
import { canKnock, canUnlockRegion, clickDeliver, knockOnDoors, knockWait, unlockRegion } from '../engine/actions'
import { canReach, chapter3Unlocked, criticStars, fuelFor, chapter4Unlocked, chapter5Unlocked, getMods, helperReaches, orderCap, orderRate, placePrice, regionRequirementsMet } from '../engine/rules'
import { useGame } from '../game/store'
import { Why } from './Why'
import { floatText } from './juice'
import { sfx } from './sound'
import { HintButton } from './HintButton'
import { firstReason, needMoney, needRequirement, affordShare } from './reasons'
import { guideHint } from './guide'
import { buildLanes, carriers, placeStatus } from '../engine/routes'
import { RouteCell, RouteLegend } from './RouteMap'

export function DistributionPanel() {
  const game = useGame()
  const s = game.state
  const mods = getMods(s)
  const stock = s.items.hot.add(s.items.cold)

  const unlocked = REGIONS.filter((r) => s.regions[r.id].unlocked)
  const next = REGIONS.find((r) => !s.regions[r.id].unlocked)
  const hidden = REGIONS.filter((r) => !s.regions[r.id].unlocked).length - (next ? 1 : 0)
  const all = carriers(s, mods)
  const lanes = buildLanes(all, unlocked, game.routeRates)
  const statuses = new Map(unlocked.map((r) => [r.id, placeStatus(s, mods, r, game.routeRates, all)]))
  const kinds = new Set([...statuses.values()].map((st) => st.kind))
  const limit = kinds.has('kitchen')
    ? '⏳ Orders are piling up while carriers have room to spare: the kitchen is the limit (or its ingredients). Faraway places get served first.'
    : kinds.has('fleet')
      ? '⏳ Orders are piling up and your carriers are all busy: more vehicles (or helpers) would help.'
      : null
  // Always one line of room: the summary never pushes the list up and down.
  const summary = useSteady(limit ?? '✅ The kitchen and the carriers keep up with the orders.', 5000)

  return (
    <section className="panel panel-distribution">
      <div className="panel-head">
        <h2>🚚 Distribution</h2>
        <HintButton
          className="ghost"
          title="Knock on the neighbours’ door"
          explain={`Asks the next-door neighbours for one extra order, at most once every ${KNOCK_COOLDOWN} seconds. Handy early on, when customers are the limit.`}
          whyNot={
            canKnock(s)
              ? null
              : knockWait(s) > 0
                ? `The neighbours need a breather: try again in ${Math.ceil(knockWait(s))} s.`
                : `The neighbours’ order list is full (${fmtInt(orderCap(REGIONS[0], mods))} orders waiting). Deliver some of them first, then knock again.`
          }
          onClick={(e) => {
            if (game.act((st) => knockOnDoors(st))) {
              floatText(e, '+1 order')
              sfx('knock')
            }
          }}
        >
          <LabelStack
            show={knockWait(s) > 0 ? 1 : 0}
            labels={['📣 Knock on the neighbours’ door', `📣 Knock again in ${Math.ceil(knockWait(s))}s`]}
          />
        </HintButton>
      </div>
      <p className="hint">
        Hot schnitzel first. Cold ones sell for less and barely help your reputation.{' '}
        <span className="chip hot num-chip" title={`${ITEMS.hot.name}: ready to deliver`}>{ITEMS.hot.emoji} {fmtCompact(s.items.hot.floor(), true)}</span>{' '}
        <span className="chip cold num-chip" title={`${ITEMS.cold.name}: gone cold while waiting, sells for less`}>{ITEMS.cold.emoji} {fmtCompact(s.items.cold.floor(), true)}</span>
        <Why k="cooling" label="How fast schnitzel cools" />
      </p>


      <FuelBox s={s} sails={game.rates.sails} />
      <RouteLegend lanes={lanes} rates={game.routeRates} />
      <p className={`route-summary small ${summary.startsWith('⏳') ? 'warn' : 'muted'}`}>{summary}</p>
      <ul className="rows">
        {unlocked.map((r, j) => {
          const orders = s.regions[r.id].orders
          const cap = orderCap(r, mods)
          const pct = Math.min(100, orders.div(cap).toNumber() * 100)
          const status = statuses.get(r.id)!
          return (
            <li key={r.id} className="row region">
              <RouteCell lanes={lanes} row={j} region={r} rates={game.routeRates} />
              <span className="emoji">{r.emoji}</span>
              <div className="row-main">
                <div className="row-title">
                  {r.name}{' '}
                  <span className="muted">
                    · {fmtMoney(placePrice(s, r, mods))} each
                    <Why k="price" label={`Price in ${r.name.toLowerCase()}`} base={fmtMoney(r.price)} /> ·{' '}
                    {fmt(orderRate(r, mods))} orders/s
                    <Why k="orders" label={`Orders from ${r.name.toLowerCase()}`} base={`${fmt(r.orderRate)}/s`} /> ·{' '}
                    {fmtKm(r.distance)}
                  </span>
                </div>
                {!canReach(s, r) && (
                  <div className="warn">
                    ⚠ {fmtKm(r.distance)} away: nothing you own can reach it. Get a {r.space ? 'space ' : ''}vehicle.
                  </div>
                )}
                <div className="bar" title={`${fmt(orderRate(r, mods))} orders per second`}>
                  <div className="bar-fill" style={{ width: `${pct}%` }} />
                  <span className="bar-label">
                    {fmtInt(orders)} / {fmtInt(cap)} orders waiting
                  </span>
                </div>
                {status.kind !== 'unreached' && (
                  <div
                    className={`place-status small ${status.kind}`}
                    title={status.detail}
                  >
                    {status.text}
                    {status.by.length > 0 && <span className="muted"> · {status.by.map((b) => b.carrier.emoji).join('')}</span>}
                  </div>
                )}
                {chapter3Unlocked(s) && <CriticLine s={s} r={r} />}
                {fuelFor(r) && canReach(s, r) && <FuelLine fuel={fuelFor(r)!} s={s} />}
              </div>
              <HintButton
                className={`primary ${r.id === 'neighbours' && guideHint(s)?.target === 'deliver' ? 'pulse' : ''}`}
                whyNot={firstReason(
                  !helperReaches(r) &&
                    (r.space
                      ? 'Far too far to carry by hand: your space vehicles deliver here.'
                      : `${fmtKm(r.distance)} away: too far to carry by hand. Your fleet delivers here.`),
                  stock.lt(1) && 'No schnitzel ready: cook one first (🍳 Garage tab).',
                  orders.lt(1) && 'No open orders here right now. Wait a moment for the next one.',
                )}
                onClick={(e) => {
                  const before = s.money
                  if (game.act((st) => clickDeliver(st, r.id))) floatText(e, `+${fmtMoney(game.state.money.sub(before))}`)
                }}
              >
                Deliver
              </HintButton>
            </li>
          )
        })}

        {next && (
          <li className="row region locked">
            <RouteCell lanes={lanes} row={-1} region={null} rates={game.routeRates} />
            <span className="emoji">{next.emoji}</span>
            <div className="row-main">
              <div className="row-title">{next.name}</div>
              <div className="row-sub">{next.flavor}</div>
              <div className="row-sub">
                {(next.requiresFranchises ?? 0) > s.prestige.franchises ? (
                  <>
                    🔒 Needs {next.requiresFranchises} franchise{next.requiresFranchises === 1 ? '' : 's'} first
                  </>
                ) : (
                  <>
                    Needs ⭐ {fmt(next.unlockReputation)} reputation · {fmtMoney(next.unlockCost)}
                  </>
                )}
              </div>
            </div>
            <HintButton
              whyNot={
                canUnlockRegion(s, next.id)
                  ? null
                  : firstReason(
                      needRequirement(s, { franchises: next.requiresFranchises, reputation: next.unlockReputation }),
                      needMoney(s, next.unlockCost, game.rates.income),
                      next.deep
                        ? 'Places beyond the Solar System open once you have reached the whole Solar System.'
                        : next.space && 'Space places open once you have reached the whole planet.',
                    )
              }
              progress={regionRequirementsMet(s, next) ? affordShare(s.money, next.unlockCost) : undefined}
              onClick={() => game.act((st) => unlockRegion(st, next.id))}
            >
              Expand
            </HintButton>
          </li>
        )}
      </ul>

      {hidden > 0 && (
        <p className="hint">
          …and {hidden} more places hungry for schnitzel.{' '}
          {chapter5Unlocked(s) ? 'All the way to the edge of everything.' : chapter4Unlocked(s) ? 'Then the Sun. Then further.' : 'Then the world. Then the stars.'}
        </p>
      )}
    </section>
  )
}

/**
 * How a long trip is fuelled: the share of what the fleet can burn that the
 * farm's star paprika covers (in steps of 10%, held, so it doesn't flicker).
 */
function FuelLine({ fuel, s }: { fuel: ShipFuelId; s: GameState }) {
  const need = needsNow(s)[fuel] ?? 0
  const made = farmSupplyNow(s)(fuel)
  const share = need > 0 ? Math.min(1, made / need) : 1
  const text = useSteady(
    share >= 0.99 || (need === 0 && s.items[fuel].gt(0))
      ? `⛽ Flying on ${ITEMS[fuel].name.toLowerCase()}`
      : share > 0.05
        ? `⛽ ${ITEMS[fuel].name} for ${Math.floor(share * 10) * 10}% of the trips; the rest drift on solar sails and arrive cold`
        : `⛵ On solar sails: no ${ITEMS[fuel].name.toLowerCase()}, so it arrives cold. Grow star paprika on the farm.`,
  )
  return (
    <div className={`place-status small ${text.startsWith('⛵') || !text.includes('Flying') ? 'warn' : 'muted'}`} title="Trips past the Moon burn star paprika, made on the farm (Prep tab).">
      {text}
    </div>
  )
}

/**
 * Star paprika at a glance, at the top of the tab: per ship fuel, what the
 * fleet burns at full capacity, what the farm makes, and how much flies on
 * solar sails (cold). A link goes to the paprika chain on the farm.
 */
function FuelBox({ s, sails }: { s: GameState; sails: number }) {
  const fuels = fuelStatus(s)
  const sailing = useSteady(sails > 0.5)
  if (!fuels.length) return null
  return (
    <div className={`fuel-box ${fuels.some((f) => f.share < 0.99) ? 'short' : ''}`}>
      <div className="fuel-box-head">
        <b>🌶️ Star paprika: ship fuel</b>
        <PaprikaStory />
        <button className="small-btn ghost" onClick={() => goTo({ tab: 'prep', anchor: 'chain-paprika' })}>
          Grow it on the farm →
        </button>
      </div>
      {fuels.map((f) => (
        <div key={f.id} className="fuel-box-row">
          <span>
            {ITEMS[f.id].emoji} {ITEMS[f.id].name} <span className="muted small">({f.id === 'fold' ? 'Mars and beyond' : 'past the Sun'})</span>
          </span>
          <span className="num-wide">
            {fmtCompact(f.made, true)} of {fmtCompact(f.need, true)}/s
          </span>
          <div className="fuel-bar" title={`The farm covers ${Math.round(f.share * 100)}% of what the fleet burns.`}>
            <div style={{ width: `${f.share * 100}%` }} />
          </div>
        </div>
      ))}
      <div className={`small ${sailing ? 'warn' : 'muted'} fuel-box-foot`}>
        {sailing ? `⛵ ${fmtCompact(sails, true)}/s drift on solar sails and arrive cold.` : '✅ Every long trip is fuelled.'}
      </div>
    </div>
  )
}

/** Food critics (Chapter 3 on): a place's stars, its hot share, and what the next star needs. */
function CriticLine({ s, r }: { s: GameState; r: RegionDef }) {
  const stars = criticStars(s, r)
  const hot = Math.floor(s.regions[r.id].critic * 100)
  const next = CRITIC_STARS[stars]
  const boost = Math.round((STAR_PRICE ** stars - 1) * 100)
  const text = useSteady(
    `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} · ${hot}% arrive hot` +
      (next !== undefined ? ` · ${'★'.repeat(stars + 1)} at ${Math.round(next * 100)}%` : '') +
      (boost ? ` · price +${boost}%` : ''),
    1500,
  )
  return (
    <div
      className={`critic-line small ${stars ? 'starred' : 'muted'}`}
      title={`${text}.\n\nThe food critics watch what arrives hot here (over the last few minutes). ${CRITIC_STARS.map((t, i) => `${'★'.repeat(i + 1)} at ${Math.round(t * 100)}%`).join(', ')}; each star puts this place’s price up ${Math.round((STAR_PRICE - 1) * 100)}%. Faster or 🔥 express vehicles, ❄️ fleet gear and a kitchen that cooks to order keep schnitzel hot.`}
    >
      {text}
    </div>
  )
}
