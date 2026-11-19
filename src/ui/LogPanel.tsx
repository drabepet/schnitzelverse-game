import { fmtTime } from '../engine/format'
import { useGame } from '../game/store'

export function LogPanel() {
  const { state } = useGame()
  return (
    <section className="panel panel-log log">
      <h2>💬 Garage chatter</h2>
      <ul>
        {state.log.map((e, i) => (
          <li key={`${e.t}-${i}`}>
            <span className="muted">{fmtTime(e.t)}</span> {e.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
