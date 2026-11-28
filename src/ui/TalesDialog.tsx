import { useEffect, useState } from 'react'
import { useEscape } from './useEscape'
import { CHAPTERS, TALES, type Tale } from '../engine/content'
import { markTaleRead } from '../engine/actions'
import { chapterNumber } from '../engine/rules'
import { useGame } from '../game/store'
import { openTales, taleOpen } from './tales'

/** What a locked tale says about when it opens (its name stays secret). */
function whenOpen(t: Tale, reached: number): string {
  if (t.chapter > reached) return 'Not yet'
  return t.fed !== undefined ? `When ${Math.round(t.fed * 100)}% of everyone is fed` : 'Not yet'
}

/**
 * ☰ Game → Kitchen tales: a story for every chapter (Chapter 6 has a few, one
 * for each step towards feeding everyone), a few minutes' read each. Tales not
 * open yet are locked covers; their names stay secret.
 */
export function TalesDialog({ onClose, start }: { onClose: () => void; start?: number }) {
  const game = useGame()
  const s = game.state
  const reached = chapterNumber(s)
  const open = openTales(s)
  const [id, setId] = useState(() => (start !== undefined && open.some((t) => t.id === start) ? start : open[open.length - 1].id))
  const tale = TALES.find((t) => t.id === id)!
  const inChapter = TALES.filter((t) => t.chapter === tale.chapter)

  useEscape(onClose)

  // Opening a tale marks it read (the “New” dot goes away).
  useEffect(() => {
    if (!s.talesRead.includes(id)) game.act((st) => markTaleRead(st, id))
  }, [id, s.talesRead, game])

  return (
    <div className="overlay intro-overlay" role="dialog" aria-modal="true" aria-labelledby="tales-title" onClick={onClose}>
      <div className="dialog intro tales" onClick={(e) => e.stopPropagation()}>
        <div className="intro-hero">
          <div className="intro-hero-art tales-art">📖</div>
          <div>
            <p className="intro-kicker">Kitchen tales</p>
            <h1 id="tales-title">Stories from the family</h1>
            <p className="intro-tagline">One for every chapter, and a few more at the end, told the way Grandma tells it.</p>
          </div>
          <button className="about-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="intro-body tales-body">
          <nav className="tales-list" aria-label="Tales">
            {TALES.map((t) => {
              const can = taleOpen(s, t)
              const first = TALES.find((x) => x.chapter === t.chapter) === t
              return (
                <button
                  key={t.id}
                  className={`tales-item ${t.id === id ? 'on' : ''}${first ? '' : ' tales-item-more'}`}
                  disabled={!can}
                  aria-current={t.id === id}
                  onClick={() => setId(t.id)}
                >
                  <span className="tales-item-emoji">{can ? t.emoji : '🔒'}</span>
                  <span>
                    <span className="muted small">{first ? `Chapter ${t.chapter}` : t.fed !== undefined ? `${Math.round(t.fed * 100)}% fed` : `Chapter ${t.chapter}`}</span>
                    <b>{can ? t.title : whenOpen(t, reached)}</b>
                  </span>
                  {can && !s.talesRead.includes(t.id) && <span className="new-pill">New</span>}
                </button>
              )
            })}
          </nav>
          <article className="intro-card tales-text">
            <p className="intro-kicker">
              Chapter {tale.chapter} · {CHAPTERS[tale.chapter - 1].name}
              {inChapter.length > 1 && ` · tale ${inChapter.indexOf(tale) + 1} of ${inChapter.length}`}
            </p>
            <h2>
              {tale.emoji} {tale.title}
            </h2>
            {tale.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </article>
        </div>
      </div>
    </div>
  )
}
