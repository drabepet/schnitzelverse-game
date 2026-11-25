// Kitchen tales: which ones you can read, which are new, and a way to open
// one from anywhere (the new-chapter card lives outside the header's menu).
import { TALES, type Tale } from '../engine/content'
import { chapterNumber } from '../engine/rules'
import type { GameState } from '../engine/state'

export const OPEN_TALE_EVENT = 'schnitzelverse:open-tale'

/** Open ☰ Game → Kitchen tales at a chapter's tale. */
export function openTale(chapter: number): void {
  window.dispatchEvent(new CustomEvent<number>(OPEN_TALE_EVENT, { detail: chapter }))
}

/** Tales of every chapter reached so far. */
export const openTales = (s: GameState): Tale[] => TALES.filter((t) => t.chapter <= chapterNumber(s))

/** Reached but not opened yet. */
export const unreadTales = (s: GameState): Tale[] => openTales(s).filter((t) => !s.talesRead.includes(t.chapter))
