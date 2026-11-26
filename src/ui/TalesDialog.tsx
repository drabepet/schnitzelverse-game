import { useEffect, useState } from 'react'
import { useEscape } from './useEscape'
import { CHAPTERS, TALES } from '../engine/content'
import { markTaleRead } from '../engine/actions'
import { chapterNumber } from '../engine/rules'
import { useGame } from '../game/store'

/**
 * ☰ Game → Kitchen tales: one story per chapter, a few minutes' read each.
 * Chapters not reached yet are locked covers (their names stay secret).
 */
export function TalesDialog({ onClose, start }: { onClose: () => void; start?: number }) {
  const game = useGame()
  const s = game.state
  const reached = chapterNumber(s)
  const [chapter, setChapter] = useState(Math.min(start ?? reached, reached))
  const tale = TALES.find((t) => t.chapter === chapter)!

  useEscape(onClose)

  // Opening a tale marks it read (the “New” dot goes away).
  useEffect(() => {
    if (!s.talesRead.includes(chapter)) game.act((st) => markTaleRead(st, chapter))
  }, [chapter, s.talesRead, game])

  return (
    <div className="overlay intro-overlay" role="dialog" aria-modal="true" aria-labelledby="tales-title" onClick={onClose}>
      <div className="dialog intro tales" onClick={(e) => e.stopPropagation()}>
        <div className="intro-hero">
          <div className="intro-hero-art tales-art">📖</div>
          <div>
            <p className="intro-kicker">Kitchen tales</p>
            <h1 id="tales-title">Stories from the family</h1>
            <p className="intro-tagline">One for every chapter, told the way Grandma tells it.</p>
          </div>
          <button className="about-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="intro-body tales-body">
          <nav className="tales-list" aria-label="Chapters">
            {TALES.map((t) => {
              const open = t.chapter <= reached
              return (
                <button
                  key={t.chapter}
                  className={`tales-item ${t.chapter === chapter ? 'on' : ''}`}
                  disabled={!open}
                  aria-current={t.chapter === chapter}
                  onClick={() => setChapter(t.chapter)}
                >
                  <span className="tales-item-emoji">{open ? t.emoji : '🔒'}</span>
                  <span>
                    <span className="muted small">Chapter {t.chapter}</span>
                    <b>{open ? t.title : 'Not yet'}</b>
                  </span>
                  {open && !s.talesRead.includes(t.chapter) && <span className="new-pill">New</span>}
                </button>
              )
            })}
          </nav>
          <article className="intro-card tales-text">
            <p className="intro-kicker">
              Chapter {tale.chapter} · {CHAPTERS[tale.chapter - 1].name}
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
