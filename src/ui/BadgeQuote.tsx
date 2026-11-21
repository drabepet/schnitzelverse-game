import { useEffect, useState } from 'react'
import { BADGE_BY_ID } from '../engine/badges'
import { useGame } from '../game/store'

/** Seconds each badge stays in the sidebar. */
const EVERY = 10
/** A log line newer than this (seconds of play) is shown first, so news isn't missed. */
const FRESH = 12

/**
 * The bottom of the sidebar: the joke from one of your badges, a different
 * one every few seconds (click for the next). Fresh garage chatter wins for a moment.
 */
export function BadgeQuote() {
  const { state } = useGame()
  const earned = Object.keys(state.badges).filter((id) => BADGE_BY_ID[id])
  const [pick, setPick] = useState(() => Math.floor(Math.random() * 1e9))

  useEffect(() => {
    const timer = window.setInterval(() => setPick((p) => p + 1 + Math.floor(Math.random() * 7)), EVERY * 1000)
    return () => window.clearInterval(timer)
  }, [])

  const latest = state.log[0]
  if (latest && (state.stats.playtime - latest.t < FRESH || earned.length === 0)) {
    return (
      <div className="sb-section sb-detail sb-chatter" title="Garage chatter: see Records">
        💬 {latest.text}
      </div>
    )
  }
  if (!earned.length) return null

  const b = BADGE_BY_ID[earned[pick % earned.length]]
  return (
    <button
      key={b.id}
      className="sb-section sb-detail sb-quote"
      onClick={() => setPick((p) => p + 1)}
      title={`One of your ${earned.length} badges. Click for another.`}
    >
      <span className="sb-quote-head">
        <span aria-hidden>{b.emoji}</span> {b.name}
      </span>
      <span className="sb-quote-text">{b.flavor}</span>
    </button>
  )
}
