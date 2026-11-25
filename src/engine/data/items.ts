// Ingredients, the things the kitchen makes, and the corner shop.

// ---------------------------------------------------------------- items

export type IngredientId = 'meat' | 'flour' | 'eggs' | 'crumbs' | 'oil'
export type IntermediateId = 'cutlet' | 'breaded' | 'hot' | 'cold'
/** Raw farm goods (Chapter 2). */
export type FarmGoodId = 'wheat' | 'seeds' | 'pigs'
/** Star paprika (Chapters 4–5): fuel for long space trips, never an ingredient (see FUEL_PER_SCHNITZEL). */
export type FuelId = 'pods' | 'fold' | 'deepFold'
export type ItemId = IngredientId | IntermediateId | FarmGoodId | FuelId

export const INGREDIENT_IDS: IngredientId[] = ['meat', 'flour', 'eggs', 'crumbs', 'oil']
export const FARM_GOOD_IDS: FarmGoodId[] = ['wheat', 'seeds', 'pigs']
/** What ships burn: fold paprika past the Moon, deep-fold paprika past the Sun. */
export const FUEL_IDS = ['fold', 'deepFold'] as const satisfies readonly FuelId[]
export type ShipFuelId = (typeof FUEL_IDS)[number]
export const ITEM_IDS: ItemId[] = [...INGREDIENT_IDS, 'cutlet', 'breaded', 'hot', 'cold', ...FARM_GOOD_IDS, 'pods', 'fold', 'deepFold']

export interface ItemMeta {
  name: string
  emoji: string
}

export const ITEMS: Record<ItemId, ItemMeta> = {
  meat: { name: 'Pork loin', emoji: '🥩' },
  flour: { name: 'Flour', emoji: '🫙' },
  eggs: { name: 'Eggs', emoji: '🥚' },
  crumbs: { name: 'Breadcrumbs', emoji: '🥖' },
  oil: { name: 'Frying oil', emoji: '🫗' },
  cutlet: { name: 'Pounded cutlets', emoji: '🫓' },
  breaded: { name: 'Breaded cutlets', emoji: '🍘' },
  hot: { name: 'Hot schnitzel', emoji: '🔥' },
  cold: { name: 'Cold schnitzel', emoji: '🧊' },
  wheat: { name: 'Wheat', emoji: '🌾' },
  seeds: { name: 'Sunflower seeds', emoji: '🌻' },
  pigs: { name: 'Pigs', emoji: '🐖' },
  pods: { name: 'Star paprika pods', emoji: '🌶️' },
  fold: { name: 'Fold paprika', emoji: '⛽' },
  deepFold: { name: 'Deep-fold paprika', emoji: '🌌' },
}

export interface ShopOffer {
  item: IngredientId
  packName: string
  packSize: number
  packPrice: number
}

/** The corner shop: the only ingredient source in the garage phase. */
export const SHOP: Record<IngredientId, ShopOffer> = {
  meat: { item: 'meat', packName: 'tray of 4 slices', packSize: 4, packPrice: 6 },
  flour: { item: 'flour', packName: 'bag', packSize: 20, packPrice: 2 },
  eggs: { item: 'eggs', packName: 'box of 10', packSize: 10, packPrice: 3 },
  crumbs: { item: 'crumbs', packName: 'bag', packSize: 15, packPrice: 2 },
  oil: { item: 'oil', packName: 'bottle', packSize: 10, packPrice: 4 },
}
