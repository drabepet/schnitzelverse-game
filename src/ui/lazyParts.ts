// The parts of the page most visits never open (the Records tab and the game
// menu's dialogs) live in their own files. They load in the background once
// the game is running, so opening one later is still instant.
import { lazy } from 'react'

const loadRecords = () => import('./RecordsTab')
const loadSettings = () => import('./SettingsDialog')
const loadSaves = () => import('./SavesDialog')
const loadAbout = () => import('./AboutDialog')
const loadTales = () => import('./TalesDialog')

export const RecordsTab = lazy(loadRecords)
export const SettingsDialog = lazy(() => loadSettings().then((m) => ({ default: m.SettingsDialog })))
export const SavesDialog = lazy(() => loadSaves().then((m) => ({ default: m.SavesDialog })))
export const AboutDialog = lazy(() => loadAbout().then((m) => ({ default: m.AboutDialog })))
export const TalesDialog = lazy(() => loadTales().then((m) => ({ default: m.TalesDialog })))

/** Fetch them all when the browser has a quiet moment (or after 2 s). */
export function preloadLazyParts(): void {
  const all = () => void Promise.all([loadRecords(), loadSettings(), loadSaves(), loadAbout(), loadTales()]).catch(() => {})
  // Not in every browser yet (older Safari): fall back to a timer.
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(all, { timeout: 2000 })
  else setTimeout(all, 2000)
}
