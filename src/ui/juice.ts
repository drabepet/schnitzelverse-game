// Little bits of feedback, scaled to the moment: floating "+1" text where you
// clicked, a burst of crumbs for a milestone, one big card for a new chapter
// or a sale. Pure DOM, outside React, so none of it costs a re-render.
import type { EffectsLevel } from '../engine/state'

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Settings → effects: full, calm (only the big moments) or off. Set by App.tsx. */
let level: EffectsLevel = 'full'
export function setEffectsLevel(l: EffectsLevel): void {
  level = l
}

/** Show `text` rising from where the click happened (or the element's centre). */
export function floatText(e: { clientX: number; clientY: number; currentTarget: EventTarget | null }, text: string): void {
  if (level !== 'full' || reduceMotion() || !text) return
  let x = e.clientX
  let y = e.clientY
  // Keyboard "clicks" have no position: use the button's centre.
  if (x === 0 && y === 0 && e.currentTarget instanceof Element) {
    const r = e.currentTarget.getBoundingClientRect()
    x = r.left + r.width / 2
    y = r.top
  }
  const el = document.createElement('div')
  el.className = 'floater'
  el.textContent = text
  el.style.left = `${x}px`
  el.style.top = `${y}px`
  el.setAttribute('aria-hidden', 'true')
  document.body.appendChild(el)
  window.setTimeout(() => el.remove(), 900)
}

/**
 * A burst of little things flying out from a point (milestones): crumbs in
 * the garage and on the farm, sparks on the road, stars in space. `size`
 * 1 is a small burst; 2 a bigger one. Full effects only; never with reduced motion.
 */
export function burst(x: number, y: number, pieces: string[], size: 1 | 2 = 1): void {
  if (level !== 'full' || reduceMotion()) return
  const count = size === 2 ? 18 : 9
  const box = document.createElement('div')
  box.className = 'burst'
  box.style.left = `${x}px`
  box.style.top = `${y}px`
  box.setAttribute('aria-hidden', 'true')
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span')
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
    const dist = (size === 2 ? 70 : 45) * (0.6 + Math.random() * 0.6)
    p.textContent = pieces[i % pieces.length]
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`)
    p.style.setProperty('--dy', `${Math.sin(angle) * dist - 20}px`)
    p.style.setProperty('--rot', `${Math.round(Math.random() * 360 - 180)}deg`)
    box.appendChild(p)
  }
  document.body.appendChild(box)
  window.setTimeout(() => box.remove(), 1000)
}

/** What flies out in a burst: crumbs in the garage and on the farm, sparks on the road, stars in space. */
export function burstPieces(chapter: number): string[] {
  if (chapter >= 4) return ['⭐', '✨', '•']
  if (chapter === 3) return ['✨', '💨', '•']
  return ['🍞', '✨', '•']
}

/** A burst from the middle of an element (or the top of the window). */
export function burstAt(el: Element | null, pieces: string[], size: 1 | 2 = 1): void {
  const r = el?.getBoundingClientRect()
  burst(r ? r.left + r.width / 2 : window.innerWidth / 2, r ? r.top + r.height / 2 : 80, pieces, size)
}

/**
 * The big moments (a new chapter, selling the business): one card in the
 * middle of the window for a couple of seconds. It never takes clicks. Shown
 * with full and calm effects; reduced motion only fades it.
 */
export function moment(emoji: string, title: string, text: string): void {
  if (level === 'off') return
  document.querySelector('.moment')?.remove()
  const el = document.createElement('div')
  el.className = `moment${reduceMotion() ? ' still' : ''}`
  el.setAttribute('role', 'status')
  const card = document.createElement('div')
  card.className = 'moment-card'
  const big = document.createElement('span')
  big.className = 'moment-emoji'
  big.textContent = emoji
  const h = document.createElement('b')
  h.textContent = title
  const p = document.createElement('span')
  p.textContent = text
  card.append(big, h, p)
  el.appendChild(card)
  document.body.appendChild(el)
  window.setTimeout(() => el.remove(), 2800)
}
