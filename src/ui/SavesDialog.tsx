import { useRef, useState, type ReactNode } from 'react'
import { useGame } from '../game/store'

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

  const onDownload = () => {
    const url = URL.createObjectURL(new Blob([game.exportSave()], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `schnitzelverse-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
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
  }

  const onUpload = async (file: File | undefined) => {
    if (!file) return
    try {
      game.importSave(await file.text())
      setNote('Save loaded.')
    } catch {
      setNote('That file is not a Schnitzelverse save.')
    }
  }

  const onPaste = () => {
    const text = window.prompt('Paste a save:')
    if (!text) return
    try {
      game.importSave(text)
      setNote('Save loaded.')
    } catch {
      setNote('That does not look like a Schnitzelverse save.')
    }
  }

  const onRestore = () => {
    if (!window.confirm('Go back to the backup copy (saved up to 10 minutes ago, or just before your last load or reset)?')) return
    setNote(game.restoreBackup() ? 'Backup restored.' : 'No backup yet.')
  }

  const onReset = () => {
    if (!window.confirm('Start over from an empty garage? This deletes your progress.')) return
    game.hardReset()
    onClose()
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="saves-title" onClick={onClose}>
      <div className="dialog saves" onClick={(e) => e.stopPropagation()}>
        <h2 id="saves-title">Your save</h2>
        <p className="muted saves-intro">
          The game saves itself in this browser every few seconds. Keep a copy to move to another computer or browser.
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
        <Row title="Undo a mistake" text="Goes back to a copy from up to 10 minutes ago.">
          <button onClick={onRestore}>Restore backup</button>
        </Row>
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
