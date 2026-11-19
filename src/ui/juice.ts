// Little bits of feedback: floating "+1" text where you clicked.
// Pure DOM, outside React, so a burst of clicks costs no re-renders.

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Show `text` rising from where the click happened (or the element's centre). */
export function floatText(e: { clientX: number; clientY: number; currentTarget: EventTarget | null }, text: string): void {
  if (reduceMotion() || !text) return
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
