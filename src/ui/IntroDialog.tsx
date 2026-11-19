import { setIntroSeen } from '../engine/actions'
import { useGame } from '../game/store'

/** The welcome screen: a little story, how the game works, and how to start. */
export function IntroDialog() {
  const game = useGame()
  if (game.state.introSeen) return null
  const close = () => game.act((st) => setIntroSeen(st, true))

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="dialog intro">
        <h2 id="intro-title">🍽️ Welcome to Schnitzelverse</h2>

        <div className="intro-story">
          <p>
            It started, as all great empires do, in a garage. Between Dad’s bike and a box of Christmas lights you found
            Grandma’s old frying pan, still smelling faintly of 1974.
          </p>
          <p>
            Mum’s fridge held two pork cutlets, some flour, three eggs and a bag of breadcrumbs. Grandma looked at the
            pan, looked at you, and said only: <i>“Thin. Golden. Never soggy.”</i>
          </p>
          <p>
            Now the neighbours are leaning over the fence, sniffing. Today: the street. Tomorrow: the town. Some day: every
            table on the planet, and then the stars. Grandma says that’s silly. Grandma also says the stars look hungry.
          </p>
        </div>

        <h3>How it works</h3>
        <ul className="intro-rules">
          <li>
            <b>🍳 Make.</b> Every schnitzel goes 🔨 pound → 🥣 bread → 🍳 fry. Click to do it yourself.
          </li>
          <li>
            <b>🚲 Sell.</b> Deliver to places that ordered. Hot ones earn the most and make fans; cold ones sell for less.
          </li>
          <li>
            <b>🛒 Restock.</b> Ingredients come from Mrs. Horáková’s corner shop. Run out and the kitchen stops.
          </li>
          <li>
            <b>👨‍👩‍👧 Hire the family.</b> Helpers cook and deliver by themselves, even while you’re away. This is how the game
            plays itself.
          </li>
          <li>
            <b>⭐ Expand.</b> Reputation plus money unlock the next place: the street, the block, the town…
          </li>
          <li>
            <b>✨ Franchise.</b> Once you reach the whole town you can sell up and start over with Golden Crumbs for
            permanent perks. Each run goes faster and further. Farms, fleets and rockets come later.
          </li>
        </ul>

        <h3>Your first minutes</h3>
        <ol className="intro-steps">
          <li>
            In the <b>🏚️ Garage</b> tab press <b>🍳 Cook all three</b>: pound, bread and fry in one go (or press the
            three steps one by one).
          </li>
          <li>
            In the <b>🚶 On foot</b> tab press <b>Deliver</b> next to the neighbours. They pay. Mrs. Novák is hooked.
          </li>
          <li>
            When ingredients run low, press <b>🛒 Restock</b> in the <b>🛒 Corner shop</b> tab (until Auntie takes over, see
            step 4).
          </li>
          <li>
            Save up <b>$60</b> for <b>📝 Auntie’s shopping list</b> in the 🛒 Corner shop tab. It restocks ingredients
            by itself: the best early buy, and it saves you a lot of trouble (no more kitchens standing still because the
            eggs ran out).
          </li>
          <li>
            Then hire <b>Uncle with a mallet</b> ($15) in the 🏚️ Garage tab. Then Grandma, then the cousin, then the kid on a
            bike.
          </li>
          <li>
            Watch <b>Next</b> in the sidebar: it tells you what the next place needs and how long it will take.
          </li>
        </ol>
        <p className="hint">Grandma will whisper tips in the sidebar until Auntie’s shopping list is on the fridge.</p>

        <div className="btns">
          <button className="primary" onClick={close}>
            Fire up the pan! 🔥
          </button>
        </div>
      </div>
    </div>
  )
}
