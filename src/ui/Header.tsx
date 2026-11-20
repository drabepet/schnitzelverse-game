import { Logo } from './Logo'
import { useTabIcon } from './useTabIcon'
import { useRef, useState } from 'react'
import { SettingsDialog } from './SettingsDialog'
import { AboutDialog } from './AboutDialog'
import { GAME_VERSION } from '../version'
import { chapter2Unlocked, chapter3Unlocked, chapter4Unlocked } from '../engine/rules'
import { clickLogo, setIntroSeen } from '../engine/actions'
import { useGame } from '../game/store'

export function Header() {
  const game = useGame()
  const s = game.state
  useTabIcon()
  const [menuOpen, setMenuOpen] = useState(false)
  const [note, setNote] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const flash = (text: string) => {
    setNote(text)
    window.setTimeout(() => setNote(''), 2500)
  }

  const onExport = async () => {
    const text = game.exportSave()
    try {
      await navigator.clipboard.writeText(text)
      flash('Save copied to clipboard')
    } catch {
      window.prompt('Copy your save:', text)
    }
  }

  const onImport = () => {
    const text = window.prompt('Paste a save string:')
    if (!text) return
    try {
      game.importSave(text)
      flash('Save imported')
    } catch {
      flash('That does not look like a Schnitzelverse save')
    }
  }

  const onDownload = () => {
    const text = game.exportSave()
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `schnitzelverse-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    flash('Save downloaded')
  }

  const onUpload = async (file: File | undefined) => {
    if (!file) return
    try {
      game.importSave(await file.text())
      flash('Save loaded')
    } catch {
      flash('That file is not a Schnitzelverse save')
    }
  }

  const onRestore = () => {
    if (!window.confirm('Go back to the backup copy (saved up to 10 minutes ago, or just before your last import or reset)?')) return
    flash(game.restoreBackup() ? 'Backup restored' : 'No backup yet')
  }

  const onReset = () => {
    if (window.confirm('Start over from an empty garage? This deletes your progress.')) game.hardReset()
  }

  return (
    <header className="header">
      <div className="brand">
        {/* Psst: click the plate. */}
        <button className="brand-mark" aria-label="Schnitzelverse" onClick={() => game.act((st) => clickLogo(st))}>
          <Logo size={56} />
        </button>
        <div>
          <h1>Schnitzelverse</h1>
          <div className="subtitle">
            Chapter {chapter4Unlocked(s) ? 4 : chapter3Unlocked(s) ? 3 : chapter2Unlocked(s) ? 2 : 1} · run #
            {s.prestige.franchises + 1}
          </div>
        </div>
      </div>


      <div className="menu">
        {note && <span className="note">{note}</span>}
        <button className="ghost" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen}>
          ☰ Game
        </button>
        {menuOpen && (
          <div className="menu-pop" onMouseLeave={() => setMenuOpen(false)}>
            <button
              onClick={() => {
                game.save()
                flash('Saved')
              }}
            >
              💾 Save now
            </button>
            <button onClick={() => setAboutOpen(true)}>ℹ️ About · v{GAME_VERSION}</button>
            <button onClick={() => game.act((st) => setIntroSeen(st, false))}>📖 How to play</button>
            <button onClick={() => setSettingsOpen(true)}>⚙️ Settings</button>
            <button onClick={onDownload}>⬇️ Save to file</button>
            <button onClick={() => fileInput.current?.click()}>⬆️ Load from file</button>
            <button onClick={onExport}>📤 Copy save text</button>
            <button onClick={onImport}>📥 Paste save text</button>
            <button onClick={onRestore}>↩️ Restore backup</button>
            <button className="danger" onClick={onReset}>
              🗑️ Hard reset
            </button>
          </div>
        )}
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
      </div>
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
      {aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}
      {game.saveNotice && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="dialog">
            <h2>About your save</h2>
            <p>{game.saveNotice}</p>
            <button className="primary" onClick={() => game.dismissSaveNotice()}>
              OK
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
