import { Logo } from './Logo'
import { useTabIcon } from './useTabIcon'
import { useEffect, useRef, useState } from 'react'
import { SettingsDialog } from './SettingsDialog'
import { AboutDialog } from './AboutDialog'
import { SavesDialog } from './SavesDialog'
import { GAME_VERSION } from '../version'
import { chapterNumber, furthestPlace } from '../engine/rules'
import { CHAPTERS, REGIONS } from '../engine/content'
import { clickLogo, setIntroSeen, setNewsSeen } from '../engine/actions'
import { useGame } from '../game/store'

/** “The whole town” → “the whole town”; proper names (Moon, Mars, Jupiter) stay. */
const inSentence = (name: string) => (/^(Moon|Mars|Jupiter)/.test(name) ? name : name[0].toLowerCase() + name.slice(1))

export function Header() {
  const game = useGame()
  const s = game.state
  useTabIcon()
  const [menuOpen, setMenuOpen] = useState(false)
  const [open, setOpen] = useState<'settings' | 'saves' | 'about' | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const chapter = chapterNumber(s)
  const place = REGIONS[furthestPlace(s)]
  const hasNews = s.introSeen && s.newsSeen !== GAME_VERSION

  // Close the menu on a click outside it or on Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const pick = (what: 'settings' | 'saves' | 'about') => {
    setMenuOpen(false)
    setOpen(what)
    if (what === 'about') game.act((st) => setNewsSeen(st, GAME_VERSION))
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
            Chapter {chapter} · {CHAPTERS[chapter - 1].name}
          </div>
          <div className="subline">
            Run {s.prestige.franchises + 1} · selling to {place.emoji} {inSentence(place.name)}
          </div>
        </div>
      </div>

      <div className="menu" ref={menuRef}>
        <button className="ghost" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-haspopup="menu">
          ☰ Game
          {hasNews && <span className="news-dot" title="What’s new" />}
        </button>
        {menuOpen && (
          <div className="menu-pop" role="menu">
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false)
                game.act((st) => setIntroSeen(st, false))
              }}
            >
              <b>How to play</b>
              <span>The welcome page again</span>
            </button>
            <button role="menuitem" onClick={() => pick('settings')}>
              <b>Settings</b>
              <span>Size, numbers, pop-ups</span>
            </button>
            <button role="menuitem" onClick={() => pick('saves')}>
              <b>Saves</b>
              <span>Keep a copy, load one, start over</span>
            </button>
            <button role="menuitem" onClick={() => pick('about')}>
              <b>
                About &amp; what’s new
                {hasNews && <span className="new-pill">New</span>}
              </b>
              <span>Version {GAME_VERSION}</span>
            </button>
            <p className="menu-foot">Saves itself every few seconds.</p>
          </div>
        )}
      </div>
      {open === 'settings' && <SettingsDialog onClose={() => setOpen(null)} />}
      {open === 'saves' && <SavesDialog onClose={() => setOpen(null)} />}
      {open === 'about' && <AboutDialog onClose={() => setOpen(null)} />}
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
