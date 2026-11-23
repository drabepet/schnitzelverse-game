import { PERK_BY_ID, type PerkDef, type PerkId, PERKS, REGION_BY_ID, START_REGIONS } from '../engine/content'
import { headStartMoney } from '../engine/actions'
import { fmt, fmtMoney } from '../engine/format'
import { offlineCap, perkLevel } from '../engine/rules'
import type { GameState } from '../engine/state'
import { useGame } from '../game/store'

/** One total, and the perks that make it up. */
interface Line {
  label: string
  value: string
  from: PerkDef[]
}

/** Everything the perks multiply (or add), with where it comes from. */
function totals(s: GameState) {
  const mult = new Map<string, { value: number; from: PerkDef[] }>()
  const add = (key: string, value: number, perk: PerkDef, combine: (a: number, b: number) => number, start: number) => {
    const cur = mult.get(key) ?? { value: start, from: [] }
    cur.value = combine(cur.value, value)
    if (!cur.from.includes(perk)) cur.from.push(perk)
    mult.set(key, cur)
  }
  const times = (a: number, b: number) => a * b
  for (const perk of PERKS) {
    const level = perkLevel(s, perk.id)
    if (level <= 0 || !perk.effects) continue
    for (const e of perk.effects(level)) {
      if (e.kind === 'crisp') add('crisp', e.add, perk, (a, b) => a + b, 0)
      else if (e.kind === 'speed') add(`speed.${e.task}`, e.mult, perk, times, 1)
      else if (e.kind === 'facility') add(`facility.${e.group}`, e.mult, perk, times, 1)
      else if (e.kind === 'building') add(`building`, e.mult, perk, times, 1)
      else if (e.kind !== 'autoBuy') add(e.kind, e.mult, perk, times, 1)
    }
  }
  return mult
}

const x = (v: number) => `×${fmt(v)}`

/**
 * Franchise tab, under the family tree: what all your perks add up to,
 * grouped by part of the business. Closed until you open it.
 */
export function PerkBonuses() {
  const { state: s } = useGame()
  const t = totals(s)
  const line = (key: string, label: string, show: (v: number) => string = x): Line | null => {
    const entry = t.get(key)
    return entry ? { label, value: show(entry.value), from: entry.from } : null
  }
  const lvl = (id: PerkId) => perkLevel(s, id)
  const perk = (id: PerkId) => PERK_BY_ID[id]
  const start = (id: PerkId, label: string, value: string): Line | null => (lvl(id) > 0 ? { label, value, from: [perk(id)] } : null)

  const groups: { title: string; lines: (Line | null)[] }[] = [
    {
      title: '💰 Selling',
      lines: [line('price', 'Prices'), line('orders', 'Orders'), line('reputation', 'Reputation')],
    },
    {
      title: '🍳 The kitchen',
      lines: [
        line('kitchen', 'Pound, bread and fry'),
        line('click', 'Your own clicks'),
        line('crisp', 'Crispness skill', (v) => `+${fmt(v)}`),
      ],
    },
    {
      title: '🚜 The farm',
      lines: [line('facility.field', 'Fields'), line('facility.animal', 'Pigs and hens'), line('facility.processor', 'Mills, bakeries, presses, butchers')],
    },
    {
      title: '🚚 Deliveries',
      lines: [
        line('fleet', 'Fleet capacity'),
        line('speed.deliver', 'Helpers deliver'),
        line('cooling', 'Cooling on the way', (v) => `${Math.round((1 - v) * 100)}% slower`),
      ],
    },
    {
      title: '🛒 The corner shop',
      lines: [line('shopSupply', 'Shop supply'), line('packSize', 'Pack size')],
    },
    {
      title: '🎁 Every run starts with',
      lines: [
        start('headStart', 'Money', fmtMoney(headStartMoney(lvl('headStart')))),
        start('loyalFamily', 'Helpers', `+${lvl('loyalFamily')} of each`),
        start('auntieRemembers', 'Auntie’s shopping list', 'on the fridge'),
        start('oldConnections', 'Places', START_REGIONS.slice(0, lvl('oldConnections')).map((id) => REGION_BY_ID[id].emoji).join(' ')),
        start('farmDeeds', 'Farm buildings', `+${lvl('farmDeeds')} of each`),
        start('oldFriends', 'Family farm hands', 'all four'),
        start('fleetContracts', 'Vehicles', `+${lvl('fleetContracts')} of each`),
        start('launchContracts', 'Space vehicles', `+${lvl('launchContracts')} of each`),
        start('warpContracts', 'Warp freighters', `+${lvl('warpContracts')}`),
      ],
    },
    {
      title: '🌙 While you’re away',
      lines: [{ label: 'The family covers for you', value: `up to ${Math.round(offlineCap(s) / 3600)} hours`, from: lvl('nightShift') ? [perk('nightShift')] : [] }],
    },
  ]
  const shown = groups.map((g) => ({ ...g, lines: g.lines.filter((l): l is Line => l !== null) })).filter((g) => g.lines.length)

  return (
    <details className="perk-bonuses">
      <summary>📊 See all your bonuses from the family tree</summary>
      <p className="hint">What every perk you own adds up to, by part of the business. Hover a line to see which perks make it up.</p>
      <div className="perk-bonus-groups">
        {shown.map((g) => (
          <section key={g.title} className="perk-bonus-group">
            <h4>{g.title}</h4>
            {g.lines.map((l) => (
              <div key={l.label} className="sb-row" title={l.from.length ? `From: ${l.from.map((p) => p.name).join(', ')}` : undefined}>
                <span>
                  {l.label}
                  {l.from.length > 0 && <span className="perk-bonus-from"> {l.from.map((p) => p.emoji).join('')}</span>}
                </span>
                <b>{l.value}</b>
              </div>
            ))}
          </section>
        ))}
      </div>
    </details>
  )
}
