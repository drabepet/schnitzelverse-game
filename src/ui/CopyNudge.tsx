import { useEffect } from 'react'
import { CHAPTERS, TALES } from '../engine/content'
import { setCopyNudgeChapter, setTaleOffered } from '../engine/actions'
import { chapterNumber } from '../engine/rules'
import { useGame } from '../game/store'
import { downloadSave } from './saveCopy'
import { openTale } from './tales'

/**
 * The new-chapter card: the chapter's kitchen tale (read now, or later from
 * ☰ Game → Kitchen tales) and a good moment to keep a copy of the save. Once
 * per chapter, never on a timer; a restore point is taken at the same moment.
 * Each half goes away on its own; Later closes both.
 */
export function CopyNudge() {
  const game = useGame()
  const s = game.state
  const chapter = chapterNumber(s)
  const copyDue = s.introSeen && chapter > s.copyNudgeChapter
  const tale = s.introSeen && chapter > s.taleOffered ? TALES.find((t) => t.chapter === chapter) : undefined

  useEffect(() => {
    if (copyDue) game.snapshot('chapter')
  }, [copyDue, game])

  if (!copyDue && !tale) return null
  const later = () =>
    game.act((st) => {
      setCopyNudgeChapter(st, chapter)
      setTaleOffered(st, chapter)
    })
  return (
    <div className="toast copy-nudge" role="status">
      <span className="toast-emoji">{tale?.emoji ?? '📖'}</span>
      <span>
        <span className="toast-title">
          Chapter {chapter} · {CHAPTERS[chapter - 1].name}!
        </span>
        {tale && (
          <span className="toast-text">
            📖 A new kitchen tale: <i>{tale.title}</i>. A few minutes’ read; it waits in ☰ Game → Kitchen tales.
          </span>
        )}
        {copyDue && <span className="toast-text">💾 A good moment to keep a copy of your save, in case this browser ever loses it.</span>}
        <span className="copy-nudge-btns">
          {tale && (
            <button
              className="primary small-btn"
              onClick={() => {
                game.act((st) => setTaleOffered(st, chapter))
                openTale(chapter)
              }}
            >
              Read it now
            </button>
          )}
          {copyDue && (
            <button
              className={`${tale ? '' : 'primary '}small-btn`}
              onClick={() => {
                downloadSave(game)
                game.act((st) => setCopyNudgeChapter(st, chapter))
              }}
            >
              Download a copy
            </button>
          )}
          <button className="small-btn" onClick={later}>
            Later
          </button>
        </span>
      </span>
    </div>
  )
}
