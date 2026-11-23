import { useRef, useState, type ReactNode } from 'react'
import { noteCopyKept } from '../engine/actions'
import { ago, useGame } from '../game/store'
import { downloadSave } from './saveCopy'
import type { Snapshot } from '../game/storage'

const REASON: Record<Snapshot['reason'], string> = {
  auto: 'automatic',
  'before-load': 'before loading a copy',
  'before-reset': 'before starting over',
  'before-restore': 'before going back',
  chapter: 'new chapter',
}

function Row({ title, text, children }: { title: string; text: ReactNode; children: ReactNode }) {
  return (
    <div className="save-row">
      <div>
        <b>{title}</b>
        <span className="muted small">{text}</span>
      </div>
      <div className="save-row-btns">{children}</div>
    </div>
  )
}

/** ☰ Game → Saves: keep a copy, bring one back, roll back, or start over. */
export function SavesDialog({ onClose }: { onClose: () => void }) {
  const game = useGame()
  const [note, setNote] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  // Read once (and after each change), not on every frame: it's a few big saves.
  const [points, setPoints] = useState<Snapshot[]>(() => game.snapshots())
  const refresh = () => setPoints(game.snapshots())
  const lastCopy = game.state.stats.lastCopyAt

  const onDownload = () => {
    downloadSave(game)
    setNote('Save downloaded.')
  }

  const onCopy = async () => {
    const text = game.exportSave()
    try {
      await navigator.clipboard.writeText(text)
      setNote('Save copied to the clipboard.')
    } catch {
      window.prompt('Copy your save:', text)
    }
    game.act((st) => noteCopyKept(st, Date.now()))
  }

  const onUpload = async (file: File | undefined) => {
    if (!file) return
    try {
      game.importSave(await file.text())
      refresh()
      setNote('Save loaded. Changed your mind? Go back to “before loading a copy” below.')
    } catch {
      setNote('That file is not a Schnitzelverse save.')
    }
  }

  const onPaste = () => {
    const text = window.prompt('Paste a save:')
    if (!text) return
    try {
      game.importSave(text)
      refresh()
      setNote('Save loaded. Changed your mind? Go back to “before loading a copy” below.')
    } catch {
      setNote('That does not look like a Schnitzelverse save.')
    }
  }

  const onRestore = (p: Snapshot) => {
    if (!window.confirm(`Go back to the game as it was ${ago(p.at)} (${p.label})? The game as it is now is kept as a restore point too.`)) return
    setNote(game.restoreSnapshot(p.at) ? 'Restored.' : 'That restore point is gone.')
    refresh()
  }

  const onReset = () => {
    if (!window.confirm('Start over from an empty garage? This deletes your progress.')) return
    game.hardReset()
    refresh()
    onClose()
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="saves-title" onClick={onClose}>
      <div className="dialog saves" onClick={(e) => e.stopPropagation()}>
        <h2 id="saves-title">Your save</h2>
        <p className="muted saves-intro">
          The game saves itself in this browser every few seconds. Keep a copy to move to another computer or browser.
        </p>
        <p className="small muted saves-status">
          {game.persisted
            ? '🔒 This browser has promised to keep your save.'
            : 'Browsers can clear saved games (in a private window, when you clear your history, or Safari after 7 days away), so keep a copy now and then.'}{' '}
          Last copy kept: {lastCopy ? ago(lastCopy) : 'never'}.
        </p>

        <Row title="Save now" text="Not needed, but it feels good.">
          <button
            onClick={() => {
              game.save()
              setNote('Saved.')
            }}
          >
            Save
          </button>
        </Row>
        <Row title="Keep a copy" text="As a file, or as text to paste somewhere.">
          <button onClick={onDownload}>Download</button>
          <button onClick={onCopy}>Copy text</button>
        </Row>
        <Row title="Load a copy" text="Replaces the game you’re playing now.">
          <button onClick={() => fileInput.current?.click()}>Open file</button>
          <button onClick={onPaste}>Paste text</button>
        </Row>
        <div className="save-row save-points">
          <div>
            <b>Undo a mistake</b>
            <span className="muted small">Go back to a restore point: taken every 15 minutes, and before loading a copy, starting over or going back.</span>
          </div>
          {points.length ? (
            <ul className="save-point-list">
              {points.map((p) => (
                <li key={p.at}>
                  <span>
                    <b>{ago(p.at)}</b> · {p.label} <span className="muted">· {REASON[p.reason]}</span>
                  </span>
                  <button onClick={() => onRestore(p)}>Go back</button>
                </li>
              ))}
            </ul>
          ) : (
            <span className="muted small">No restore points yet: the first is taken in a moment.</span>
          )}
        </div>
        <Row title="Start over" text="An empty garage. Your progress is deleted.">
          <button className="danger" onClick={onReset}>
            Start over
          </button>
        </Row>

        <input
          ref={fileInput}
          type="file"
          accept=".txt,text/plain"
          hidden
          onChange={(e) => {
            void onUpload(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        <div className="btns saves-foot">
          <span className="note" role="status">
            {note}
          </span>
          <button className="primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
