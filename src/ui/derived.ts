// Numbers several panels need every frame, computed once per frame (see
// perFrame) instead of once per component: the farm's supply and the
// kitchen's needs, and what each manager is up to.
import type { ItemId } from '../engine/content'
import { familyNextStep, farmNextStep, savingStatus } from '../engine/automation'
import { farmSupply, getMods, supplyNeeds } from '../engine/rules'
import { perFrame } from './perFrame'

/** What the kitchen (and each farm processor) needs per second, per item. */
export const needsNow = perFrame((s) => supplyNeeds(s, getMods(s)))

/** What the farm can make per second of an item (each item worked out once per frame, when first asked). */
export const farmSupplyNow = perFrame((s) => {
  const mods = getMods(s)
  const known = new Map<ItemId, number>()
  return (item: ItemId): number => {
    let v = known.get(item)
    if (v === undefined) {
      v = farmSupply(s, item, mods)
      known.set(item, v)
    }
    return v
  }
})

/** The place Mum is saving for (and how long it takes), if any. */
export const savingNow = perFrame(savingStatus)
/** Grandma's next move. */
export const familyStepNow = perFrame(familyNextStep)
/** Grandpa's next move. */
export const farmStepNow = perFrame(farmNextStep)
