// The first minutes: one short hint at a time, until Auntie's shopping list is bought.
import { WORKERS } from '../engine/content'
import { workerCost } from '../engine/rules'
import type { GameState } from '../engine/state'
import { currentTier, type Pillar } from '../engine/tiers'

export type GuideTarget = 'cook' | 'deliver' | 'restock' | 'hire' | 'shoppingList'

export interface Hint {
  text: string
  /** Which button to draw attention to (it pulses in its panel). */
  target: GuideTarget
}

export function guideHint(s: GameState): Hint | null {
  const hired = WORKERS.some((w) => s.workers[w.id] > 0)
  if (s.prestige.franchises > 0 || (hired && s.upgrades.shoppingList)) return null
  const stock = s.items.hot.add(s.items.cold)
  // Tabs are named after how far you've come: name them as they read right now.
  const tab = (p: Pillar) => `${currentTier(s, p).emoji} ${currentTier(s, p).name}`
  if (s.stats.served.lt(1)) {
    if (stock.gte(1)) return { text: `Hot and golden! Deliver it to the neighbours in the ${tab('distribution')} tab.`, target: 'deliver' }
    if (s.items.breaded.gte(1)) return { text: `Now fry it golden (${tab('making')} tab).`, target: 'cook' }
    if (s.items.cutlet.gte(1)) return { text: `Bread it: flour, egg, crumbs (${tab('making')} tab).`, target: 'cook' }
    return {
      text: `Your first schnitzel: in the ${tab('making')} tab press Cook all three, or Pound, Bread and Fry one by one.`,
      target: 'cook',
    }
  }
  // First Auntie's shopping list (restocking runs itself), then the first helper.
  if (!s.upgrades.shoppingList) {
    if (s.money.gte(60) && s.reputation.gte(10)) {
      return { text: 'Buy Auntie’s shopping list in the 🛒 Corner shop tab: she restocks for you. Best $60 you’ll ever spend.', target: 'shoppingList' }
    }
    if (s.stats.served.gte(3)) {
      return { text: 'Next goal: $60 for Auntie’s shopping list (🛒 Corner shop tab). Then restocking runs itself.', target: 'shoppingList' }
    }
  } else if (!hired && s.money.gte(workerCost(s, 'uncle'))) {
    return { text: 'You can afford help! Hire Uncle with a mallet in the 🏚️ Garage tab: family works even while you’re away.', target: 'hire' }
  }
  if (s.items.meat.lt(1) || s.items.oil.lt(1)) {
    return { text: `Running low: Restock in the ${tab('prep')} tab buys a pack of what’s missing.`, target: 'restock' }
  }
  const goal = s.upgrades.shoppingList ? 'your first helper' : 'Auntie’s shopping list'
  if (stock.gte(1)) return { text: `Deliver, cook, repeat. Save up for ${goal}.`, target: 'deliver' }
  return { text: `Cook, deliver, repeat. Save up for ${goal}.`, target: 'cook' }
}
