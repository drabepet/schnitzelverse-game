// Farm gear on the farm cards: what can be bought now (compact rows), what is
// owned (chips with a pop-up), and the next rung waiting at a further place.
import { REGIONS, type UpgradeDef } from '../engine/content'
import { fmtMoney } from '../engine/format'
import { buyUpgrade } from '../engine/actions'
import { describeEffect } from '../engine/describe'
import { canBuyUpgrade, meets } from '../engine/rules'
import { useGame } from '../game/store'
import { HintButton } from './HintButton'
import { firstReason, needMoney, needRequirement } from './reasons'

function Effects({ u }: { u: UpgradeDef }) {
  const { state } = useGame()
  return (
    <ul className="effect-lines">
      {u.effects.map((e, i) => (
        <li key={i}>{describeEffect(e, state)}</li>
      ))}
    </ul>
  )
}

/** A tag for gear that isn't a plain speed-up. */
function kindTag(u: UpgradeDef): string | null {
  if (u.effects.some((e) => e.kind === 'price')) return '✨ quality'
  if (u.building && u.effects.some((e) => e.kind === 'building' && e.facility !== u.building)) return '🔗 helps another chain'
  return null
}

/**
 * Gear for one building (or one chain's farm hand): buyable rows, owned
 * chips, and a teaser for the next rung.
 */
export function GearList({ gear }: { gear: UpgradeDef[] }) {
  const game = useGame()
  const s = game.state
  const owned = gear.filter((u) => s.upgrades[u.id])
  const open = gear.filter((u) => !s.upgrades[u.id] && meets(s, u.requires))
  const next = gear.find((u) => !s.upgrades[u.id] && !meets(s, u.requires))
  const nextPlace = next?.requires?.place ? REGIONS.find((r) => r.id === next.requires?.place) : undefined

  return (
    <div className="gear">
      {open.map((u) => {
        const tag = kindTag(u)
        return (
          <div key={u.id} className="gear-row tip" tabIndex={0}>
            <span className="gear-emoji">{u.emoji}</span>
            <span className="gear-name">
              {u.name}
              {tag && <span className="gear-tag">{tag}</span>}
            </span>
            <HintButton
              className="small-btn"
              whyNot={canBuyUpgrade(s, u) ? null : firstReason(needRequirement(s, u.requires), needMoney(s, u.cost, game.rates.income))}
              onClick={() => game.act((st) => buyUpgrade(st, u.id))}
            >
              {fmtMoney(u.cost)}
            </HintButton>
            <span className="tip-pop" role="tooltip">
              <b>
                {u.emoji} {u.name}
              </b>
              <span className="muted">{u.description}</span>
              <Effects u={u} />
            </span>
          </div>
        )
      })}
      {(owned.length > 0 || next) && (
        <div className="gear-owned">
          {owned.map((u) => (
            <span key={u.id} className="gear-chip tip" tabIndex={0}>
              {u.emoji}
              <span className="tip-pop" role="tooltip">
                <b>
                  {u.emoji} {u.name} ✓
                </b>
                <span className="muted">{u.description}</span>
                <Effects u={u} />
              </span>
            </span>
          ))}
          {next && nextPlace && (
            <span className="gear-next tip" tabIndex={0}>
              🔒 {nextPlace.emoji}
              <span className="tip-pop" role="tooltip">
                <b>
                  Next: {next.emoji} {next.name}
                </b>
                <span className="muted">
                  Unlocks once you reach {nextPlace.emoji} {nextPlace.name.replace(/^The /, 'the ')} in a run. {next.description}
                </span>
                <Effects u={next} />
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
