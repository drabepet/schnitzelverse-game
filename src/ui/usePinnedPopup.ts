import { useEffect, useRef, useState } from 'react'

/** Where a pinned pop-up goes (window coordinates), and which anchor opened it. */
export interface PopupPos<K> {
  key: K
  top: number
  left: number
  width: number
}

/**
 * A pop-up pinned to the window under an element, after a short hover: a
 * scrolling panel can't clip it and quick clicking doesn't flash it. `width`
 * is at the normal interface size (15px text) and grows with it; the pop-up
 * stays 8px inside the window.
 */
export function usePinnedPopup<K>({ width, delay, gap }: { width: number; delay: number; gap: number }) {
  const [pos, setPos] = useState<PopupPos<K> | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const show = (key: K, el: Element | null | undefined) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const r = el?.getBoundingClientRect()
      if (!r) return
      const w = width * (parseFloat(getComputedStyle(document.documentElement).fontSize) / 15)
      const left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8)
      setPos({ key, top: r.bottom + gap, left, width: w })
    }, delay)
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    setPos(null)
  }
  return { pos, show, hide }
}
