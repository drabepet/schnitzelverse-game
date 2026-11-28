// Kitchen tales: which ones you can read, which are new, and a way to open
// one from anywhere (the new-chapter card lives outside the header's menu).
import { TALES, type Tale } from '../engine/content'
import { chapterNumber } from '../engine/rules'
import type { GameState } from '../engine/state'

export const OPEN_TALE_EVENT = 'schnitzelverse:open-tale'

/** Open ☰ Game → Kitchen tales at one tale (by its id). */
export function openTale(id: number): void {
  window.dispatchEvent(new CustomEvent<number>(OPEN_TALE_EVENT, { detail: id }))
}

/** Open to read: its chapter is reached and, for Chapter 6's later tales, enough of everyone has been fed. */
export const taleOpen = (s: GameState, t: Tale): boolean => t.chapter <= chapterNumber(s) && (t.fed === undefined || s.stats.bestFed >= t.fed)

/** Every tale you can read so far, in reading order. */
export const openTales = (s: GameState): Tale[] => TALES.filter((t) => taleOpen(s, t))

/** Open but not read yet. */
export const unreadTales = (s: GameState): Tale[] => openTales(s).filter((t) => !s.talesRead.includes(t.id))

/** The first open tale the new-chapter card hasn't offered yet (in reading order, so a chapter's opening tale comes first). */
export const taleToOffer = (s: GameState): Tale | undefined => openTales(s).find((t) => t.id > s.taleOffered)

/** The newest open tale: “Later” on the card counts every open tale as offered. */
export const newestOpenTale = (s: GameState): Tale | undefined => openTales(s).at(-1)
