// The route map: one coloured line per carrier (helpers, vans, trucks…),
// running down beside the places from the garage to the farthest place it
// reaches, where its icon sits. Solid where it delivers, faint where it could
// go but has nothing left to bring.
import type { CSSProperties } from 'react'
import type { RegionDef } from '../engine/content'
import { fmt } from '../engine/format'
import { carrierLoad, routeRate, type Lane, type RouteRates } from '../engine/routes'

const LANE_COLORS = ['#4f8a3c', '#c8841c', '#d9541e', '#4f8fc0', '#8a5cc0', '#c04f8f', '#2f9e9e', '#8a7a3a']
const laneColor = (l: Lane) => LANE_COLORS[l.index % LANE_COLORS.length]

/** The lanes beside one place (row j). Empty lanes keep the columns aligned. */
export function RouteCell({ lanes, row, region, rates }: { lanes: Lane[]; row: number; region: RegionDef | null; rates: RouteRates }) {
  if (lanes.length === 0) return null
  return (
    <div className="route-map" aria-hidden="true">
      {lanes.map((l) => {
        const style = { '--lane': laneColor(l) } as CSSProperties
        if (!region || l.first < 0 || row < l.first || row > l.last) return <span key={l.carrier.id} className="lane" style={style} />
        const rate = routeRate(rates, l.carrier.id, region.id)
        const here = rate > 0.005
        const end = row === l.last
        const title = `${l.carrier.emoji} ${l.carrier.name}: ${
          here ? `delivering ${fmt(rate)}/s here` : 'could come here, but has nothing left to bring'
        }${end ? '. The farthest place they reach, so they come here first.' : '.'}`
        return (
          <span key={l.carrier.id} className="lane" style={style} title={title}>
            {row > l.first && <span className={`lane-line top ${row <= l.servedTo ? 'on' : ''}`} />}
            {row < l.last && <span className={`lane-line bottom ${row < l.servedTo ? 'on' : ''}`} />}
            {end ? (
              <span className={`lane-icon ${here ? 'on' : ''}`}>{l.carrier.emoji}</span>
            ) : (
              here && <span className="lane-dot" />
            )}
          </span>
        )
      })}
    </div>
  )
}

/** Key to the map: each carrier's colour, icon and how busy it is. */
export function RouteLegend({ lanes, rates }: { lanes: Lane[]; rates: RouteRates }) {
  if (lanes.length === 0) return null
  return (
    <div className="route-legend small">
      <span
        className="muted"
        title="Each line is one kind of carrier, drawn from your garage down to the farthest place it reaches (its icon). Everyone goes to their farthest place first, then brings what is left to nearer ones. Solid line and dot: delivering there. Faint line: could go there, but nothing left to bring."
      >
        🗺️ Routes ⓘ
      </span>
      {lanes.map((l) => {
        const load = Math.min(1, carrierLoad(l.carrier, rates))
        return (
          <span key={l.carrier.id} className="route-key" style={{ '--lane': laneColor(l) } as CSSProperties} title={`${l.carrier.name}: can carry ${fmt(l.carrier.capacity)}/s, using ${Math.round(load * 100)}%`}>
            <span className="swatch" />
            {l.carrier.emoji} <span className={`route-pct ${load >= 0.95 ? 'warn' : 'muted'}`}>{Math.round(load * 100)}%</span>
          </span>
        )
      })}
    </div>
  )
}
