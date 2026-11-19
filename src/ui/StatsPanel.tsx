import { FACILITIES, REGIONS, VEHICLES, WORKERS } from '../engine/content'
import { fmt, fmtInt, fmtMoney, fmtTime } from '../engine/format'
import { useGame } from '../game/store'

/** A share as a percentage, without rounding small non-zero shares down to 0%. */
const pct = (share: number) => (share > 0 && share < 0.001 ? '<0.1%' : `${fmt(share * 100, 1)}%`)

/** Lifetime statistics, Records tab. */
export function StatsPanel() {
  const { state: s } = useGame()
  const coldShare = s.stats.served.gt(0) ? s.stats.servedCold.div(s.stats.served).toNumber() : 0
  const places = REGIONS.filter((r) => s.regions[r.id].unlocked).length
  const helpers = WORKERS.reduce((n, w) => n + s.workers[w.id], 0)
  const buildings = FACILITIES.reduce((n, f) => n + s.facilities[f.id], 0)
  const vehicles = VEHICLES.reduce((n, v) => n + s.vehicles[v.id], 0)

  const groups: { title: string; rows: [string, string][] }[] = [
    {
      title: 'All time',
      rows: [
        ['Schnitzels served', fmtInt(s.stats.served)],
        ['…of which cold', `${fmtInt(s.stats.servedCold)} (${pct(coldShare)})`],
        ['Money earned', fmtMoney(s.stats.earned)],
        ['Time played', fmtTime(s.stats.playtime)],
        ['Your own clicks', fmtInt(s.stats.clicks)],
      ],
    },
    {
      title: 'Franchise',
      rows: [
        ['Franchises', String(s.prestige.franchises)],
        ['Golden Crumbs collected', fmt(s.prestige.totalCrumbs, 0)],
        ['Fastest run to the town', s.stats.bestTownTime > 0 ? fmtTime(s.stats.bestTownTime) : '—'],
      ],
    },
    {
      title: 'This run',
      rows: [
        ['Run time', fmtTime(s.run.time)],
        ['Earned', fmtMoney(s.run.earned)],
        ['Served', fmtInt(s.run.served)],
        ['Places', `${places} of ${REGIONS.length}`],
        ['Helpers · farm buildings · vehicles', `${helpers} · ${buildings} · ${vehicles}`],
      ],
    },
    {
      title: 'Family drama',
      rows: [
        ['Rescued by Mum', `${s.stats.rescues}×`],
        ['Shop sold out on you', `${fmtInt(s.stats.soldOut)}×`],
        ['Logo clicks', String(s.stats.logoClicks)],
      ],
    },
  ]

  return (
    <section className="panel">
      <h2>📊 Statistics</h2>
      <div className="stats-grid">
        {groups.map((g) => (
          <div key={g.title}>
            <h3>{g.title}</h3>
            {g.rows.map(([label, value]) => (
              <div key={label} className="sb-row">
                <span>{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
