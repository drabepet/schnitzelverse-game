// Farm gear on the farm cards: what can be bought now (compact rows), what is
// owned (chips with a pop-up), and the next rung waiting at a further place.
import { REGION_BY_ID, type UpgradeDef } from '../engine/content'
import { fmtMoneyShort } from '../engine/format'
import { buyUpgrade } from '../engine/actions'
import { meets } from '../engine/rules'
import { useGame } from '../game/store'
import { HintButton } from './HintButton'
import { placeName, upgradeWhyNot, affordShare } from './reasons'
import { UpgradeTip } from './UpgradeTip'

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
  const nextPlace = next?.requires?.place ? REGION_BY_ID[next.requires.place] : undefined

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
              whyNot={upgradeWhyNot(s, u, game.rates.income)}
              progress={affordShare(s.money, u.cost)}
              onClick={() => game.act((st) => buyUpgrade(st, u.id))}
            >
              {fmtMoneyShort(u.cost)}
            </HintButton>
            <UpgradeTip u={u} />
          </div>
        )
      })}
      {(owned.length > 0 || next) && (
        <div className="gear-owned">
          {owned.map((u) => (
            <span key={u.id} className="gear-chip tip" tabIndex={0}>
              {u.emoji}
              <UpgradeTip u={u} title={`${u.emoji} ${u.name} ✓`} />
            </span>
          ))}
          {next && nextPlace && (
            <span className="gear-next tip" tabIndex={0}>
              🔒 {nextPlace.emoji}
              <UpgradeTip
                u={next}
                title={`Next: ${next.emoji} ${next.name}`}
                note={`Unlocks once you reach ${nextPlace.emoji} ${placeName(nextPlace)} in a run. ${next.description}`}
              />
            </span>
          )}
        </div>
      )}
    </div>
  )
}
