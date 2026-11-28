import { Fragment } from 'react'
import {
  type BranchDef,
  BRANCHES,
  CHAPTERS,
  MANAGER_RANK_TEXT,
  MANAGER_RANKS,
  PERK_BY_ID,
  PERK_SOFT_GROWTH,
  PERK_SOFT_LEVEL,
  type PerkDef,
  type PerkId,
  TREE_ROWS,
} from '../engine/content'
import { buyPerk, swapFork } from '../engine/actions'
import { managerActive, setManager } from '../engine/automation'
import { fmt, fmtShort } from '../engine/format'
import { canBuyPerk, canSwapFork, chapterNumber, forkPartner, forkTaken, perkCost, perkLevel, perkMaxLevel, perkMaxed, perkMissing, perkVisible, perkOpensWith, endgameLocked } from '../engine/rules'
import type { GameState } from '../engine/state'
import { useGame } from '../game/store'
import { HintButton } from './HintButton'
import { affordShare } from './reasons'

const BRANCH_OF = Object.fromEntries(
  BRANCHES.flatMap((b) => [b.manager, ...b.rows.flat()].map((id) => [id, b])),
) as Record<PerkId, BranchDef>

/** Why a perk is still hidden: which chapter (or feature) opens it. */
function opensWith(perk: PerkDef): string {
  const when = perkOpensWith(perk)
  if (when === 'crisp') return 'crispness (reach the next town over)'
  if (when === null) return 'later'
  return `Chapter ${when} · ${CHAPTERS[when - 1].name}`
}

/** Short name for a perk in requirement lines. */
const short = (perk: PerkDef) => perk.name.replace(/^The /, '')

type NodeState = 'owned' | 'maxed' | 'buyable' | 'open' | 'locked' | 'hidden' | 'other-side'

function nodeState(s: GameState, perk: PerkDef): NodeState {
  if (!perkVisible(s, perk)) return 'hidden'
  if (forkTaken(s, perk)) return 'other-side'
  if (perkMissing(s, perk).length) return 'locked'
  if (perkMaxed(s, perk)) return 'maxed'
  if (canBuyPerk(s, perk)) return 'buyable'
  return perkLevel(s, perk.id) > 0 ? 'owned' : 'open'
}

/** "3/5", "12 of 40 this chapter", or "Hired". */
function levelText(s: GameState, perk: PerkDef): string {
  const level = perkLevel(s, perk.id)
  if (perk.manager) return level > 0 ? `Rank ${level}/${MANAGER_RANKS.length}` : ''
  if (perk.chapterCaps) return level > 0 ? `Level ${level}` : ''
  return `${level}/${perk.maxLevel ?? '∞'}`
}

function PerkNode({ perk }: { perk: PerkDef }) {
  const game = useGame()
  const s = game.state
  const state = nodeState(s, perk)
  const level = perkLevel(s, perk.id)
  const missing = perkMissing(s, perk)
  const other = forkPartner(perk)
  const branch = BRANCH_OF[perk.id]
  const cap = perk.chapterCaps ? perkMaxLevel(s, perk) : null
  // Chapter 6 decides some choices for good (Gossip queen over Darling of the press).
  const locked = endgameLocked(s, perk)

  let whyNot: string | null = null
  const levelLabel = levelText(s, perk)
  if (state === 'hidden') whyNot = `Opens with ${opensWith(perk)}.`
  else if (state === 'other-side')
    whyNot = locked === 'retired' ? `Retired for the end: ${other?.name.toLowerCase()} it is, for good.` : `You picked ${other?.name.toLowerCase()} for this choice.`
  else if (state === 'locked')
    whyNot = `First: ${missing.map((m) => `${short(m.perk)} level ${m.level}${BRANCH_OF[m.perk.id] !== branch ? ` (${BRANCH_OF[m.perk.id].person}’s branch)` : ''}`).join(', ')}.`
  else if (state === 'maxed')
    whyNot = perk.manager
      ? 'Already at the top rank. Switch them on or off here.'
      : cap !== null
        ? `Level ${cap} is the top for Chapter ${chapterNumber(s)}. The next chapter opens more pages.`
        : 'Maxed out: this perk can’t go higher.'
  else if (state !== 'buyable')
    whyNot = `Costs ${fmt(perkCost(s, perk), 0)} ✨: ${fmt(perkCost(s, perk).sub(s.prestige.crumbs), 0)} more Golden Crumbs to go. Sell a franchise to earn them.`

  return (
    <div className={`tree-node ${state}${perk.manager ? ' manager' : ''}${perk.capstone ? ' capstone' : ''}`}>
      <div className="tree-node-head">
        <span className="tree-node-emoji" aria-hidden>
          {state === 'hidden' ? '🔒' : perk.emoji}
        </span>
        <span className="tree-node-name">{perk.name}</span>
        {levelLabel && <span className="tree-node-level">{levelLabel}</span>}
      </div>
      <p className="tree-node-text">{state === 'hidden' ? `Opens with ${opensWith(perk)}.` : perk.description}</p>
      {perk.manager && level > 0 && level < MANAGER_RANKS.length && state !== 'hidden' && (
        <p className="tree-node-next">
          <b>Rank {level + 1}, {MANAGER_RANKS[level].toLowerCase()}:</b> {MANAGER_RANK_TEXT[perk.id]?.[level - 1]}
        </p>
      )}
      {locked === 'picked' && state !== 'hidden' && <p className="tree-node-needs">🔒 {perk.endgamePick}</p>}
      {locked === 'retired' && state !== 'hidden' && (
        <p className="tree-node-needs">📰 Retired for the end. Mum doesn’t do interviews any more: “We’re past famous, darling. We’re lunch.”</p>
      )}
      {perk.chapterCaps && level >= PERK_SOFT_LEVEL && (
        <p className="tree-node-text">Past level {PERK_SOFT_LEVEL} each level costs {PERK_SOFT_GROWTH}× more again.</p>
      )}
      {state === 'locked' && (
        <p className="tree-node-needs">
          🔗 Needs{' '}
          {missing.map((m, i) => (
            <span key={m.perk.id}>
              {i > 0 && ', '}
              {m.perk.emoji} {short(m.perk)} {m.level}
            </span>
          ))}
        </p>
      )}
      <div className="tree-node-actions">
        {perk.manager && level > 0 && (
          <button
            className={`mgr-chip ${managerActive(s, perk.id) ? 'on' : ''}`}
            aria-pressed={managerActive(s, perk.id)}
            onClick={() => game.act((st) => setManager(st, perk.id, !managerActive(st, perk.id)))}
          >
            {managerActive(s, perk.id) ? 'Working' : 'Off'}
          </button>
        )}
        {perk.manager && level > 0 && state === 'maxed' ? (
          <span className="tree-node-done">Runs the show</span>
        ) : state === 'other-side' ? (
          locked ? (
            <span className="muted small">🍋 Decided for good in Chapter 6</span>
          ) : canSwapFork(s, perk) ? (
            <HintButton
              className="small-btn"
              explain={`Switch your ${other?.name.toLowerCase()} levels over to this side. Free, but only once per choice per run.`}
              whyNot={null}
              onClick={() => game.act((st) => swapFork(st, perk.id))}
            >
              Switch to this
            </HintButton>
          ) : (
            <span className="muted small">Switched this run already: next run.</span>
          )
        ) : state === 'maxed' ? (
          <span className="tree-node-done">{perk.manager ? 'Hired' : cap !== null ? `Top for now (${cap})` : 'Max'}</span>
        ) : state === 'hidden' ? null : (
          <HintButton
            className="small-btn"
            whyNot={whyNot}
            progress={state === 'open' || state === 'owned' ? affordShare(s.prestige.crumbs, perkCost(s, perk)) : undefined}
            onClick={() => game.act((st) => buyPerk(st, perk.id))}
          >
            {perk.manager ? (level > 0 ? `Promote to rank ${level + 1}` : 'Promote') : level > 0 ? 'Level up' : 'Buy'} · {fmtShort(perkCost(s, perk), 0)} ✨
          </HintButton>
        )}
      </div>
    </div>
  )
}

function BranchHead({ branch }: { branch: BranchDef }) {
  const { state: s } = useGame()
  const ids = [branch.manager, ...branch.rows.flat()]
  const owned = ids.filter((id) => perkLevel(s, id) > 0).length
  const buyable = ids.filter((id) => canBuyPerk(s, PERK_BY_ID[id])).length
  return (
    <header className="tree-branch-head">
      <span className="tree-branch-emoji" aria-hidden>
        {branch.emoji}
      </span>
      <div>
        <b>{branch.person}</b>
        <span className="muted small">{branch.title}</span>
      </div>
      <span className="tree-branch-count" title={`${owned} of ${ids.length} owned`}>
        {owned}/{ids.length}
        {buyable > 0 && <span className="pill">{buyable}</span>}
      </span>
    </header>
  )
}

function RowLabel({ n, text }: { n: number; text: string }) {
  return (
    <div className="tree-row-label">
      <span className="tree-row-num">{n}</span>
      {text}
    </div>
  )
}

/**
 * The recipe book and the managers as one map: a column per family member,
 * a row per step, the same in every column. Each family member's promotion
 * (manager) on top, then perks that open one another, a pick-one choice and
 * a capstone at the bottom.
 */
export function FamilyTree() {
  return (
    <div className="family-tree-scroll">
      <div className="family-tree" style={{ gridTemplateColumns: `auto repeat(${BRANCHES.length}, minmax(11rem, 1fr))` }}>
        <div className="tree-corner" />
        {BRANCHES.map((b) => (
          <BranchHead key={b.id} branch={b} />
        ))}

        <RowLabel n={1} text="Promotion" />
        {BRANCHES.map((b) => (
          <div key={b.id} className="tree-cell">
            <PerkNode perk={PERK_BY_ID[b.manager]} />
          </div>
        ))}

        {TREE_ROWS.map((label, i) => (
          <Fragment key={label}>
            <RowLabel n={i + 2} text={label} />
            {BRANCHES.map((b) => {
              const row = b.rows[i] ?? []
              const fork = row.length > 1 && !!PERK_BY_ID[row[0]].fork
              return (
                <div key={b.id} className={`tree-cell linked${fork ? ' fork' : ''}`}>
                  {row.map((id) => (
                    <PerkNode key={id} perk={PERK_BY_ID[id]} />
                  ))}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
