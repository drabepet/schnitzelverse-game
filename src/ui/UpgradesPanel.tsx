import { UPGRADES, type UpgradeDef } from '../engine/content'
import { fmt, fmtMoneyShort } from '../engine/format'
import { buyUpgrade } from '../engine/actions'
import { meets, upgradeVisible } from '../engine/rules'
import { upgradePillar, type Pillar } from '../engine/tiers'
import { useGame } from '../game/store'
import { guideHint } from './guide'
import { HintButton } from './HintButton'
import { upgradeWhyNot, affordShare } from './reasons'
import { EffectLines, UpgradeTip } from './UpgradeTip'

/** Each upgrade's pipeline tab, worked out once (it reads every effect). */
const PILLAR_OF = new Map(UPGRADES.map((u) => [u, upgradePillar(u)]))

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
      (quality ? u.quality : !u.quality && PILLAR_OF.get(u) === pillar) &&
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
              whyNot={upgradeWhyNot(s, u, game.rates.income)}
              progress={meets(s, u.requires) ? affordShare(s.money, u.cost) : undefined}
              onClick={() => game.act((st) => buyUpgrade(st, u.id))}
            >
              {fmtMoneyShort(u.cost)}
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
                <UpgradeTip u={u} />
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
