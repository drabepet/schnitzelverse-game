import { useEffect, useRef, useState } from 'react'
import { fmtMoney, fmtTime } from '../engine/format'
import { useGame } from '../game/store'

const H = 200
const PAD = { left: 66, right: 12, top: 10, bottom: 24 }

/**
 * Income per second over play time (log scale, since it grows by orders of
 * magnitude). Dashed lines mark franchises. Hover for the exact value.
 */
export function IncomeChart() {
  const { state } = useGame()
  const [hover, setHover] = useState<number | null>(null)
  // Draw at the real pixel width, so labels stay readable on phones.
  const wrap = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(600)
  const ready = state.history.points.length >= 2
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setW(Math.max(260, Math.round(entry.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ready])
  const points = state.history.points
  if (points.length < 2) {
    return (
      <section className="panel">
        <h2>📈 Income</h2>
        <p className="hint">The chart starts after a couple of minutes of play.</p>
      </section>
    )
  }

  const t0 = points[0].t
  const t1 = points[points.length - 1].t
  const logs = points.map((p) => Math.log10(Math.max(p.income, 0.01)))
  const lo = Math.floor(Math.min(...logs))
  const hi = Math.max(lo + 1, Math.ceil(Math.max(...logs)))
  const x = (t: number) => PAD.left + ((t - t0) / Math.max(1, t1 - t0)) * (W - PAD.left - PAD.right)
  const y = (log: number) => PAD.top + (1 - (log - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom)
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(logs[i]).toFixed(1)}`).join('')
  const area = `${line}L${x(t1).toFixed(1)},${y(lo)}L${x(t0).toFixed(1)},${y(lo)}Z`
  // Powers of ten, thinned out so at most ~5 labels show.
  const every = Math.ceil((hi - lo) / 5)
  const ticks = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((v) => (v - lo) % every === 0)
  const franchises = points.filter((p, i) => i > 0 && p.f > points[i - 1].f)

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - box.left) / box.width) * W
    let best = 0
    for (let i = 1; i < points.length; i++) if (Math.abs(x(points[i].t) - px) < Math.abs(x(points[best].t) - px)) best = i
    setHover(best)
  }
  const h = hover === null ? null : points[hover]

  return (
    <section className="panel income-chart">
      <h2>📈 Income per second</h2>
      <p className="hint">
        Now <b>{fmtMoney(points[points.length - 1].income)}/s</b> · best ever <b>{fmtMoney(state.stats.bestIncome)}/s</b>. The last{' '}
        {fmtTime(t1 - t0)} of play, on a log scale: each line up is ten times more. Dashed lines are franchises.
      </p>
      <div className="chart-wrap" ref={wrap}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Income per second, now ${fmtMoney(points[points.length - 1].income)}`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((v) => (
            <g key={v}>
              <line className="grid" x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} />
              <text className="axis" x={PAD.left - 6} y={y(v) + 4} textAnchor="end">
                {fmtMoney(10 ** v)}
              </text>
            </g>
          ))}
          {franchises.map((p) => (
            <line key={p.t} className="franchise-mark" x1={x(p.t)} x2={x(p.t)} y1={PAD.top} y2={H - PAD.bottom} />
          ))}
          <path className="area" d={area} />
          <path className="line" d={line} />
          <text className="axis" x={PAD.left} y={H - 6}>
            {fmtTime(t0)}
          </text>
          <text className="axis" x={W - PAD.right} y={H - 6} textAnchor="end">
            {fmtTime(t1)} played
          </text>
          {h && hover !== null && (
            <g>
              <line className="crosshair" x1={x(h.t)} x2={x(h.t)} y1={PAD.top} y2={H - PAD.bottom} />
              <circle className="dot" cx={x(h.t)} cy={y(logs[hover])} r={4} />
            </g>
          )}
        </svg>
        {h && hover !== null && (
          <div
            className="chart-tip"
            style={{ left: `${(x(h.t) / W) * 100}%`, transform: `translateX(${x(h.t) > W / 2 ? '-105%' : '5%'})` }}
          >
            <b>{fmtMoney(h.income)}/s</b>
            <span className="muted">
              at {fmtTime(h.t)} · run #{h.f + 1}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
