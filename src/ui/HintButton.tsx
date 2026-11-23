import { useRef, type CSSProperties, type ReactNode } from 'react'
import { usePinnedPopup } from './usePinnedPopup'

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
  /**
   * How close you are to affording it (0..1), drawn as a fill inside the
   * greyed-out button. Pass it only when money (or crumbs) is all that's missing.
   */
  progress?: number
  onClick: (e: React.MouseEvent) => void
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const popup = usePinnedPopup<true>({ width: POP_WIDTH, delay: 500, gap: 6 })
  const pos = popup.pos
  const show = () => {
    if (!props.explain && !props.whyNot) return popup.hide()
    popup.show(true, ref.current)
  }
  const hide = popup.hide
  const fill = props.whyNot !== null && props.progress !== undefined ? Math.min(1, Math.max(0, props.progress)) : undefined

  return (
    <span ref={ref} className="hint-btn" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      <button
        className={fill === undefined ? props.className : `${props.className ?? ''} afford`}
        style={fill === undefined ? undefined : ({ '--afford': fill } as CSSProperties)}
        disabled={props.whyNot !== null}
        onClick={props.onClick}
        title={props.ariaTitle}
      >
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
