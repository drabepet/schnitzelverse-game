import { KNOCK_COOLDOWN, REGIONS } from '../engine/content'
import { fmt, fmtInt, fmtKm, fmtMoney } from '../engine/format'
import { canKnock, canUnlockRegion, clickDeliver, knockOnDoors, knockWait, unlockRegion } from '../engine/actions'
import { canReach, getMods, helperReaches, orderCap, orderRate, regionPrice } from '../engine/rules'
import { useGame } from '../game/store'
import { Why } from './Why'
import { floatText } from './juice'
import { HintButton } from './HintButton'
import { guideHint } from './guide'

export function DistributionPanel() {
  const game = useGame()
  const s = game.state
  const mods = getMods(s)
  const stock = s.items.hot.add(s.items.cold)

  const unlocked = REGIONS.filter((r) => s.regions[r.id].unlocked)
  const next = REGIONS.find((r) => !s.regions[r.id].unlocked)
  const hidden = REGIONS.filter((r) => !s.regions[r.id].unlocked).length - (next ? 1 : 0)


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
          {knockWait(s) > 0 ? `📣 Knock again in ${Math.ceil(knockWait(s))}s` : '📣 Knock on the neighbours’ door'}
        </HintButton>
      </div>
      <p className="hint">
        Hot schnitzel first. Cold ones sell for less and barely help your reputation.{' '}
        <span className="chip hot">🔥 {fmtInt(s.items.hot)}</span>{' '}
        <span className="chip cold">🧊 {fmtInt(s.items.cold)}</span>
        <Why k="cooling" label="How fast schnitzel cools" />
      </p>


      <ul className="rows">
        {unlocked.map((r) => {
          const orders = s.regions[r.id].orders
          const cap = orderCap(r, mods)
          const pct = Math.min(100, orders.div(cap).toNumber() * 100)
          return (
            <li key={r.id} className="row region">
              <span className="emoji">{r.emoji}</span>
              <div className="row-main">
                <div className="row-title">
                  {r.name}{' '}
                  <span className="muted">
                    · {fmtMoney(regionPrice(r, mods))} each
                    <Why k="price" label={`Price in ${r.name.toLowerCase()}`} base={fmtMoney(r.price)} /> ·{' '}
                    {fmt(orderRate(r, mods))} orders/s
                    <Why k="orders" label={`Orders from ${r.name.toLowerCase()}`} base={`${fmt(r.orderRate)}/s`} />
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
                    {fmtInt(orders)} / {fmtInt(cap)} orders
                  </span>
                </div>
              </div>
              <button
                className={`primary ${r.id === 'neighbours' && guideHint(s)?.target === 'deliver' ? 'pulse' : ''}`}
                disabled={orders.lt(1) || stock.lt(1) || !helperReaches(r)}
                title={!helperReaches(r) ? 'Too far to carry yourself: your fleet delivers here' : undefined}
                onClick={(e) => {
                  const before = s.money
                  if (game.act((st) => clickDeliver(st, r.id))) floatText(e, `+${fmtMoney(game.state.money.sub(before))}`)
                }}
              >
                Deliver
              </button>
            </li>
          )
        })}

        {next && (
          <li className="row region locked">
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
            <button disabled={!canUnlockRegion(s, next.id)} onClick={() => game.act((st) => unlockRegion(st, next.id))}>
              Expand
            </button>
          </li>
        )}
      </ul>

      {hidden > 0 && <p className="hint">…and {hidden} more places hungry for schnitzel. Then the world. Then the stars.</p>}
    </section>
  )
}
