import { CHAPTER2_FRANCHISES, INGREDIENT_IDS, ITEMS, SHOP } from '../engine/content'
import { fmt, fmtInt, fmtMoney } from '../engine/format'
import { QUICK_RESTOCK_BELOW, buyIngredient, quickRestock, setAutoBuy } from '../engine/actions'
import { chapter2Unlocked, getMods, packSize, shelfMax, shopSupplyRate, supplyNeeds } from '../engine/rules'
import { useGame } from '../game/store'
import { HintButton } from './HintButton'
import { firstReason, needMoney } from './reasons'
import { guideHint } from './guide'
import { floatText } from './juice'

/**
 * The corner shop. On the Garage tab it is the main supply; once the farm
 * exists it lives on the Farm tab as backup (`backup`).
 */
export function SupplyPanel({ backup = false }: { backup?: boolean }) {
  const game = useGame()
  const s = game.state
  const mods = getMods(s)
  const shelf = shelfMax(mods)
  const supply = fmt(shopSupplyRate(mods))
  const kitchenUse = supplyNeeds(s, mods).meat ?? 0
  const low = INGREDIENT_IDS.filter((i) => s.items[i].lt(QUICK_RESTOCK_BELOW))
  const canRestock = low.some((i) => s.money.gte(SHOP[i].packPrice) && s.shelves[i].gte(packSize(i, mods)))
  const restockWhyNot = !low.length
    ? `Nothing is running low: every ingredient has ${QUICK_RESTOCK_BELOW} or more.`
    : low.every((i) => s.money.lt(SHOP[i].packPrice))
      ? 'Not enough money for a pack.'
      : 'Mrs. Horáková’s shelves are empty for now; her van is on the way.'

  return (
    <section className="panel panel-supply">
      <div className="panel-head">
        <h2>{backup ? '🛒 Corner shop (backup)' : '🛒 Supply'}</h2>
        {/* Once Auntie's shopping list is bought she restocks by herself: no button needed. */}
        {!mods.autoBuy && (
          <HintButton
            className={guideHint(s)?.target === 'restock' ? 'pulse' : ''}
            title="Restock"
            explain={`Buys one pack of every ingredient below ${QUICK_RESTOCK_BELOW}. Auntie’s shopping list does this for you, all the time.`}
            whyNot={canRestock ? null : restockWhyNot}
            onClick={(e) => {
              if (game.act((st) => quickRestock(st))) floatText(e, '+🛒')
            }}
          >
            🛒 Restock
          </HintButton>
        )}
      </div>
      <p className="hint">
        {backup
          ? `Your farm comes first. Mrs. Horáková covers the rest, up to ${supply} of each ingredient per second. Auntie’s stock target below is also what the farm fills to.`
          : `Mrs. Horáková’s corner shop round the block. Her van brings ${supply} of each ingredient per second, no more. Your kitchen uses up to ${fmt(kitchenUse)}/s.`}
      </p>
      {!backup && !chapter2Unlocked(s) && (
        <p className={`farm-countdown ${kitchenUse > shopSupplyRate(mods) * 0.8 ? 'warn' : 'muted'}`}>
          🚜 Grandpa’s farm opens after {CHAPTER2_FRANCHISES} franchises (you have {s.prestige.franchises}).{' '}
          {s.prestige.franchises === 0
            ? s.prestige.unlocked
              ? 'You can sell now in the ✨ Franchise tab, then reach the whole town once more.'
              : 'Reach the whole town to unlock franchising, sell, then do it once more.'
            : 'Reach the whole town and sell once more.'}{' '}
          Until then, the bigger van and the wholesale card in Equipment let the shop keep up.
        </p>
      )}

      <ul className="rows">
        {INGREDIENT_IDS.map((id) => {
          const offer = SHOP[id]
          const size = packSize(id, mods)
          return (
            <li key={id} className="row">
              <span className="emoji">{ITEMS[id].emoji}</span>
              <div className="row-main">
                <div className="row-title">
                  {ITEMS[id].name} <span className="count">{fmtInt(s.items[id])}</span>
                </div>
                <div className="row-sub">
                  {offer.packName} · {fmtInt(size)} for {fmtMoney(offer.packPrice)}
                  {(backup || s.shelves[id].lt(shelf.div(2))) && (
                    <span className={s.shelves[id].lt(size) ? 'warn' : ''}>
                      {' '}
                      · shop has {fmtInt(s.shelves[id])} left
                    </span>
                  )}
                </div>
              </div>
              <div className="btns">
                <HintButton
                  whyNot={firstReason(
                    needMoney(s, offer.packPrice, game.rates.income),
                    s.shelves[id].lt(size) && 'Mrs. Horáková’s shelf is empty for now; her van is on the way.',
                  )}
                  onClick={() => game.act((st) => buyIngredient(st, id, 1))}
                >
                  Buy
                </HintButton>
                <HintButton
                  className="ghost"
                  whyNot={firstReason(
                    needMoney(s, offer.packPrice * 10, game.rates.income),
                    s.shelves[id].lt(size.mul(10)) && `The shop has only ${fmtInt(s.shelves[id])} left, not enough for 10 packs.`,
                  )}
                  onClick={() => game.act((st) => buyIngredient(st, id, 10))}
                >
                  ×10
                </HintButton>
              </div>
            </li>
          )
        })}
      </ul>

      {mods.autoBuy && (
        <div className="automation">
          <label className="automation-title">
            <input
              type="checkbox"
              checked={s.autoBuy.enabled}
              onChange={(e) => game.act((st) => setAutoBuy(st, e.target.checked, st.autoBuy.target))}
            />
            📝 Auntie's shopping list
          </label>
          <label className="setting">
            Restock each ingredient to
            <input
              type="number"
              min={0}
              step={10}
              value={s.autoBuy.target}
              onChange={(e) => game.act((st) => setAutoBuy(st, st.autoBuy.enabled, Number(e.target.value)))}
            />
          </label>
          <label
            className="setting"
            title="Auntie won't spend below this, so there is money left to hire. If an ingredient runs out completely she still buys one pack."
          >
            Always keep at least $
            <input
              type="number"
              min={0}
              step={25}
              value={s.autoBuy.reserve}
              onChange={(e) =>
                game.act((st) => setAutoBuy(st, st.autoBuy.enabled, st.autoBuy.target, Number(e.target.value)))
              }
            />
          </label>
        </div>
      )}
    </section>
  )
}
