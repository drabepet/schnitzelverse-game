import type { ReactNode } from 'react'
import { setBuyAmount } from '../engine/actions'
import { fmtMoneyShort } from '../engine/format'
import type { BulkPlan } from '../engine/rules'
import type { BuyAmount } from '../engine/state'
import { useGame } from '../game/store'

const OPTIONS: { value: BuyAmount; label: string }[] = [
  { value: 1, label: '×1' },
  { value: 10, label: '×10' },
  { value: 'max', label: 'Max' },
]

/** ×1 / ×10 / Max, shared by every panel where you buy things by the dozen. */
export function BuyAmountPicker() {
  const game = useGame()
  const current = game.state.settings.buyAmount
  return (
    <div className="buy-amount" role="radiogroup" aria-label="How many to buy">
      {OPTIONS.map((o) => (
        <button
          key={String(o.value)}
          role="radio"
          aria-checked={current === o.value}
          className={current === o.value ? 'on' : ''}
          onClick={() => game.act((st) => setBuyAmount(st, o.value))}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** A panel title with the buy-amount picker on the right. */
export function PanelHead({ children }: { children: ReactNode }) {
  return (
    <div className="panel-head">
      <h2>{children}</h2>
      <BuyAmountPicker />
    </div>
  )
}

/**
 * Two fixed lines, "Hire ×10" over the price, so switching between ×1, ×10
 * and Max never changes the button's shape (or the panel's layout).
 */
export function BuyLabel({ verb, plan }: { verb: string; plan: BulkPlan }) {
  return (
    <>
      <span className="buy-verb">
        {verb} ×{plan.count}
      </span>
      <span className="buy-price">{fmtMoneyShort(plan.cost)}</span>
    </>
  )
}
