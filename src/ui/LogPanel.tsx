import { fmtTime } from '../engine/format'
import { useGame } from '../game/store'

/** “Grandma: “…”” → the speaker and what they said; other lines have no speaker. */
function speaker(line: string): { who: string | null; said: string } {
  const m = /^([^:“]{1,40}): (“.*)$/.exec(line)
  return m ? { who: m[1], said: m[2] } : { who: null, said: line }
}

/**
 * Records → the family chronicle: what happened, newest first, with what the
 * family said about it (from space on, mission control on the radio).
 */
export function LogPanel() {
  const { state } = useGame()
  return (
    <section className="panel panel-log log">
      <h2>📖 Family chronicle</h2>
      <ul>
        {state.log.map((e, i) => {
          const [first, ...replies] = e.text.split('\n')
          return (
            <li key={`${e.t}-${i}`}>
              <span className="muted">{fmtTime(e.t)}</span> {first}
              {replies.map((r, j) => {
                const { who, said } = speaker(r)
                return (
                  <span key={j} className={`chronicle-line${r.startsWith('📡') ? ' radio' : ''}`}>
                    {who && <b>{who}: </b>}
                    {said}
                  </span>
                )
              })}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
