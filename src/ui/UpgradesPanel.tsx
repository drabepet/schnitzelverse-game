import { UPGRADES, type UpgradeDef } from '../engine/content'
import { fmt, fmtMoney } from '../engine/format'
import { buyUpgrade } from '../engine/actions'
import { describeEffect } from '../engine/describe'
import { canBuyUpgrade, meets, upgradeVisible } from '../engine/rules'
import { upgradePillar, type Pillar } from '../engine/tiers'
import { useGame } from '../game/store'
import { guideHint } from './guide'
import { HintButton } from './HintButton'
import { firstReason, needMoney, needRequirement } from './reasons'

/** Exactly what an upgrade changes, one line per effect. */
function EffectLines({ u }: { u: UpgradeDef }) {
  const { state } = useGame()
  return (
    <ul className="effect-lines">
      {u.effects.map((e, i) => (
        <li key={i}>{describeEffect(e, state)}</li>
      ))}
    </ul>
  )
}

/**
 * Equipment for one pipeline tab (prep, making or distribution), or with
 * `quality` the crispness technique shown in the Quality panel. `only`
 * narrows it further; `embedded` draws it inside another panel. Farm gear
 * lives on the farm cards (FarmGear.tsx), never here.
 */
export function UpgradesPanel({
  pillar,
  quality = false,
  only,
  title = '🧰 Equipment',
  embedded = false,
}: {
  pillar?: Pillar
  quality?: boolean
  only?: (u: UpgradeDef) => boolean
  title?: string
  embedded?: boolean
}) {
  const game = useGame()
  const s = game.state
  const mine = UPGRADES.filter(
    (u) =>
      !u.building &&
      !u.chain &&
      (quality ? u.quality : !u.quality && upgradePillar(u) === pillar) &&
      (!only || only(u)),
  )
  // Cheapest first: simple and predictable (the best deals are usually near the top).
  const available = mine.filter((u) => !s.upgrades[u.id] && upgradeVisible(s, u)).sort((a, b) => a.cost - b.cost)
  const owned = mine.filter((u) => s.upgrades[u.id])
  if (!available.length && !owned.length) return null

  return (
    <section className={quality ? 'technique' : embedded ? 'embedded-upgrades' : 'panel panel-upgrades'}>
      {quality ? <h3>📖 Technique</h3> : embedded ? <h3>{title}</h3> : <h2>{title}</h2>}
      {available.length === 0 && (
        <p className="hint">{owned.length === mine.length ? 'All bought for this run.' : 'Nothing new here right now. Build your reputation.'}</p>
      )}
      <ul className="rows">
        {available.map((u) => (
          <li key={u.id} className="row">
            <span className="emoji">{u.emoji}</span>
            <div className="row-main">
              <div className="row-title">{u.name}</div>
              <div className="row-sub">{u.description}</div>
              <EffectLines u={u} />
              {!meets(s, u.requires) && <div className="row-sub">Needs ⭐ {fmt(u.requires?.reputation ?? 0)}</div>}
            </div>
            <HintButton
              className={u.id === 'shoppingList' && guideHint(s)?.target === 'shoppingList' ? 'pulse' : ''}
              whyNot={
                canBuyUpgrade(s, u) ? null : firstReason(needRequirement(s, u.requires), needMoney(s, u.cost, game.rates.income))
              }
              onClick={() => game.act((st) => buyUpgrade(st, u.id))}
            >
              {fmtMoney(u.cost)}
            </HintButton>
          </li>
        ))}
      </ul>
      {owned.length > 0 && (
        <>
          <div className="owned-title muted small">Owned · hover or tap for details</div>
          <div className="owned">
            {owned.map((u) => (
              <span key={u.id} className="chip tip" tabIndex={0}>
                {u.emoji} {u.name}
                <span className="tip-pop" role="tooltip">
                  <b>
                    {u.emoji} {u.name}
                  </b>
                  <span className="muted">{u.description}</span>
                  <EffectLines u={u} />
                </span>
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
