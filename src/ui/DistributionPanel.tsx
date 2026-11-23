import { KNOCK_COOLDOWN, REGIONS } from '../engine/content'
import { fmt, fmtCompact, fmtInt, fmtKm, fmtMoney } from '../engine/format'
import { useSteady } from './useSteady'
import { LabelStack } from './LabelStack'
import { canKnock, canUnlockRegion, clickDeliver, knockOnDoors, knockWait, unlockRegion } from '../engine/actions'
import { canReach, chapter4Unlocked, chapter5Unlocked, getMods, helperReaches, orderCap, orderRate, regionPrice, regionRequirementsMet } from '../engine/rules'
import { useGame } from '../game/store'
import { Why } from './Why'
import { floatText } from './juice'
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
            if (game.act((st) => knockOnDoors(st))) floatText(e, '+1 order')
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
        <span className="chip hot num-chip">🔥 {fmtCompact(s.items.hot.floor(), true)}</span>{' '}
        <span className="chip cold num-chip">🧊 {fmtCompact(s.items.cold.floor(), true)}</span>
        <Why k="cooling" label="How fast schnitzel cools" />
      </p>


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
                    · {fmtMoney(regionPrice(r, mods))} each
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
