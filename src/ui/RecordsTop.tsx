import { useState, type ReactNode } from 'react'
import { REGIONS } from '../engine/content'
import { BADGE_BY_ID, BADGES } from '../engine/badges'
import { fmtCompact, fmtTime } from '../engine/format'
import { badgeBonus, furthestPlace, pendingCrumbs } from '../engine/rules'
import type { RunRecord } from '../engine/state'
import { useGame } from '../game/store'
import { IncomeChart } from './IncomeChart'
import { compare, DISTANCES, HEIGHTS, MASSES, NOTE_THICKNESS, NOTE_VALUE, PORK_PER_SCHNITZEL, SCHNITZEL_LENGTH } from './compare'

const placeIndex = (id: string) => REGIONS.findIndex((r) => r.id === id)
const TOWN = placeIndex('town')
const COUNTRY = placeIndex('country')
const PLANET = placeIndex('planet')

/** Which stretch of the map a place is in, for colouring the run history. */
function zone(place: number): { id: number; name: string } {
  if (place <= TOWN) return { id: 0, name: 'Up to the town' }
  if (place <= COUNTRY) return { id: 1, name: 'Up to the country' }
  if (place <= PLANET) return { id: 2, name: 'Up to the planet' }
  return { id: 3, name: 'The stars' }
}
const ZONES = [0, TOWN + 1, COUNTRY + 1, PLANET + 1].map(zone)

const placeName = (i: number) => `${REGIONS[i].emoji} ${REGIONS[i].name}`

/** The top of Records: headline tiles, the income chart, personal bests, run history and your story. */
export function RecordsTop() {
  return (
    <>
      <StoryTiles />
      <div className="records-grid">
        <IncomeChart />
        <PersonalBests />
      </div>
      <Journey />
      <RunHistory />
    </>
  )
}

function Tile({ emoji, label, value, children }: { emoji: string; label: string; value: string; children: ReactNode }) {
  return (
    <div className="record-tile">
      <span className="record-tile-emoji" aria-hidden>
        {emoji}
      </span>
      <div>
        <div className="record-tile-label">{label}</div>
        <div className="record-tile-value">{value}</div>
        <div className="record-tile-fun">{children}</div>
      </div>
    </div>
  )
}

function StoryTiles() {
  const { state: s } = useGame()
  const served = s.stats.served.toNumber()
  const length = compare(served * SCHNITZEL_LENGTH, DISTANCES)
  const pork = served * PORK_PER_SCHNITZEL
  const weight = compare(pork, MASSES)
  const earned = s.stats.earned.toNumber()
  const pile = compare((earned / NOTE_VALUE) * NOTE_THICKNESS, HEIGHTS)
  const perSecond = s.stats.playtime > 0 ? served / s.stats.playtime : 0
  const badges = Object.keys(s.badges).filter((id) => BADGE_BY_ID[id]).length
  const share = badges / BADGES.length

  return (
    <section className="record-tiles" aria-label="Your schnitzel story in numbers">
      <Tile emoji="🍽️" label="Schnitzels served" value={fmtCompact(s.stats.served.floor())}>
        {length ? (
          <>
            Laid end to end: <b>{length.times}</b> {length.what}.
          </>
        ) : (
          'Not yet the length of a football pitch.'
        )}
      </Tile>
      <Tile emoji="🥩" label="Pork used" value={pork >= 1000 ? `${fmtCompact(pork / 1000)} t` : `${fmtCompact(pork)} kg`}>
        {weight ? (
          <>
            As heavy as <b>{weight.times}</b> {weight.what}.
          </>
        ) : (
          'Lighter than Grandma. For now.'
        )}
      </Tile>
      <Tile emoji="💵" label="Money earned" value={'$' + fmtCompact(s.stats.earned)}>
        {pile ? (
          <>
            In $100 notes, a pile <b>{pile.times}</b> as tall as {pile.what}.
          </>
        ) : (
          'In $100 notes: still fits in a wallet.'
        )}
      </Tile>
      <Tile emoji="⏳" label="Time played" value={fmtTime(s.stats.playtime)}>
        That’s <b>{fmtCompact(perSecond)}</b> schnitzels for every second of it.
      </Tile>
      <Tile emoji="🏅" label="Badges" value={`${badges} of ${BADGES.length}`}>
        <span className="record-tile-bar" aria-hidden>
          <span style={{ width: `${Math.round(share * 100)}%` }} />
        </span>
        {Math.round(share * 100)}% · prices +{Math.round(badgeBonus(s) * 100)}%
      </Tile>
    </section>
  )
}

function PersonalBests() {
  const { state: s } = useGame()
  const st = s.stats
  const best: [string, string, string][] = [
    ['📈', 'Best income', st.bestIncome > 0 ? `$${fmtCompact(st.bestIncome)}/s` : '—'],
    ['✨', 'Biggest sale', st.bestSale.gt(0) ? `${fmtCompact(st.bestSale.floor())} Golden Crumbs` : '—'],
    ['🍽️', 'Most served in one run', fmtCompact(st.bestRunServed.floor())],
    ['⏳', 'Longest run', st.longestRun > 0 ? fmtTime(Math.max(st.longestRun, s.run.time)) : fmtTime(s.run.time)],
    ['⚡', 'Fastest to the town', st.bestTownTime > 0 ? fmtTime(st.bestTownTime) : '—'],
    ['🗺️', 'Farthest ever', placeName(st.bestPlace)],
  ]
  return (
    <section className="panel bests">
      <h2>🏆 Personal bests</h2>
      <ul>
        {best.map(([emoji, label, value]) => (
          <li key={label}>
            <span className="bests-emoji" aria-hidden>
              {emoji}
            </span>
            <span className="muted">{label}</span>
            <b>{value}</b>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** One bar per franchise: crumbs from the sale (log scale), coloured by how far the run got. */
function RunHistory() {
  const { state: s } = useGame()
  const [hover, setHover] = useState<number | null>(null)
  const current: RunRecord = {
    end: s.stats.playtime,
    time: s.run.time,
    place: furthestPlace(s),
    crumbs: pendingCrumbs(s).toNumber(),
    earned: s.run.earned.toNumber(),
    served: s.run.served.toNumber(),
  }
  const runs = [...s.stats.runs.slice(-60), current]
  const first = s.prestige.franchises - (runs.length - 1) + 1
  const logs = runs.map((r) => Math.log10(Math.max(1, r.crumbs)))
  const top = Math.max(1, Math.ceil(Math.max(...logs)))
  const h = hover === null ? null : runs[hover]

  if (s.stats.runs.length === 0) {
    return (
      <section className="panel run-history">
        <h2>🔁 Your runs</h2>
        <div className="run-now">
          <div>
            <span className="muted small">This run</span>
            <b>Run {s.prestige.franchises + 1}</b>
          </div>
          <div>
            <span className="muted small">Going for</span>
            <b>{fmtTime(current.time)}</b>
          </div>
          <div>
            <span className="muted small">Farthest place</span>
            <b>{placeName(current.place)}</b>
          </div>
          <div>
            <span className="muted small">Served</span>
            <b>{fmtCompact(Math.floor(current.served))}</b>
          </div>
          <div>
            <span className="muted small">Selling now pays</span>
            <b>{s.prestige.unlocked ? `${fmtCompact(Math.floor(current.crumbs))} ✨` : '—'}</b>
          </div>
        </div>
        <p className="hint">
          {s.prestige.unlocked
            ? 'Every franchise from now on adds a bar here, so you can see each run go further and pay more.'
            : 'Reach the whole town and sell your first franchise: every run then gets a bar here.'}
        </p>
      </section>
    )
  }

  return (
    <section className="panel run-history">
      <div className="journey-head">
        <h2>🔁 Your runs</h2>
        <span className="muted small">
          Golden Crumbs each sale paid (each line up is ten times more), coloured by how far the run got. Striped: this run, if you sold now.
        </span>
      </div>
      <div className="runs-chart" onPointerLeave={() => setHover(null)}>
        <div className="runs-axis" aria-hidden>
          <span>{fmtCompact(10 ** top)}</span>
          <span>{fmtCompact(10 ** Math.round(top / 2))}</span>
          <span>1</span>
        </div>
        <div className="runs-bars" role="img" aria-label={`${runs.length - 1} finished runs`}>
          {runs.map((r, i) => (
            <div
              key={i}
              className={`run-bar zone-${zone(r.place).id} ${i === runs.length - 1 ? 'now' : ''} ${hover === i ? 'on' : ''}`}
              style={{ height: `${Math.max(3, (logs[i] / top) * 100)}%` }}
              onPointerEnter={() => setHover(i)}
            />
          ))}
        </div>
        {h && hover !== null && (
          <div className="chart-tip runs-tip" style={{ left: `${((hover + 0.5) / runs.length) * 100}%`, transform: `translateX(${hover > runs.length / 2 ? '-100%' : '0'})` }}>
            <b>{hover === runs.length - 1 ? `Run ${s.prestige.franchises + 1} (now)` : `Run ${first + hover}`}</b>
            <span>
              {fmtTime(h.time)} · reached {placeName(h.place)}
            </span>
            <span>
              {hover === runs.length - 1 ? 'Selling now pays ' : 'Sold for '}
              {fmtCompact(Math.floor(h.crumbs))} ✨ · served {fmtCompact(Math.floor(h.served))}
            </span>
          </div>
        )}
      </div>
      <div className="legend runs-legend">
        {ZONES.map((z) => (
          <span key={z.id}>
            <i className={`swatch zone-${z.id}`} /> {z.name}
          </span>
        ))}
      </div>
    </section>
  )
}

const STORY: { badge: string; text: string; emoji: string }[] = [
  { badge: 'served1', emoji: '🍽️', text: 'First schnitzel' },
  { badge: 'placeTown', emoji: '🌆', text: 'The whole town' },
  { badge: 'franchise1', emoji: '✨', text: 'First franchise' },
  { badge: 'farm1', emoji: '🚜', text: 'Grandpa’s farm' },
  { badge: 'vehicle1', emoji: '🚐', text: 'First vehicle' },
  { badge: 'placeCountry', emoji: '🏞️', text: 'The whole country' },
  { badge: 'placeContinent', emoji: '🌍', text: 'The continent' },
  { badge: 'placePlanet', emoji: '🌐', text: 'The whole planet' },
  { badge: 'placeOrbit', emoji: '🛰️', text: 'Orbit' },
  { badge: 'placeMoon', emoji: '🌕', text: 'The Moon' },
  { badge: 'placeMars', emoji: '🔴', text: 'Mars' },
  { badge: 'placeBelt', emoji: '🪨', text: 'The asteroid belt' },
  { badge: 'placeJupiter', emoji: '🟠', text: 'Jupiter’s moons' },
  { badge: 'placeSolar', emoji: '☀️', text: 'The whole Solar System' },
]

/** When you first got to each big step (from the badges' timestamps), and what's still ahead. */
function Journey() {
  const { state: s } = useGame()
  const next = STORY.findIndex((m) => s.badges[m.badge] === undefined)
  const done = next === -1 ? STORY.length : next
  return (
    <section className="panel journey">
      <div className="journey-head">
        <h2>📜 Your story</h2>
        <span className="muted small">
          {done} of {STORY.length} · hours of play when you first got there
        </span>
      </div>
      <ol>
        {STORY.map((m, i) => {
          const at = s.badges[m.badge]
          const state = at !== undefined ? 'done' : i === next ? 'next' : 'later'
          return (
            <li key={m.badge} className={state}>
              <span className="journey-dot" aria-hidden>
                {m.emoji}
              </span>
              <span className="journey-name">{m.text}</span>
              <span className="journey-time">{at !== undefined ? fmtTime(at) : state === 'next' ? 'next' : '—'}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
