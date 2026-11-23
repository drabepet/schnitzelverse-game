import { useEffect } from 'react'
import { CHAPTERS } from '../engine/content'
import { setCopyNudgeChapter } from '../engine/actions'
import { chapterNumber } from '../engine/rules'
import { useGame } from '../game/store'
import { downloadSave } from './saveCopy'

/**
 * A new chapter is a good moment to keep a copy of the save: suggested once
 * per chapter, never on a timer. A restore point is taken at the same moment.
 */
export function CopyNudge() {
  const game = useGame()
  const s = game.state
  const chapter = chapterNumber(s)
  const due = s.introSeen && chapter > s.copyNudgeChapter

  useEffect(() => {
    if (due) game.snapshot('chapter')
  }, [due, game])

  if (!due) return null
  const done = () => game.act((st) => setCopyNudgeChapter(st, chapter))
  return (
    <div className="toast copy-nudge" role="status">
      <span className="toast-emoji">📖</span>
      <span>
        <span className="toast-title">
          Chapter {chapter} · {CHAPTERS[chapter - 1].name}!
        </span>
        <span className="toast-text">A good moment to keep a copy of your save, in case this browser ever loses it.</span>
        <span className="copy-nudge-btns">
          <button
            className="primary small-btn"
            onClick={() => {
              downloadSave(game)
              done()
            }}
          >
            Download a copy
          </button>
          <button className="small-btn" onClick={done}>
            Not now
          </button>
        </span>
      </span>
    </div>
  )
}
