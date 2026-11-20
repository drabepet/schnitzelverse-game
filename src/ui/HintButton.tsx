import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Pop-up width at the normal interface size (15px text). */
const POP_WIDTH = 260

/**
 * A button with a pop-up on hover: what it does, and (when greyed out) why it
 * can't be used right now. The pop-up is placed against the window, so a
 * scrolling panel can't clip it, appears after a short hover so quick clicking
 * doesn't flash it, and never blocks clicks.
 */
export function HintButton(props: {
  children: ReactNode
  /** Pop-up heading and text; optional: a plain button only explains why it's greyed out. */
  title?: string
  explain?: string
  /** Why it's greyed out right now; null when it can be used. */
  whyNot: string | null
  className?: string
  /** Native tooltip, for buttons whose label is only an icon or a price. */
  ariaTitle?: string
  onClick: (e: React.MouseEvent) => void
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const show = () => {
    window.clearTimeout(timer.current)
    if (!props.explain && !props.whyNot) return
    timer.current = window.setTimeout(() => {
      const r = ref.current?.getBoundingClientRect()
      if (!r) return
      // The pop-up grows with the interface size (Settings), like everything else.
      const width = POP_WIDTH * (parseFloat(getComputedStyle(document.documentElement).fontSize) / 15)
      const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8)
      setPos({ top: r.bottom + 6, left, width })
    }, 500)
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    setPos(null)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <span ref={ref} className="hint-btn" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      <button className={props.className} disabled={props.whyNot !== null} onClick={props.onClick} title={props.ariaTitle}>
        {props.children}
      </button>
      {pos && (
        <span className="hint-pop" role="tooltip" style={{ top: pos.top, left: pos.left, width: pos.width }}>
          {props.title && <b>{props.title}</b>}
          {props.explain && <span>{props.explain}</span>}
          {props.whyNot && <span className="warn small">{props.explain ? 'Right now: ' : ''}{props.whyNot}</span>}
        </span>
      )}
    </span>
  )
}
