import { useEffect, useRef, useState } from 'react'
import { PAPRIKA_LEGEND } from '../engine/content'

/** A 📜 button that opens the legend of star paprika (closed until you ask). */
export function PaprikaStory() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <span className="why story" ref={ref}>
      <button className="small-btn ghost" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        📜 The legend
      </button>
      {open && (
        <span className="why-pop story-pop" role="dialog" aria-label={PAPRIKA_LEGEND.title}>
          <b>{PAPRIKA_LEGEND.title}</b>
          {PAPRIKA_LEGEND.paragraphs.map((p) => (
            <span key={p.slice(0, 20)} className="story-p">
              {p}
            </span>
          ))}
        </span>
      )}
    </span>
  )
}
