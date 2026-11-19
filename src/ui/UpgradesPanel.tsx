import { UPGRADES, type UpgradeDef } from '../engine/content'
import { fmt, fmtMoney } from '../engine/format'
import { buyUpgrade } from '../engine/actions'
import { describeEffect } from '../engine/describe'
import { canBuyUpgrade, meets, upgradeVisible } from '../engine/rules'
import { upgradePillar, type Pillar } from '../engine/tiers'
import { useGame } from '../game/store'
import { guideHint } from './guide'

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
 * `quality` the crispness technique shown in the Quality panel.
 */
export function UpgradesPanel({ pillar, quality = false }: { pillar?: Pillar; quality?: boolean }) {
  const game = useGame()
  const s = game.state
  const mine = UPGRADES.filter((u) => (quality ? u.quality : !u.quality && upgradePillar(u) === pillar))
  const available = mine.filter((u) => !s.upgrades[u.id] && upgradeVisible(s, u))
  const owned = mine.filter((u) => s.upgrades[u.id])
  if (!available.length && !owned.length) return null

  return (
    <section className={quality ? 'technique' : 'panel panel-upgrades'}>
      {quality ? <h3>📖 Technique</h3> : <h2>🧰 Equipment</h2>}
      {available.length === 0 && <p className="hint">Nothing new here right now. Build your reputation.</p>}
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
            <button
              className={u.id === 'shoppingList' && guideHint(s)?.target === 'shoppingList' ? 'pulse' : ''}
              disabled={!canBuyUpgrade(s, u)}
              onClick={() => game.act((st) => buyUpgrade(st, u.id))}
            >
              {fmtMoney(u.cost)}
            </button>
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
