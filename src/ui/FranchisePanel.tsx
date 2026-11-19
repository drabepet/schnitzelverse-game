import { useState } from 'react'
import { PERKS } from '../engine/content'
import { fmt, fmtMoney, fmtTime } from '../engine/format'
import { buyPerk, franchise } from '../engine/actions'
import {
  canBuyPerk,
  canFranchise,
  crumbProgress,
  nextCrumbAt,
  pendingCrumbs,
  perkCost,
  perkLevel,
  perkMaxed,
  perkVisible,
} from '../engine/rules'
import { useGame } from '../game/store'
import { ManagerToggles } from './Managers'
import type { PerkDef } from '../engine/content'

export function FranchisePanel() {
  const game = useGame()
  const s = game.state
  const p = s.prestige
  const [confirming, setConfirming] = useState(false)
  if (!p.unlocked && p.franchises === 0) return null

  const pending = pendingCrumbs(s)
  const affordable = PERKS.filter((perk) => canBuyPerk(s, perk)).length
  const next = crumbProgress(s)
  const pct = Math.floor(next.fraction * 100)
  const income = game.rates.income
  const eta = income > 0 ? next.remaining.div(income).toNumber() : Infinity

  return (
    <section className="panel panel-franchise">
      <h2>✨ Franchise</h2>
      <div className="crumbs">
        <span className="crumbs-value">✨ {fmt(p.crumbs, 0)}</span>
        <span className="muted">
          Golden Crumbs · {p.franchises} franchise{p.franchises === 1 ? '' : 's'} so far
        </span>
      </div>

      <div className="franchise-box">
        <div>
          Selling now gives <b>+{fmt(pending, 0)} ✨</b>
          <div className="row-sub">
            Lifetime earnings {fmtMoney(s.stats.earned)}; next crumb at {fmtMoney(nextCrumbAt(s))}. This run:{' '}
            {fmtMoney(s.run.earned)} in {fmtTime(s.run.time)}.
          </div>
        </div>
        <button className="primary" disabled={!canFranchise(s)} onClick={() => setConfirming(true)}>
          Sell &amp; franchise
        </button>
      </div>

      <div className="next-crumb">
        <div className="next-crumb-label">
          <span>
            Next Golden Crumb: <b>+{fmt(pending.add(1), 0)} ✨</b> if you sell
          </span>
          <span className="muted">
            {fmtMoney(next.remaining)} to go
            {Number.isFinite(eta) ? ` · about ${fmtTime(eta)}` : ''}
          </span>
        </div>
        <div className="bar next-crumb-bar" title={`${pct}% of the way to the next Golden Crumb`}>
          <div className="bar-fill" style={{ width: `${pct}%` }} />
          <span className="bar-label">{pct}%</span>
        </div>
      </div>

      <h3 className="book-title">
        📜 Recipe book {affordable > 0 && <span className="pill">{affordable} affordable</span>}
      </h3>
      <p className="hint">Permanent. Perks survive every franchise.</p>
      <PerkGrid perks={PERKS.filter((perk) => !perk.manager && perkVisible(s, perk))} />

      <h3 className="book-title">🤖 Managers: promote the family</h3>
      <p className="hint">
        The staff does the work; the family runs the business. Promoted family members do the buying for you, also
        while you’re away. Each buys only things that cost at most a tenth of your money
        (equipment: a quarter). Switch them on and off any time.
      </p>
      <ManagerToggles />
      <PerkGrid perks={PERKS.filter((perk) => perk.manager && perkVisible(s, perk))} />

      {confirming && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="dialog">
            <h2>Sell the garage kitchen?</h2>
            <p>
              You get <b>+{fmt(pending, 0)} Golden Crumbs ✨</b> and start over in an empty garage.
            </p>
            <p className="row-sub">
              <b>Resets:</b> money, reputation, stock, helpers, equipment and places.
              <br />
              <b>Keeps:</b> Golden Crumbs, recipe book perks, your settings and statistics.
            </p>
            <div className="btns">
              <button
                className="primary"
                onClick={() => {
                  game.act((st) => franchise(st))
                  game.save()
                  setConfirming(false)
                }}
              >
                Sell &amp; franchise
              </button>
              <button className="ghost" onClick={() => setConfirming(false)}>
                Not yet
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function PerkGrid({ perks }: { perks: PerkDef[] }) {
  const game = useGame()
  const s = game.state
  return (
    <ul className="rows perk-grid">
      {perks.map((perk) => {
        const level = perkLevel(s, perk.id)
        const maxed = perkMaxed(s, perk)
        return (
          <li key={perk.id} className="row">
            <span className="emoji">{perk.emoji}</span>
            <div className="row-main">
              <div className="row-title">
                {perk.name}{' '}
                <span className="count">
                  {level}
                  {perk.maxLevel !== undefined ? `/${perk.maxLevel}` : ''}
                </span>
              </div>
              <div className="row-sub">{perk.description}</div>
            </div>
            <button disabled={!canBuyPerk(s, perk)} onClick={() => game.act((st) => buyPerk(st, perk.id))}>
              {maxed ? (perk.manager ? 'Hired' : 'Max') : `${fmt(perkCost(s, perk), 0)} ✨`}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
