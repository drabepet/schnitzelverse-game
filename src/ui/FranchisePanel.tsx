import { useState } from 'react'
import { CRUMB_DIVISOR, FRONTIER_CRUMB_SHARE, PERKS, REGIONS, CRUMB_PRIDE_PER_DECADE } from '../engine/content'
import { fmt, fmtCompact, fmtMoney, fmtTime } from '../engine/format'
import { D } from '../engine/decimal'
import { franchise } from '../engine/actions'
import { atFrontier, canBuyPerk, crumbRate, crumbProgress, earningsCrumbs, franchiseBlocker, frontierCrumbs, furthestPlace, nextCrumbAt, pendingCrumbs, familyPride } from '../engine/rules'
import { useGame } from '../game/store'
import { useSteady } from './useSteady'
import { moment } from './juice'
import { FamilyTree } from './FamilyTree'
import { PerkBonuses } from './PerkBonuses'
import { FamilyOffice } from './FamilyOffice'
import { HintButton } from './HintButton'
import { mumSellStatus } from './managerStatus'

export function FranchisePanel() {
  const game = useGame()
  const s = game.state
  const p = s.prestige
  const [confirming, setConfirming] = useState(false)
  // Held for a few seconds, so they don't blink when income or the frontier wobbles.
  const showEta = useSteady(game.rates.income > 0, 5000)
  const frontierSale = useSteady(frontierCrumbs(s).gt(earningsCrumbs(s)), 5000)
  if (!p.unlocked && p.franchises === 0) return null

  const pending = pendingCrumbs(s)
  const rate = crumbRate(s)
  const earned = earningsCrumbs(s)
  const best = REGIONS[s.stats.bestPlace]
  const here = REGIONS[furthestPlace(s)]
  const affordable = PERKS.filter((perk) => canBuyPerk(s, perk)).length
  const next = crumbProgress(s)
  const pct = Math.floor(next.fraction * 100)
  const income = game.rates.income
  const eta = income > 0 ? next.remaining.div(income).toNumber() : Infinity
  const share = p.totalCrumbs.gt(0) ? pending.div(p.totalCrumbs).toNumber() * 100 : 0
  const saleShare = `${share >= 10 ? fmtCompact(Math.round(share)) : share.toFixed(1)}%`
  const prideAfter = 1 + CRUMB_PRIDE_PER_DECADE * p.totalCrumbs.add(pending).add(1).log10().toNumber()
  const mum = mumSellStatus(s)

  return (
    <section className="panel panel-franchise">
      <h2>✨ Franchise</h2>
      <div className="crumb-tiles">
        <div className="crumb-tile">
          <span className="crumb-tile-label">✨ To spend</span>
          <b>{fmtCompact(D(p.crumbs).floor())}</b>
          <span className="muted small">Golden Crumbs in your pocket</span>
        </div>
        <div className="crumb-tile">
          <span className="crumb-tile-label">🏆 Collected in total</span>
          <b>{fmtCompact(D(p.totalCrumbs).floor())}</b>
          <span
            className="muted small"
            title={`Family pride: every Golden Crumb ever collected adds a little income (+${CRUMB_PRIDE_PER_DECADE * 100}% per tenfold).${p.bonusCrumbs.gt(0) ? ` ${fmtCompact(D(p.bonusCrumbs).floor())} of them came from frontier sales.` : ''}`}
          >
            family pride: income ×{familyPride(s).toFixed(2)}
          </span>
        </div>
        <div className="crumb-tile">
          <span className="crumb-tile-label">⏱️ This run</span>
          <b>+{fmtCompact(pending.floor())}</b>
          <span className="muted small">
            {rate > 0
              ? `${fmtCompact(rate)}/hour · best ${fmtCompact(s.run.crumbRatePeak)}/hour`
              : 'if you sell now · per hour from 15 min in'}
          </span>
        </div>
        <div className="crumb-tile">
          <span className="crumb-tile-label">🔁 Franchises</span>
          <b>{p.franchises}</b>
          <span className="muted small">
            {s.stats.bestSale.gt(0) ? `biggest sale +${fmtCompact(D(s.stats.bestSale).floor())}` : p.franchises ? 'biggest sale counts from your next' : 'none sold yet'}
          </span>
        </div>
      </div>

      <div className="franchise-box">
        <div>
          Selling now gives <b>+{fmt(pending, 0)} ✨</b>
          {frontierSale && <span className="muted"> (frontier sale)</span>}
          {p.totalCrumbs.gt(0) && (
            <span className="muted">
              {' '}
              · <span className="num">+{saleShare}</span> of all you’ve collected, family pride ×{familyPride(s).toFixed(2)} → ×{prideAfter.toFixed(2)}
            </span>
          )}
          <div className="row-sub">
            Lifetime earnings <span className="num">{fmtMoney(s.stats.earned)}</span>; next crumb at{' '}
            <span className="num">{fmtMoney(nextCrumbAt(s))}</span>. This run: <span className="num">{fmtMoney(s.run.earned)}</span> in{' '}
            <span className="num time">{fmtTime(s.run.time)}</span>.
          </div>
          {mum && <div className="row-sub franchise-mum">🏷️ {mum}</div>}
        </div>
        <HintButton
          className="primary"
          title="Sell & franchise"
          explain="Sell this business: you start over in an empty garage and keep Golden Crumbs, perks, badges and statistics."
          whyNot={franchiseBlocker(s)}
          onClick={() => setConfirming(true)}
        >
          Sell &amp; franchise
        </HintButton>
      </div>

      <div className="sell-ways">
        <div className={`sell-way ${earned.gte(1) ? 'ready' : ''}`}>
          <b>💰 From earnings:</b> +{fmt(earned, 0)} ✨ now. Each Golden Crumb needs more lifetime earnings than the last
          (crumbs = √(earnings ÷ {fmt(CRUMB_DIVISOR, 0)})).
        </div>
        <div className={`sell-way ${atFrontier(s) ? 'ready' : ''}`}>
          <b>🗺️ At your frontier:</b>{' '}
          {atFrontier(s) ? (
            <>
              you’ve reached your furthest place ever, so you can sell for at least +{fmt(frontierCrumbs(s), 0)} ✨ (
              {FRONTIER_CRUMB_SHARE * 100}% of your lifetime crumbs) even when earnings don’t give one yet.
            </>
          ) : (
            <>
              reach {best.emoji} {best.name.toLowerCase()} again (you’re at {here.emoji} {here.name.toLowerCase()}) to
              sell for at least {FRONTIER_CRUMB_SHARE * 100}% of your lifetime crumbs. Handy after a big overnight run.
            </>
          )}
        </div>
      </div>

      <div className="next-crumb">
        <div className="next-crumb-label">
          <span>
            Next Golden Crumb from earnings: <b>+{fmt(earned.add(1), 0)} ✨</b> if you sell
          </span>
          <span className="muted next-crumb-eta">
            {fmtMoney(next.remaining)} to go
            {showEta ? ` · about ${Number.isFinite(eta) ? fmtTime(eta) : '…'}` : ''}
          </span>
        </div>
        <div className="bar next-crumb-bar" title={`${pct}% of the way to the next Golden Crumb`}>
          <div className="bar-fill" style={{ width: `${pct}%` }} />
          <span className="bar-label">{pct}%</span>
        </div>
      </div>

      <h3 className="book-title">
        🌳 The family tree {affordable > 0 && <span className="pill">{affordable} affordable</span>}
      </h3>
      <p className="hint">
        Spend Golden Crumbs here: everything stays through every franchise. Each family member has a branch. At the top, promote them to
        manager: they do the buying for you, also while you’re away (each spends at most a tenth of your money, equipment a quarter).
        Below, perks open one another as you level them. Near the bottom of each branch you pick one of two ways (you can switch once per
        run), and the capstone at the very bottom is the big one. Endless perks top out per chapter, far beyond normal play.
      </p>
      <FamilyTree />
      <FamilyOffice />
      <PerkBonuses />

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
                  const gain = pending
                  if (game.act((st) => franchise(st))) {
                    moment('✨', 'Sold!', `+${fmtCompact(gain.floor())} Golden Crumbs. Run ${game.state.prestige.franchises + 1} starts in an empty garage.`)
                  }
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
