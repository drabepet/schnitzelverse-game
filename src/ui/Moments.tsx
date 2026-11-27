import { useEffect, useRef } from 'react'
import { CHAPTERS } from '../engine/content'
import { chapterNumber, furthestPlace } from '../engine/rules'
import { useGame } from '../game/store'
import { burstAt, burstPieces, moment } from './juice'
import { chapterTune, sfx } from './sound'

/**
 * Watches for the moments worth a little celebration while you play: a new
 * place (a burst; a bigger one for your farthest place ever), a sale by Mum
 * (a burst), a new chapter (the big card and the chapter's tune) and a new
 * badge (a chime). Nothing on load, so coming back after a while doesn't set
 * them all off.
 */
export function Moments() {
  const { state: s } = useGame()
  const now = {
    chapter: chapterNumber(s),
    place: furthestPlace(s),
    best: s.stats.bestPlace,
    sales: s.prestige.franchises,
    badges: Object.keys(s.badges).length,
  }
  const prev = useRef<typeof now | null>(null)

  useEffect(() => {
    const p = prev.current
    prev.current = now
    if (!p) return
    const pieces = burstPieces(now.chapter)
    if (now.chapter > p.chapter) {
      moment(CHAPTERS[now.chapter - 1].emoji, `Chapter ${now.chapter}`, CHAPTERS[now.chapter - 1].name)
      chapterTune(now.chapter)
    } else if (now.sales > p.sales) {
      burstAt(document.querySelector('.sb-key'), ['✨', '🌟', '•'], 2)
      sfx('sold')
    } else if (now.best > p.best) {
      burstAt(document.querySelector('.header .subline'), pieces, 2)
      sfx('farPlace')
    } else if (now.place > p.place) {
      burstAt(document.querySelector('.header .subline'), pieces, 1)
      sfx('place')
    } else if (now.badges > p.badges) {
      sfx('badge')
    }
    // Only these five numbers matter; `now` is rebuilt every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now.chapter, now.place, now.best, now.sales, now.badges])
  return null
}
