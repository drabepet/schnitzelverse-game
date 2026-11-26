import { BRANCHES, MANAGER_RANKS, PERK_BY_ID, type PerkId, SPEND_LEVELS } from '../engine/content'
import { describeManagerItems as describeItems, managerActive, managerOrder, managerRank, moveManager, setManager, setManagerStrict, setSpendLevel, spendLevel } from '../engine/automation'
import { doingNow } from './managerStatus'
import { MoodLegend } from './MoodLegend'
import { setAutoSell } from '../engine/actions'
import { fmt, fmtMoney, fmtTime } from '../engine/format'
import { crumbGrowth, crumbRate, pendingCrumbs } from '../engine/rules'
import { AUTO_SELL_PERCENTS, BEST_SALE_MIN_SHARE, type AutoSellRule, type ManagerLogEntry } from '../engine/state'
import { useGame } from '../game/store'


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
  const rules: { id: AutoSellRule; name: string; title: string }[] = [
    { id: 'best', name: 'At the best moment', title: 'When this run stops growing your crumbs as fast as it did: quick sales early on, longer runs later.' },
    { id: 'share', name: 'When it adds…', title: 'When the sale adds a share of the crumbs you have collected so far.' },
    { id: 'time', name: 'After a set time', title: 'After a run has lasted this long.' },
  ]
  const rate = crumbRate(s)
  const pct = (g: number) => `${fmt(g * 100, g < 0.1 ? 1 : 0)}%`
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
            title={r.title}
            onClick={() => game.act((st) => setAutoSell(st, { rule: r.id }))}
          >
            {r.name}
          </button>
        ))}
      </div>
      {a.rule === 'best' && (
        <p className="muted small office-best">
          {rate > 0
            ? `This run grows your crumbs by ${pct(crumbGrowth(s))} an hour (best so far ${pct(s.run.growthPeak)}). She sells as soon as the sale would triple your crumbs, or once that growth drops a little below the best (if the sale adds at least ${BEST_SALE_MIN_SHARE * 100}%): quick sales while your pile is small, longer runs later.`
            : 'She sells as soon as the sale would triple your crumbs, and from 15 minutes into a run she also watches how fast the run grows them.'}
        </p>
      )}
      {a.rule === 'share' && (
        <div className="buy-amount" role="radiogroup" aria-label="How much the sale must add">
          {AUTO_SELL_PERCENTS.map((p) => (
            <button
              key={p}
              role="radio"
              aria-checked={a.percent === p}
              className={a.percent === p ? 'on' : ''}
              title={`Sell when the sale adds ${p}% of the ${fmt(s.prestige.totalCrumbs, 0)} crumbs collected so far (+${fmt(s.prestige.totalCrumbs.mul(p / 100), 0)}).`}
              onClick={() => game.act((st) => setAutoSell(st, { percent: p }))}
            >
              +{p}%
            </button>
          ))}
        </div>
      )}
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
  const perk = PERK_BY_ID[id]
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
      <div className="office-dial-wrap">
        <span className="muted small">How boldly</span>
        <SpendDial id={id} />
      </div>
      {id === 'estateAgent' ? <AutoSell /> : <div className="office-extra" />}
      <div className="office-recent">
        <span className="muted small">Lately</span>
        <Recent entries={entries} />
      </div>
    </section>
  )
}

/**
 * Who spends first each second (Mum, who opens places, always goes before
 * them). With a strict order the next in line waits while the one before
 * still has something to buy: “farm before fleet”.
 */
function PriorityList() {
  const game = useGame()
  const s = game.state
  const order = managerOrder(s).filter((id) => managerRank(s, id) > 0)
  if (order.length < 2) return null
  return (
    <div className="office-order">
      <span className="muted small">Who goes first</span>
      <ol>
        {order.map((id, i) => (
          <li key={id}>
            <span>
              {PERK_BY_ID[id].emoji} {BRANCHES.find((b) => b.manager === id)?.person ?? PERK_BY_ID[id].name}
            </span>
            <button
              className="small-btn"
              disabled={i === 0}
              aria-label={`Move ${PERK_BY_ID[id].name} up`}
              onClick={() => game.act((st) => moveManager(st, id, -1))}
            >
              ↑
            </button>
          </li>
        ))}
      </ol>
      <label className="setting-check" title="The next in line only buys once the one before has nothing left to buy (saving up counts as busy).">
        <input type="checkbox" checked={s.managerStrict} onChange={(e) => game.act((st) => setManagerStrict(st, e.target.checked))} />
        Strict: each waits until the one before is done
      </label>
    </div>
  )
}

/** Franchise tab, under the family tree: one card per manager. */
export function FamilyOffice() {
  return (
    <section className="family-office" id="family-at-work">
      <h3 className="book-title">👪 The family at work</h3>
      <p className="hint">
        What each promoted family member is doing now, what they bought lately and how much they spent this run. “How boldly” sets how big
        a share of your money one purchase may take: careful, normal, and (at higher ranks) bold or all in.
      </p>
      <p className="hint office-legend">
        The dots on their faces in the sidebar: <MoodLegend />
      </p>
      <PriorityList />
      <div className="office-grid">
        {BRANCHES.map((b) => (
          <ManagerCard key={b.id} id={b.manager} />
        ))}
      </div>
    </section>
  )
}
