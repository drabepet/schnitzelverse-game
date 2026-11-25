// Kitchen gear: a ladder of small upgrades for each kitchen station (pound,
// bread, fry), one rung for each place you reach, like the farm's ladders.
// Most rungs make their own station faster; some help the next step along
// (links), a few make schnitzel worth more (quality). Count goals for the
// crews (10, 25, 50… helpers) work like the farm's, see crewGoalBonus.
// Only data and a builder here: data/upgrades.ts appends the result to UPGRADES.
import { FARM_PLACES, QUALITY_MULT, type FarmPlace } from './farmGear'
import type { Effect, RegionDef, StageId, UpgradeDef } from './content'

export type KitchenGearId = `${StageId}_${FarmPlace}`

/** Rung price: this share of its place's price. Kitchen gear is cheaper than the farm's buildings. */
export const KITCHEN_RUNG_COST_SHARE: Record<StageId, number> = { pound: 0.2, bread: 0.25, fry: 0.3 }
/**
 * How much a rung speeds up its own station: smaller steps than the farm's,
 * so the kitchen grows along with the business instead of in big jumps
 * (the space crews were ×8 each; now ×2, the ladders do the rest).
 */
export const KITCHEN_RUNG_MULT: Record<FarmPlace, number> = {
  town: 1.15,
  nextTown: 1.15,
  city: 1.15,
  region: 1.15,
  country: 1.15,
  continent: 1.15,
  planet: 1.2,
  orbit: 1.15,
  moon: 1.15,
  mars: 1.2,
  belt: 1.15,
  jupiter: 1.15,
  solar: 1.25,
  nextStar: 1.15,
  cluster: 1.15,
  milkyWay: 1.25,
  nextGalaxy: 1.15,
  localGroup: 1.15,
  universe: 1.25,
  schnitzelverse: 1.3,
}
/** How much a link rung speeds up the step it helps. */
export const KITCHEN_LINK_MULT = 1.15

type Extra = { link: StageId } | { quality: true }
type Rung = [emoji: string, name: string, flavor: string, extra?: Extra]

/** One rung per FARM_PLACES entry, in the same order. */
const LADDERS: Record<StageId, Rung[]> = {
  pound: [
    ['🪵', 'A proper chopping block', 'Oak, two hands thick. The table finally stops wobbling.'],
    ['🧤', 'Chainmail gloves', 'Uncle says they’re for grip. They’re for style.'],
    ['📻', 'Polka on the radio', '140 beats a minute. The cutlets keep time.'],
    ['📄', 'Paper-thin cutlets', 'Thinner cutlets take the crumbs faster. Grandma noticed.', { link: 'bread' }],
    ['🐖', 'Pork from the village butcher', 'Mr. Novák asks after every cutlet by name.', { quality: true }],
    ['🔨', 'A mallet from every country', 'One from each country you serve. Uncle has favourites.'],
    ['🌍', 'Round-the-clock pounding', 'Somewhere in the world it’s always pounding o’clock.'],
    ['🛰️', 'Zero-g swing', 'No gravity, no back pain. Uncle floats between cutlets.'],
    ['🌙', 'Moon-rock mallet heads', 'Heavy as iron, light on the Moon. Perfect balance.'],
    ['🔴', 'Martian spiked mallets', 'Tiny pockets in every cutlet for the crumbs to cling to.', { link: 'bread' }],
    ['☄️', 'An asteroid for an anvil', 'A whole asteroid to pound on. It doesn’t wobble either.'],
    ['🌀', 'Storm-powered hammers', 'Jupiter’s winds swing the mallets. Uncle supervises.'],
    ['☀️', 'Flare-forged mallets', 'Forged in a solar flare. Still warm.'],
    ['⭐', 'Starlight press', 'Pressed thin by the light of another sun.'],
    ['✨', 'Hand-picked cluster cuts', 'Only the best cutlet from every star.', { quality: true }],
    ['🌀', 'Galactic mallet line', 'One mallet per star system, all in time.'],
    ['🌫️', 'Andromeda tenderizers', 'They pound to a different rhythm. It works anyway.'],
    ['📐', 'Cut to fit the trays', 'Every cutlet the exact shape of a breading tray. Grandma wept.', { link: 'bread' }],
    ['🌌', 'The Big Bang mallet', 'One swing flattened everything. Then they did it again.'],
    ['🍋', 'The thinnest cutlet', 'One atom thick. Somehow still juicy.'],
  ],
  bread: [
    ['🥄', 'A bigger wooden spoon', 'The old spoon retires to the wall, with honours.'],
    ['🧂', 'Salt, secretly pre-measured', 'Grandma refuses to measure. Her assistant does, quietly.'],
    ['🎵', 'The breading song', 'Flour, egg, crumbs, repeat. There is a song. Everyone knows it.'],
    ['🍞', 'An even coat', 'Coated just so, every cutlet fries evenly and faster.', { link: 'fry' }],
    ['👵', 'Grandma’s own crumbs', 'Dried from her own bread. Nobody else’s will do.', { quality: true }],
    ['🥚', 'Egg-cracking machine', 'Two hundred eggs a minute. Grandma checks every tenth.'],
    ['🌍', 'Breading in every time zone', 'Grandma phones each kitchen at opening time.'],
    ['🫧', 'Floating flour', 'In orbit the flour hangs in the air. Walk the cutlet through.'],
    ['🌙', 'Low-gravity dredging', 'Cutlets drift through the crumbs and come out coated.'],
    ['🔴', 'Martian dry air', 'Crumbs dry in seconds on Mars: extra crunch in the fryer.', { link: 'fry' }],
    ['☄️', 'Asteroid crumb mill', 'Toasted crumbs ground fine by a rolling asteroid.'],
    ['🌀', 'Storm-whisked eggs', 'Jupiter’s storms beat the eggs. The fluffiest coating anywhere.'],
    ['☀️', 'Sun-toasted crumbs', 'Golden before they even reach the fryer.'],
    ['⭐', 'Two-sun breading', 'Breaded in the light of two suns. Twice the glow.'],
    ['✨', 'Star-dust panko', 'A pinch of star dust in every crumb. It shimmers.', { quality: true }],
    ['🌀', 'A breading line round the galaxy', 'The last tray comes back round to the first.'],
    ['🌫️', 'Andromeda egg wash', 'Their eggs are slightly blue. The coating is perfect.'],
    ['🫒', 'Pre-oiled crumbs', 'A whisper of oil on every crumb. They practically fry themselves.', { link: 'fry' }],
    ['🌌', 'The cosmic crumb', 'One crumb the size of a galaxy, slowly ground down.'],
    ['🍋', 'Grandma’s last secret', 'She finally wrote it down. It just says “more love”.'],
  ],
  fry: [
    ['🧯', 'A fire extinguisher', 'Just knowing it’s there, the cousin fries faster.'],
    ['🌡️', 'An oil thermometer', 'No more guessing. The cousin still guesses, but faster.'],
    ['🥢', 'Long tongs', 'Two schnitzels at once, eyebrows safe.'],
    ['👃', 'The smell of frying', 'It drifts to the pounding table. Uncle speeds up, hungry.', { link: 'pound' }],
    ['🛢️', 'Fresh oil every hour', 'Never the same oil twice. Customers can tell.', { quality: true }],
    ['🍳', 'A wall of pans', 'Forty pans, one cousin, a lot of running.'],
    ['🌍', 'Fryers round the world', 'The sun never sets on a hot pan.'],
    ['🛰️', 'Zero-g oil bubble', 'The oil floats in a ball. Drop the cutlet in the middle.'],
    ['🌙', 'Crater-shade fryer', 'In the shade of a crater, always the right temperature.'],
    ['🔴', 'Red-hot Martian pans', 'They heat up so fast that Uncle has to keep up.', { link: 'pound' }],
    ['☄️', 'Comet-ice cooling', 'Ice from a comet keeps the fryers from overheating.'],
    ['🌀', 'Storm-fanned burners', 'Jupiter’s winds keep the flames roaring.'],
    ['☀️', 'Solar frying', 'A mirror the size of a moon, focused on one pan.'],
    ['⭐', 'Twin-star fryer', 'Two suns, two sides, flipped at once.'],
    ['✨', 'Cluster-gold crust', 'Fried to the colour of a hundred suns.', { quality: true }],
    ['🌀', 'A ring of fryers', 'All the way round the galaxy’s core.'],
    ['🌫️', 'Andromeda oil', 'Pressed in the next galaxy. Smokes at a higher point.'],
    ['♨️', 'Waste heat for the pounding hall', 'Uncle works in shirtsleeves now, and twice as fast.', { link: 'pound' }],
    ['🌌', 'The cosmic fryer', 'The background warmth of the universe is now 170 °C.'],
    ['🍋', 'The last golden schnitzel', 'Fried at the end of everything. Perfect, every time.'],
  ],
}

/** The kitchen gear as upgrades, given the places (passed in to avoid an import cycle). */
export function buildKitchenGear(regions: RegionDef[]): UpgradeDef[] {
  const out: UpgradeDef[] = []
  for (const stage of Object.keys(LADDERS) as StageId[]) {
    LADDERS[stage].forEach(([emoji, name, flavor, extra], i) => {
      const place = FARM_PLACES[i]
      const region = regions.find((r) => r.id === place)!
      const effects: Effect[] =
        extra && 'quality' in extra
          ? [{ kind: 'price', mult: QUALITY_MULT }]
          : extra
            ? [{ kind: 'speed', task: extra.link, mult: KITCHEN_LINK_MULT }]
            : [{ kind: 'speed', task: stage, mult: KITCHEN_RUNG_MULT[place] }]
      out.push({
        id: `${stage}_${place}`,
        name,
        emoji,
        description: flavor,
        cost: Math.round(region.unlockCost * KITCHEN_RUNG_COST_SHARE[stage]),
        requires: { place },
        space: region.space,
        deep: region.deep,
        station: stage,
        effects,
      })
    })
  }
  return out
}
