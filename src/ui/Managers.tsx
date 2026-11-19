import { MANAGERS, managerActive, savingFor, setManager } from '../engine/automation'
import { perkLevel } from '../engine/rules'
import { useGame } from '../game/store'

/** On/off chips for the managers you own, and what they are saving for. */
export function ManagerToggles({ compact = false }: { compact?: boolean }) {
  const game = useGame()
  const s = game.state
  const owned = MANAGERS.filter((m) => perkLevel(s, m.id) > 0)
  if (!owned.length) return null
  const saving = savingFor(s)
  return (
    <div className="managers">
      <div className="manager-chips">
        {owned.map((m) => {
          const on = managerActive(s, m.id)
          return (
            <button
              key={m.id}
              className={`mgr-chip ${on ? 'on' : ''}`}
              aria-pressed={on}
              title={`${m.name}: ${on ? 'working' : 'off'}. ${m.description}`}
              onClick={() => game.act((st) => setManager(st, m.id, !on))}
            >
              {m.emoji}
              {!compact && ` ${m.name}`}
              <span className="mgr-state">{on ? 'on' : 'off'}</span>
            </button>
          )
        })}
      </div>
      {saving && (
        <div className="muted small">
          🐷 Saving up for {saving.emoji} {saving.name.toLowerCase()}
        </div>
      )}
    </div>
  )
}
