// Gear on a card (farm buildings, kitchen stations): what can be bought now
// (compact rows), what is owned (chips with a pop-up), and the next piece
// waiting (at a further place, or for more reputation or franchises).
import { REGION_BY_ID, type UpgradeDef } from '../engine/content'
import { fmtCompact, fmtMoneyShort } from '../engine/format'
import { buyUpgrade } from '../engine/actions'
import { chapterOpenFor, meets, upgradeVisible } from '../engine/rules'
import type { GameState } from '../engine/state'
import { useGame } from '../game/store'
import { HintButton } from './HintButton'
import { placeName, upgradeWhyNot, affordShare } from './reasons'
import { UpgradeTip } from './UpgradeTip'

/** A tag for gear that isn't a plain speed-up. */
function kindTag(u: UpgradeDef): string | null {
  if (u.effects.some((e) => e.kind === 'price')) return '✨ quality'
  if (u.building && u.effects.some((e) => e.kind === 'building' && e.facility !== u.building)) return '🔗 helps another chain'
  const link = u.station && u.effects.find((e) => e.kind === 'speed' && e.task !== u.station)
  if (link && link.kind === 'speed') return `🔗 helps ${link.task === 'pound' ? 'pounding' : link.task === 'bread' ? 'breading' : 'frying'}`
  return null
}

/** What the next locked piece waits for: a short chip label and a sentence. */
function lockOf(s: GameState, u: UpgradeDef): { chip: string; note: string } {
  const r = u.requires
  if (r?.place && !s.regions[r.place].unlocked) {
    const place = REGION_BY_ID[r.place]
    return { chip: `🔒 ${place.emoji}`, note: `Unlocks once you reach ${place.emoji} ${placeName(place)} in a run.` }
  }
  if (r?.franchises !== undefined && s.prestige.franchises < r.franchises) {
    return { chip: `🔒 ✨${r.franchises}`, note: `Unlocks after ${r.franchises} franchises.` }
  }
  return { chip: `🔒 ⭐${fmtCompact(r?.reputation ?? 0)}`, note: `Shows up near ⭐ ${fmtCompact(r?.reputation ?? 0)} reputation.` }
}

/**
 * Gear for one building, farm hand or kitchen station: buyable rows, owned
 * chips, and a teaser for the next piece. `gear` is in the order to buy it.
 */
export function GearList({ gear }: { gear: UpgradeDef[] }) {
  const game = useGame()
  const s = game.state
  const owned = gear.filter((u) => s.upgrades[u.id])
  const open = gear.filter((u) => !s.upgrades[u.id] && upgradeVisible(s, u))
  // Never a teaser from a chapter you haven't opened: that's for the story to reveal.
  const next = gear.find((u) => !s.upgrades[u.id] && !upgradeVisible(s, u) && chapterOpenFor(s, u))
  const lock = next && lockOf(s, next)

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
              progress={meets(s, u.requires) ? affordShare(s.money, u.cost) : undefined}
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
          {next && lock && (
            <span className="gear-next tip" tabIndex={0}>
              {lock.chip}
              <UpgradeTip u={next} title={`Next: ${next.emoji} ${next.name}`} note={`${lock.note} ${next.description}`} />
            </span>
          )}
        </div>
      )}
    </div>
  )
}
