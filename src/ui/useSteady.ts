import { useEffect, useRef, useState } from 'react'

/** How long a live message stays put before it may change (ms). */
export const STEADY_MS = 3000

/**
 * A value that changes at most once every `ms`: for status lines and hints
 * whose condition hovers around a threshold, so they don't blink on and off
 * (or flip between texts) several times a second. The first change after a
 * calm spell shows at once; a quick flip back waits its turn, and is dropped
 * if the value returns to what's shown meanwhile.
 */
export function useSteady<T>(value: T, ms = STEADY_MS): T {
  const [shown, setShown] = useState(value)
  const changedAt = useRef(-Infinity)
  useEffect(() => {
    if (Object.is(value, shown)) return
    const wait = Math.max(0, changedAt.current + ms - performance.now())
    const timer = window.setTimeout(() => {
      changedAt.current = performance.now()
      setShown(value)
    }, wait)
    return () => window.clearTimeout(timer)
  }, [value, shown, ms])
  return shown
}
