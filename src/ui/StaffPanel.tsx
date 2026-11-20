import { HELPER_RANGE_KM, STAGES, WORKERS } from '../engine/content'
import { fmt } from '../engine/format'
import { hireWorker } from '../engine/actions'
import { getMods, isTeased, workerPlan } from '../engine/rules'
import { HintButton } from './HintButton'
import { firstReason, needMoney, needRequirement } from './reasons'
import { useGame } from '../game/store'
import { BuyLabel, PanelHead } from './BuyAmount'
import { Why } from './Why'
import { guideHint } from './guide'
import { staffTitle, workerLook } from '../engine/names'
import { tierLevel } from '../engine/tiers'

/** Helpers for the kitchen (`making`) or for delivery (`distribution`). */
export function StaffPanel({ pillar }: { pillar: 'making' | 'distribution' }) {
  const game = useGame()
  const s = game.state
  const mods = getMods(s)
  const mine = WORKERS.filter((w) => (w.task === 'deliver') === (pillar === 'distribution'))

  return (
    <section className="panel panel-staff">
      <PanelHead>{staffTitle(s, pillar)}</PanelHead>
      <p className="hint">
        {pillar === 'making'
          ? tierLevel(s, 'making') >= 2
            ? 'The family runs the place now (see Managers in Franchise); the staff does the work, also while you’re away.'
            : 'Automation, family edition: every helper works while you’re away.'
          : `They reach up to ${HELPER_RANGE_KM} km. Further than that needs the fleet.`}
      </p>
      <ul className="rows">
        {mine.filter((w) => isTeased(s, w.requires)).map((w) => {
          const what = w.task === 'deliver' ? 'deliveries' : STAGES[w.task].name.toLowerCase()
          const plan = workerPlan(s, w.id)
          const look = workerLook(s, w.id)
          return (
            <li key={w.id} className="row">
              <span className="emoji">{look.emoji}</span>
              <div className="row-main">
                <div className="row-title">
                  {look.name} <span className="count">×{s.workers[w.id]}</span>
                </div>
                <div className="row-sub">
                  {fmt(w.rate * mods.speed[w.task])}/s {what} each
                  <Why k={w.task} label={`${look.name} speed`} base={`${fmt(w.rate)}/s`} /> · <i>{look.flavor}</i>
                </div>
                {look.name !== look.original && <div className="row-sub muted small">Started out as: {look.original}</div>}
              </div>
              <HintButton
                whyNot={firstReason(needRequirement(s, w.requires), needMoney(s, plan.cost, game.rates.income))}
                className={`buy-btn ${guideHint(s)?.target === 'hire' && w.id === 'uncle' ? 'pulse' : ''}`}
                onClick={() => game.act((st) => hireWorker(st, w.id, st.settings.buyAmount))}
              >
                <BuyLabel verb="Hire" plan={plan} />
              </HintButton>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
