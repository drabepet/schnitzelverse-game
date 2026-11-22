import { MOOD_TEXT, type ManagerMood } from './managerStatus'

/** The colours of the managers' dots, in the order a manager moves through them. */
const MOODS: { mood: ManagerMood; short: string }[] = [
  { mood: 'busy', short: 'just bought' },
  { mood: 'saving', short: 'saving up' },
  { mood: 'idle', short: 'nothing to do' },
  { mood: 'off', short: 'off' },
]

/** One manager's status dot, inline with text. */
export function MoodDot({ mood }: { mood: ManagerMood }) {
  return <span className={`mood-dot ${mood}`} aria-hidden />
}

/** What the dot colours mean (sidebar pop-up and the family at work). */
export function MoodLegend() {
  return (
    <span className="mood-legend" aria-label={MOODS.map((m) => `${m.mood}: ${MOOD_TEXT[m.mood]}`).join(', ')}>
      {MOODS.map((m) => (
        <span key={m.mood}>
          <MoodDot mood={m.mood} />
          {m.short}
        </span>
      ))}
    </span>
  )
}
