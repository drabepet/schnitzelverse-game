import { MANAGERS, familyNextStep, farmNextStep, managerActive, savingStatus, setManager } from '../engine/automation'
import { fmtMoney, fmtTime } from '../engine/format'
import { perkLevel } from '../engine/rules'
import { useGame } from '../game/store'

/** On/off chips for the managers you own, and what they are saving for. */
export function ManagerToggles({ compact = false, statusOnly = false }: { compact?: boolean; statusOnly?: boolean }) {
  const game = useGame()
  const s = game.state
  const owned = MANAGERS.filter((m) => perkLevel(s, m.id) > 0)
  if (!owned.length) return null
  const saving = savingStatus(s)
  const family = managerActive(s, 'familyManager') && !saving ? familyNextStep(s) : null
  const farm = managerActive(s, 'farmManager') && !saving ? farmNextStep(s) : null
  return (
    <div className="managers">
      {!statusOnly && (
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
      )}
      {family?.kind === 'wait' && (
        <div className="muted small">
          👵 Grandma is saving for {family.upgrade.emoji} {family.upgrade.name.toLowerCase()} ({fmtMoney(family.remaining)} to
          go) instead of hiring more: it does more per dollar.
        </div>
      )}
      {farm?.kind === 'wait' && (
        <div className="muted small">
          👴 Grandpa is saving for {farm.upgrade.emoji} {farm.upgrade.name.toLowerCase()} ({fmtMoney(farm.remaining)} to go)
          instead of building more: it does more per dollar.
        </div>
      )}
      {saving && (
        <div className="muted small">
          🐷 Mum asked the others to wait: saving for {saving.region.emoji} {saving.region.name.toLowerCase()},{' '}
          {fmtMoney(saving.remaining)} to go (about {fmtTime(saving.eta)}).
        </div>
      )}
    </div>
  )
}
