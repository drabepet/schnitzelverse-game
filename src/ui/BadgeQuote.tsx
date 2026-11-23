import { useEffect, useState } from 'react'
import { BADGE_BY_ID } from '../engine/badges'
import { PERK_BY_ID, type PerkDef } from '../engine/content'
import { describeManagerItems } from '../engine/automation'
import { fmtMoney, fmtTime } from '../engine/format'
import { useGame } from '../game/store'

/** Seconds each badge stays in the sidebar. */
const EVERY = 10
/** A log line newer than this (seconds of play) is shown first, so news isn't missed. */
const FRESH = 12
/** Family news: what a manager bought in the last few minutes takes every other turn with the badges. */
const NEWS = 180

/**
 * The bottom of the sidebar: the joke from one of your badges, a different
 * one every few seconds (click for the next). Fresh news from the family chronicle wins for a moment.
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
      <div className="sb-section sb-detail sb-chatter" title="Family chronicle: see Records">
        💬 {latest.text}
      </div>
    )
  }
  // Every other turn: the latest thing a manager bought, if it's recent.
  const news = [...state.managerLog].reverse().find((e) => state.stats.playtime - e.t < NEWS)
  // The log comes from the save: skip an entry whose manager no longer exists.
  const who = news && (PERK_BY_ID[news.who] as PerkDef | undefined)
  if (news && who && (pick % 2 === 1 || !earned.length)) {
    return (
      <button className="sb-section sb-detail sb-quote" onClick={() => setPick((p) => p + 1)} title="Family news: what the managers did lately. Click for a badge.">
        <span className="sb-quote-head">
          <span aria-hidden>{who.emoji}</span> {who.name}
        </span>
        <span className="sb-quote-text">
          {describeManagerItems(news.items)}
          {news.cost > 0 ? ` for ${fmtMoney(news.cost)}` : ''} · {fmtTime(Math.max(0, state.stats.playtime - news.t))} ago
        </span>
      </button>
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
