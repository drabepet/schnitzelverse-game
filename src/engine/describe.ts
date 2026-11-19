// Plain-language lines for what an effect does, for equipment and perk tooltips.
import { FACILITIES, STAGES, WORKERS, type Effect, type FacilityGroup, type Task } from './content'
import { facilityLook, workerLook } from './names'
import type { GameState } from './state'

const GROUP_NAMES: Record<FacilityGroup, string> = {
  field: 'Fields',
  animal: 'Animals',
  processor: 'Processing',
}

const times = (m: number) => `×${Number.isInteger(m) ? m : m.toFixed(2).replace(/0$/, '')}`

function taskName(task: Task, state?: GameState): string {
  const who = WORKERS.filter((w) => w.task === task)
    .map((w) => (state ? workerLook(state, w.id) : w))
    .map((w) => `${w.emoji} ${w.name}`)
    .join(', ')
  if (task === 'deliver') return `Delivery by helpers (${who}) and your own deliveries`
  return `${STAGES[task].emoji} ${STAGES[task].name}ing (${who}) and your own clicks`
}

/** One readable line per effect, naming exactly what it changes (by today's names, given a state). */
export function describeEffect(e: Effect, state?: GameState): string {
  switch (e.kind) {
    case 'speed':
      return `${taskName(e.task, state)} ${times(e.mult)} faster`
    case 'kitchen':
      return `Every kitchen step (🔨 pound, 🥣 bread, 🍳 fry) ${times(e.mult)} faster`
    case 'click':
      return `Your own clicks do ${times(e.mult)} as much`
    case 'cooling':
      return `Hot schnitzel cools ${Math.round((1 - e.mult) * 100)}% slower, so more arrive hot`
    case 'packSize':
      return `Corner-shop packs ${times(e.mult)} bigger for the same price`
    case 'price':
      return `Every place pays ${times(e.mult)} per schnitzel`
    case 'orders':
      return `Every place orders ${times(e.mult)} as often`
    case 'reputation':
      return `Reputation from each schnitzel ${times(e.mult)}`
    case 'autoBuy':
      return 'Auntie restocks ingredients by herself (target and reserve in the shop panel)'
    case 'facility': {
      const buildings = FACILITIES.filter((f) => f.group === e.group)
        .map((f) => (state ? facilityLook(state, f.id) : f))
        .map((f) => `${f.emoji} ${f.name}`)
        .join(', ')
      return `${GROUP_NAMES[e.group]}: ${buildings} work ${times(e.mult)} faster`
    }
    case 'fleet':
      return `Every vehicle carries ${times(e.mult)} as much`
    case 'shopSupply':
      return `The corner shop can sell ${times(e.mult)} as much of each ingredient per second`
    case 'crisp':
      return `Crispness skill +${e.add} (crisper schnitzel sells for more)`
  }
}
