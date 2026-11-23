// Keeping a copy of the save: one way to do it for the Saves dialog and the
// new-chapter note.
import { noteCopyKept } from '../engine/actions'
import type { GameStore } from '../game/store'

/** Download the save as a dated text file, and remember that a copy was kept. */
export function downloadSave(game: GameStore): void {
  const url = URL.createObjectURL(new Blob([game.exportSave()], { type: 'text/plain' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `schnitzelverse-${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
  game.act((st) => noteCopyKept(st, Date.now()))
}
