import { Logo } from './Logo'
import { useTabIcon } from './useTabIcon'
import { Suspense, useEffect, useRef, useState } from 'react'
import { AboutDialog, SavesDialog, SettingsDialog, TalesDialog } from './lazyParts'
import { OPEN_TALE_EVENT, unreadTales } from './tales'
import { GAME_VERSION } from '../version'
import { chapterNumber, furthestPlace, nextChapterGoal } from '../engine/rules'
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
  const [open, setOpen] = useState<'settings' | 'saves' | 'about' | 'tales' | null>(null)
  const [taleStart, setTaleStart] = useState<number | undefined>(undefined)
  const menuRef = useRef<HTMLDivElement>(null)
  const chapter = chapterNumber(s)
  const nextChapter = nextChapterGoal(s)
  const place = REGIONS[furthestPlace(s)]
  const hasNews = s.introSeen && s.newsSeen !== GAME_VERSION
  const newTales = s.introSeen ? unreadTales(s).length : 0

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

  // The new-chapter card can open a tale (see tales.ts).
  useEffect(() => {
    const onOpen = (e: Event) => {
      setTaleStart((e as CustomEvent<number>).detail)
      setOpen('tales')
    }
    window.addEventListener(OPEN_TALE_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_TALE_EVENT, onOpen)
  }, [])

  const pick = (what: 'settings' | 'saves' | 'about' | 'tales') => {
    setMenuOpen(false)
    setTaleStart(undefined)
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
            {nextChapter && (
              <span
                className="next-chapter"
                title={`Chapter ${nextChapter.chapter} · ${nextChapter.name} opens ${nextChapter.when}.`}
              >
                next: {nextChapter.name} · {nextChapter.text}
              </span>
            )}
          </div>
          <div className="subline">
            Run {s.prestige.franchises + 1} · selling to {place.emoji} {inSentence(place.name)}
          </div>
        </div>
      </div>

      <div className="menu" ref={menuRef}>
        <button className="ghost" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-haspopup="menu">
          ☰ Game
          {(hasNews || newTales > 0) && <span className="news-dot" title={hasNews ? 'What’s new' : 'A new kitchen tale'} />}
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
            <button role="menuitem" onClick={() => pick('tales')}>
              <b>
                Kitchen tales
                {newTales > 0 && <span className="new-pill">New</span>}
              </b>
              <span>A story for every chapter</span>
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
      <Suspense fallback={null}>
        {open === 'settings' && <SettingsDialog onClose={() => setOpen(null)} />}
        {open === 'saves' && <SavesDialog onClose={() => setOpen(null)} />}
        {open === 'about' && <AboutDialog onClose={() => setOpen(null)} />}
        {open === 'tales' && <TalesDialog start={taleStart} onClose={() => setOpen(null)} />}
      </Suspense>
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
