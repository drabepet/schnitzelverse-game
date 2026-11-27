import { useEffect, useRef, useState } from 'react'
import { fmt } from '../engine/format'
import { explainMod, type ModKey } from '../engine/rules'
import { useGame } from '../game/store'

/** "×1.25" or "×0.56"; cooling below 1 is good, so it reads as "−44%". */
function show(mult: number, lowerIsBetter: boolean): string {
  if (lowerIsBetter) return `${Math.round((mult - 1) * 100)}%`
  return `×${fmt(mult, 2)}`
}

/**
 * A small ⓘ next to a number. Hovering it shows everything multiplying that number; clicking
 * keeps the list open until you click elsewhere (or press Esc). `base` is shown first when the
 * number has one (e.g. a place's base price).
 */
export function Why({ k, label, base }: { k: ModKey; label: string; base?: string }) {
  const { state } = useGame()
  // 'hover' closes when the pointer leaves; 'pinned' (after a click) stays until a click elsewhere.
  const [open, setOpen] = useState<false | 'hover' | 'pinned'>(false)
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

  const factors = open ? explainMod(state, k) : []
  const total = factors.reduce((t, f) => t * f.mult, 1)
  const lower = k === 'cooling'

  return (
    <span
      className="why"
      ref={ref}
      onMouseEnter={() => setOpen((o) => o || 'hover')}
      onMouseLeave={() => setOpen((o) => (o === 'hover' ? false : o))}
    >
      <button
        className="why-btn"
        aria-expanded={!!open}
        aria-label={`What makes up: ${label}`}
        onClick={() => setOpen((o) => (o === 'pinned' ? false : 'pinned'))}
      >
        ⓘ
      </button>
      {open && (
        <span className="why-pop" role="dialog" aria-label={label}>
          <b>{label}</b>
          {base && (
            <span className="why-row">
              <span>Base</span>
              <span>{base}</span>
            </span>
          )}
          {factors.length === 0 && <span className="muted">Nothing multiplies it yet. Anything that does will be listed here.</span>}
          {factors.length > 0 && <span className="muted small">{base ? 'Multiplied by:' : 'Everything that multiplies it:'}</span>}
          {factors.map((f) => (
            <span key={f.name} className="why-row">
              <span>
                {f.emoji} {f.name}
              </span>
              <span>{show(f.mult, lower)}</span>
            </span>
          ))}
          {factors.length > 1 && (
            <span className="why-row why-total">
              <span>Together</span>
              <span>{show(total, lower)}</span>
            </span>
          )}
        </span>
      )}
    </span>
  )
}
