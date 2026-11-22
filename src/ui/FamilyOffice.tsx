import { BRANCHES, MANAGER_RANKS, PERKS, SPEND_LEVELS, type PerkDef, type PerkId } from '../engine/content'
import { describeManagerItems as describeItems, familyNextStep, farmNextStep, managerActive, managerRank, savingStatus, setManager, setSpendLevel, spendLevel } from '../engine/automation'
import { setAutoSell } from '../engine/actions'
import { fmt, fmtMoney, fmtTime } from '../engine/format'
import { pendingCrumbs } from '../engine/rules'
import type { AutoSellRule, GameState, ManagerLogEntry } from '../engine/state'
import { useGame } from '../game/store'

const PERK = Object.fromEntries(PERKS.map((p) => [p.id, p])) as Record<PerkId, PerkDef>

/** What this manager is busy with right now, in a few words. */
function doingNow(s: GameState, id: PerkId): string {
  if (!managerActive(s, id)) return 'Switched off.'
  const saving = savingStatus(s)
  if (id === 'estateAgent')
    return saving
      ? `Saving for ${saving.region.emoji} ${saving.region.name.toLowerCase()}: ${fmtMoney(saving.remaining)} to go, about ${fmtTime(saving.eta)}.`
      : 'Opens the next place as soon as you can afford it.'
  if (saving) return `Waiting: Mum is saving for ${saving.region.emoji} ${saving.region.name.toLowerCase()}.`
  if (id === 'familyManager') {
    const step = familyNextStep(s)
    if (!step) return 'The kitchen keeps up with the customers. Nothing to do.'
    if (step.kind === 'wait') return `Saving for ${step.upgrade.emoji} ${step.upgrade.name.toLowerCase()} (${fmtMoney(step.remaining)} to go).`
    if (step.kind === 'equip') return `About to buy ${step.upgrade.emoji} ${step.upgrade.name.toLowerCase()}.`
    return `Hiring ${step.worker.emoji} ${step.worker.name.toLowerCase()} for the slowest step.`
  }
  if (id === 'farmManager') {
    const step = farmNextStep(s)
    if (!step) return 'The farm covers what the kitchen needs. Nothing to do.'
    if (step.kind === 'wait') return `Saving for ${step.upgrade.emoji} ${step.upgrade.name.toLowerCase()} (${fmtMoney(step.remaining)} to go).`
    if (step.kind === 'equip') return `About to buy ${step.upgrade.emoji} ${step.upgrade.name.toLowerCase()}.`
    return `Building ${step.facility.emoji} ${step.facility.name.toLowerCase()} for the shortest ingredient.`
  }
  if (id === 'quartermaster') return managerRank(s, id) >= 2 ? 'Buying the biggest equipment he can afford.' : 'Buying equipment, cheapest first.'
  return 'Keeping a vehicle on every route and the fleet up with the kitchen.'
}

function Recent({ entries }: { entries: ManagerLogEntry[] }) {
  const { state: s } = useGame()
  if (!entries.length) return <p className="muted small office-empty">Nothing bought yet.</p>
  return (
    <ul className="office-log">
      {entries.map((e, i) => (
        <li key={`${e.t}-${i}`}>
          <span className="muted">{fmtTime(Math.max(0, s.stats.playtime - e.t))} ago</span> {describeItems(e.items)}
          {e.cost > 0 && <span className="muted"> · {fmtMoney(e.cost)}</span>}
        </li>
      ))}
    </ul>
  )
}

function SpendDial({ id }: { id: PerkId }) {
  const game = useGame()
  const s = game.state
  const current = spendLevel(s, id)
  const rank = managerRank(s, id)
  return (
    <div className="buy-amount office-dial" role="radiogroup" aria-label="How boldly they spend">
      {SPEND_LEVELS.map((l) => {
        const locked = l.rank > rank
        return (
          <button
            key={l.id}
            role="radio"
            aria-checked={current === l.id}
            className={current === l.id ? 'on' : ''}
            disabled={locked}
            title={locked ? `Opens at rank ${l.rank} (${MANAGER_RANKS[l.rank - 1].toLowerCase()}).` : `${l.name}: ×${l.mult} their usual share of your money.`}
            onClick={() => game.act((st) => setSpendLevel(st, id, l.id))}
          >
            {locked ? '🔒 ' : ''}
            {l.name}
          </button>
        )
      })}
    </div>
  )
}

function AutoSell() {
  const game = useGame()
  const s = game.state
  const a = s.autoSell
  const rank = managerRank(s, 'estateAgent')
  if (rank < 3)
    return (
      <p className="muted small office-sell">
        🏷️ At rank 3 Mum can also sell the business for you, by a rule you set. It stays off until you switch it on.
      </p>
    )
  const rules: { id: AutoSellRule; name: string }[] = [
    { id: 'double', name: 'Doubles my crumbs' },
    { id: 'triple', name: 'Triples my crumbs' },
    { id: 'time', name: 'After a set time' },
  ]
  return (
    <div className="office-sell">
      <label className="setting-check">
        <input type="checkbox" checked={a.enabled} onChange={(e) => game.act((st) => setAutoSell(st, { enabled: e.target.checked }))} />
        <b>🏷️ Mum sells the business for me</b>
      </label>
      <div className="buy-amount" role="radiogroup" aria-label="When Mum sells">
        {rules.map((r) => (
          <button
            key={r.id}
            role="radio"
            aria-checked={a.rule === r.id}
            className={a.rule === r.id ? 'on' : ''}
            onClick={() => game.act((st) => setAutoSell(st, { rule: r.id }))}
          >
            {r.name}
          </button>
        ))}
      </div>
      {a.rule === 'time' && (
        <label className="office-minutes">
          Sell after{' '}
          <input
            type="number"
            min={10}
            max={1440}
            step={10}
            value={a.minutes}
            onChange={(e) => game.act((st) => setAutoSell(st, { minutes: Number(e.target.value) }))}
          />{' '}
          minutes of a run
        </label>
      )}
      <label className="setting-check">
        <input type="checkbox" checked={a.spendCrumbs} onChange={(e) => game.act((st) => setAutoSell(st, { spendCrumbs: e.target.checked }))} />
        Then Auntie spends the crumbs on the cheapest perks (never on a pick-one choice)
      </label>
      <p className="muted small">
        {a.enabled ? `Switched on. Selling now would pay +${fmt(pendingCrumbs(s), 0)} ✨.` : 'Off: you sell when you want to.'}
      </p>
    </div>
  )
}

function ManagerCard({ id }: { id: PerkId }) {
  const game = useGame()
  const s = game.state
  const perk = PERK[id]
  const rank = managerRank(s, id)
  const branch = BRANCHES.find((b) => b.manager === id)!
  if (rank === 0)
    return (
      <section className="office-card not-yet">
        <header>
          <span className="office-emoji">{perk.emoji}</span>
          <b>{perk.name}</b>
        </header>
        <p className="muted small">Not promoted yet. Promote {branch.person.toLowerCase()} at the top of their branch in the family tree.</p>
      </section>
    )
  const on = managerActive(s, id)
  const entries = s.managerLog.filter((e) => e.who === id).slice(-3).reverse()
  const spent = s.run.managerSpent[id] ?? 0
  return (
    <section className={`office-card ${on ? '' : 'off'}`}>
      <header>
        <span className="office-emoji">{perk.emoji}</span>
        <div>
          <b>{perk.name}</b>
          <span className="muted small">
            Rank {rank} · {MANAGER_RANKS[rank - 1]}
          </span>
        </div>
        <button className={`mgr-chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => game.act((st) => setManager(st, id, !on))}>
          {on ? 'Working' : 'Off'}
        </button>
      </header>
      <p className="office-now">{doingNow(s, id)}</p>
      <div className="office-sub">
        <span className="muted small">Spent this run</span>
        <b>{fmtMoney(spent)}</b>
      </div>
      <Recent entries={entries} />
      <div className="office-sub">
        <span className="muted small">How boldly</span>
      </div>
      <SpendDial id={id} />
      {id === 'estateAgent' && <AutoSell />}
    </section>
  )
}

/** Franchise tab, under the family tree: one card per manager. */
export function FamilyOffice() {
  return (
    <section className="family-office">
      <h3 className="book-title">👪 The family at work</h3>
      <p className="hint">
        What each promoted family member is doing now, what they bought lately and how much they spent this run. “How boldly” sets how big
        a share of your money one purchase may take: careful, normal, and (at higher ranks) bold or all in.
      </p>
      <div className="office-grid">
        {BRANCHES.map((b) => (
          <ManagerCard key={b.id} id={b.manager} />
        ))}
      </div>
    </section>
  )
}
