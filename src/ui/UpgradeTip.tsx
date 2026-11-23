import type { ReactNode } from 'react'
import type { UpgradeDef } from '../engine/content'
import { describeEffect } from '../engine/describe'
import { useGame } from '../game/store'

/** Exactly what an upgrade changes, one line per effect. */
export function EffectLines({ u }: { u: UpgradeDef }) {
  const { state } = useGame()
  return (
    <ul className="effect-lines">
      {u.effects.map((e, i) => (
        <li key={i}>{describeEffect(e, state)}</li>
      ))}
    </ul>
  )
}

/**
 * The pop-up of an upgrade chip or row: its name (or `title`), its
 * description (or `note`) and what it changes. Goes inside a `.tip` element.
 */
export function UpgradeTip({ u, title, note }: { u: UpgradeDef; title?: ReactNode; note?: ReactNode }) {
  return (
    <span className="tip-pop" role="tooltip">
      <b>{title ?? `${u.emoji} ${u.name}`}</b>
      <span className="muted">{note ?? u.description}</span>
      <EffectLines u={u} />
    </span>
  )
}
