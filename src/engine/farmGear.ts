// Farm gear: a ladder of small upgrades for every farm building, one rung
// for each place you reach (the town, the city, … Mars, the Sun), plus a
// family farm hand for each chain. Most rungs make their own building faster;
// some help another chain (links), a few make schnitzel worth more (quality).
// Only data and a builder here: content.ts appends the result to UPGRADES.
import type { Effect, FacilityDef, FacilityId, RegionDef, RegionId, UpgradeDef } from './content'

/** Places with a rung on every ladder, in the order you reach them. */
export const FARM_PLACES = [
  'town',
  'nextTown',
  'city',
  'region',
  'country',
  'continent',
  'planet',
  'orbit',
  'moon',
  'mars',
  'belt',
  'jupiter',
  'solar',
] as const satisfies readonly RegionId[]
export type FarmPlace = (typeof FARM_PLACES)[number]

export type FarmChainId = 'meat' | 'flour' | 'oil' | 'eggs'
export type FarmGearId = `${FacilityId}_${FarmPlace}` | `hand_${FarmChainId}`

/** How much a rung speeds up its own building, by place: small steps, a bit bigger far away. */
export const RUNG_MULT: Record<FarmPlace, number> = {
  town: 1.2,
  nextTown: 1.2,
  city: 1.2,
  region: 1.2,
  country: 1.2,
  continent: 1.25,
  planet: 1.3,
  orbit: 1.25,
  moon: 1.25,
  mars: 1.3,
  belt: 1.25,
  jupiter: 1.25,
  solar: 1.4,
}
/** Rung price: this share of the place's price, × the building's price relative to $10K. */
export const RUNG_COST_SHARE = 0.5
/** Quality rungs: schnitzel price × this. */
export const QUALITY_MULT = 1.02

type Extra = { link: FacilityId[]; mult: number } | { quality: true }
type Rung = [emoji: string, name: string, flavor: string, extra?: Extra]

/** One rung per FARM_PLACES entry, in the same order. */
const LADDERS: Record<FacilityId, Rung[]> = {
  pigFarm: [
    ['🥕', 'Kitchen scraps for the pigs', 'Peelings from the garage. The pigs think it is a banquet.'],
    ['🏚️', 'A second sty', 'Built by the neighbours’ lads for a schnitzel each.'],
    ['🎻', 'Mozart in the barn', 'Calm pigs grow faster. Allegedly.'],
    ['💩', 'Manure for the fields', 'Nothing on this farm is wasted. Nothing.', { link: ['wheatField', 'sunflowers'], mult: 1.2 }],
    ['🌳', 'Free-range paddock', 'Healthier, happier, tastier. They escape less, too.', { quality: true }],
    ['🛁', 'Mud spa', 'Cucumber slices optional. Very much requested.'],
    ['🧬', 'Heritage breed', 'Great-grandpa’s pigs, brought back from a museum.'],
    ['🛰️', 'Satellite pig tracking', 'Every pig on a map. One is always at the pub.'],
    ['🌙', 'Low-gravity sties', 'They float to the trough. Less effort, more pig.'],
    ['🔴', 'Red dust wallows', 'Martian mud is the best mud. Science agrees.'],
    ['☄️', 'Asteroid acorns', 'Crunchy, mineral-rich, only slightly radioactive.'],
    ['🌀', 'Storm-proof barns', 'The Great Red Spot is just a very big mud bath.'],
    ['☀️', 'Sun-warmed pig palace', 'Heated by a star. The pigs have stopped complaining.'],
  ],
  butcher: [
    ['🔪', 'Sharper knives', 'Grandpa’s whetstone, finally used for its purpose.'],
    ['🪵', 'A second chopping block', 'Cousin Pavel now chops with both hands.'],
    ['📋', 'Cutlet press', 'Same pig, more cutlets. Do not ask how.'],
    ['🧑‍🍳', 'An apprentice for Pavel', 'Pavel teaches. The apprentice mostly sweeps.'],
    ['🥩', 'Dry-aged cutlets', 'Three weeks in a cold room. Worth every day.', { quality: true }],
    ['🫙', 'Render the lard', 'Pork fat for the fryer. Grandma approves.', { link: ['oilPress'], mult: 1.25 }],
    ['🏭', 'Cutlet conveyor', 'Pavel rides it when nobody is looking.'],
    ['🔦', 'Laser guides', 'Every cutlet exactly the same thickness. Pavel weeps.'],
    ['🌙', 'Zero-g carving', 'Slices float off the block straight into the crates.'],
    ['🤖', 'Butcher bots', 'They call Pavel “Sensei”.'],
    ['💎', 'Diamond blades', 'Mined in the belt. Cut through a schnitzel and the plate.'],
    ['🧲', 'Magnetic slicers', 'Jupiter’s field does the cutting. Pavel holds the clipboard.'],
    ['✨', 'Plasma knives', 'Cut and seared in one go. Very loud.'],
  ],
  wheatField: [
    ['🔄', 'Crop rotation', 'Wheat, potatoes, wheat. The soil sends its thanks.'],
    ['🧑‍🌾', 'A scarecrow called Mr. Novák', 'Looks exactly like the neighbour. Works on crows and the neighbour.'],
    ['💧', 'Irrigation ditches', 'Dug by hand, by the kid, as a punishment.'],
    ['🌱', 'Better seed', 'From a catalogue with very persuasive photos.'],
    ['🌵', 'Drought-proof wheat', 'Survives anything. Except Grandma’s opinion of it.'],
    ['🛩️', 'Crop dusters', 'Loops over the fields every morning. The pilot is showing off.'],
    ['🌦️', 'Weather control', 'Rain on Tuesdays, sun the rest. Picnics are now scheduled.'],
    ['🛰️', 'Orbital soil scans', 'Satellites count every grain. They lose count a lot.'],
    ['🌙', 'Moon-dust fertiliser', 'Brought back by the rockets that delivered schnitzel.'],
    ['🐷', 'Straw bedding', 'Wheat stalks make comfy beds for pigs and hens.', { link: ['pigFarm', 'coop'], mult: 1.2 }],
    ['☄️', 'Comet-ice irrigation', 'Four-billion-year-old water. Tastes of nothing at all.'],
    ['⚡', 'Lightning-grown wheat', 'Jupiter’s storms zap it. It grows out of spite.'],
    ['☀️', 'Endless summer', 'A field in permanent sunshine. The harvest never stops.'],
  ],
  mill: [
    ['🪨', 'A second millstone', 'Rolled here from a ruin. Took all weekend.'],
    ['💨', 'A proper windmill', 'Postcards of it sell better than the flour.'],
    ['⚙️', 'Electric rollers', 'Grandpa still stops to listen for the creak.'],
    ['🪨', 'Stone-ground flour', 'Slower stones, finer flour, better crust.', { quality: true }],
    ['🐖', 'Bran for the pigs', 'What the mill sieves out, the pigs gobble up.', { link: ['pigFarm'], mult: 1.25 }],
    ['🏗️', 'Flour silos', 'Tall enough to see the next country from the top.'],
    ['🏭', 'Mega mill', 'The old water mill sits inside it, like a museum piece.'],
    ['🌀', 'Centrifugal sifter', 'Spins at a thousand g. The flour comes out perfectly fine.'],
    ['🌙', 'Low-g flour mill', 'Flour floats everywhere. Everyone looks like a ghost.'],
    ['🌪️', 'Dust-storm windmills', 'Martian storms turn the sails for free.'],
    ['☄️', 'Asteroid millstones', 'A whole asteroid, slowly turning. Very slowly. Very big.'],
    ['⛈️', 'Storm-powered mills', 'Plugged straight into Jupiter’s weather.'],
    ['☀️', 'Solar-sail mill', 'Sails pushed by sunlight. Silent, endless, a little smug.'],
  ],
  bakery: [
    ['🔥', 'Bigger ovens', 'Big enough to sit in. Please do not sit in them.'],
    ['🍞', 'Day-old bread deal', 'The shop’s leftover loaves, turned into crumbs.'],
    ['🌙', 'A night baker', 'Bakes while you sleep. Sings while he bakes.'],
    ['🥖', 'Sourdough crumbs', 'A starter older than the kid. Crunchier crust.', { quality: true }],
    ['🧺', 'Crumb conveyor', 'Crumbs travel to the crates without a single spill. Almost.'],
    ['🧪', 'Crumb science', 'A lab coat, a clipboard, the perfect crumb size: 2.3 mm.'],
    ['🐔', 'Crumbs for the hens', 'The tiny ones nobody wants. The hens want them.', { link: ['coop'], mult: 1.25 }],
    ['🛰️', 'Vacuum toaster', 'Toasted in space. No air, no burning, just crunch.'],
    ['🌕', 'Crater ovens', 'Moon craters, lined with tiles. Natural heat-keepers.'],
    ['🔴', 'Red-oven bakery', 'Martian clay ovens. The crust comes out faintly pink.'],
    ['☄️', 'Meteor-hot ovens', 'Every meteor that hits the bakery bakes a batch.'],
    ['🌀', 'Pressure ovens', 'Baked at Jupiter’s pressure. Very dense crumbs.'],
    ['☀️', 'Sun-baked loaves', 'Hold the loaf up to the Sun. Done in a second.'],
  ],
  sunflowers: [
    ['📐', 'Sun-tracking rows', 'Planted so every flower gets the morning light.'],
    ['🐦', 'Bird scarers', 'Shiny tape and an old radio playing polka.'],
    ['🐝', 'Beehives', 'Bees pollinate the sunflowers and the wheat next door.', { link: ['wheatField', 'sunflowers'], mult: 1.2 }],
    ['🌻', 'Giant seed strain', 'Each head is the size of a bicycle wheel.'],
    ['🪴', 'Greenhouse seedlings', 'They start in the warm and never look back.'],
    ['🌏', 'Southern fields', 'When it’s winter here, it’s summer there. Sunflowers all year.'],
    ['🧬', 'Double-headed sunflowers', 'Twice the seeds. They argue about which way to face.'],
    ['🛰️', 'Sunlight from orbit', 'Mirrors in orbit light the fields at night.'],
    ['🌙', 'Earthshine farming', 'On the Moon, they grow by the light of the Earth.'],
    ['🔴', 'Dust-proof stalks', 'They survive Martian storms by leaning politely.'],
    ['☄️', 'Asteroid greenhouses', 'Hollowed-out rocks full of yellow flowers.'],
    ['🌀', 'Gas-giant glow', 'Jupiter’s glow lights a whole moon of sunflowers.'],
    ['☀️', 'Sunflowers facing the actual Sun', 'They finally found what they were looking for.'],
  ],
  oilPress: [
    ['🔩', 'Tighter screws', 'Grandpa tightened everything. Twice.'],
    ['🫒', 'Cold-pressed oil', 'Slower to make, cleaner to fry in. Golden crust.', { quality: true }],
    ['💪', 'Hydraulic press', 'Squeezes sunflower seeds like a disappointed aunt.'],
    ['🛢️', 'Bigger tanks', 'A swimming pool of oil. No swimming.'],
    ['🌀', 'Oil centrifuge', 'Spins the last drop out of every seed.'],
    ['🧪', 'Filter cascade', 'Twelve filters in a row. Oil clear as glass.'],
    ['🚰', 'Oil pipeline', 'Straight from the press to the fryers.'],
    ['🛰️', 'Zero-g separation', 'In orbit, oil and husks just drift apart.'],
    ['🐖', 'Seed cake for the pigs', 'Pressed seeds make pig snacks.', { link: ['pigFarm'], mult: 1.25 }],
    ['🔴', 'Martian presses', 'Built from red rock. Squeeze like they mean it.'],
    ['☄️', 'Asteroid-weight press', 'An asteroid parked on top of the seeds. Effective.'],
    ['🌀', 'Jupiter-pressure press', 'Squeezed at a million atmospheres.'],
    ['☀️', 'Solar-heated vats', 'Oil warmed by the Sun itself. Fries a tiny bit faster.'],
  ],
  coop: [
    ['🪺', 'Heated nests', 'Warm hens lay more. Also, they purr. Hens purr now.'],
    ['🐓', 'A rooster alarm clock', 'Five a.m., every day, no snooze button.'],
    ['🌻', 'Eggshell fertiliser', 'Crushed shells for the sunflowers.', { link: ['sunflowers'], mult: 1.2 }],
    ['🥚', 'Golden-yolk hens', 'Corn-fed, free to roam, yolks like sunsets.', { quality: true }],
    ['🧖', 'Hen spa', 'Dust baths, foot rubs, a little classical music.'],
    ['🥚', 'Egg conveyor', 'Eggs roll gently to the crates. Mostly gently.'],
    ['🧬', 'Double-yolk breed', 'Two yolks, one shell. Efficient hens.'],
    ['🛰️', 'Orbital hen house', 'The hens float. The eggs float. Catching them is a sport.'],
    ['🌙', 'Moon hens', 'They hop instead of walk. Very proud of it.'],
    ['🔴', 'Red-dust baths', 'Hens love a dust bath. Mars is one big dust bath.'],
    ['☄️', 'Comet-water fountains', 'Ancient ice, melted for very modern hens.'],
    ['🌀', 'Storm-chasing hens', 'They lay best in a thunderstorm. Jupiter has plenty.'],
    ['☀️', 'Phoenix hens', 'Self-heating. The eggs come out already boiled.'],
  ],
}

/** A family farm hand for each chain: the first boost once the farm opens. */
const HANDS: { chain: FarmChainId; buildings: FacilityId[]; emoji: string; name: string; flavor: string; cost: number }[] = [
  { chain: 'meat', buildings: ['pigFarm', 'butcher'], emoji: '🧔', name: 'Cousin Pavel moves to the farm', flavor: 'Brings his knives, his apron and strong opinions about pigs.', cost: 30_000 },
  { chain: 'flour', buildings: ['wheatField', 'mill', 'bakery'], emoji: '👩‍🌾', name: 'Aunt Jarmila takes the fields', flavor: 'Plants, mills and bakes, and still finds time to judge your crust.', cost: 40_000 },
  { chain: 'oil', buildings: ['sunflowers', 'oilPress'], emoji: '👨‍🌾', name: 'Great-uncle Franta’s sunflowers', flavor: 'Has grown sunflowers for sixty years. Talks to every one of them.', cost: 35_000 },
  { chain: 'eggs', buildings: ['coop'], emoji: '👧', name: 'Little Bára feeds the hens', flavor: 'Every hen has a name. Bára knows all of them.', cost: 20_000 },
]

/** The farm gear as upgrades, given the places and buildings (passed in to avoid an import cycle). */
export function buildFarmGear(regions: RegionDef[], facilities: FacilityDef[], franchises: number): UpgradeDef[] {
  const out: UpgradeDef[] = []
  for (const h of HANDS) {
    out.push({
      id: `hand_${h.chain}`,
      name: h.name,
      emoji: h.emoji,
      description: h.flavor,
      cost: h.cost,
      requires: { franchises },
      chain: h.chain,
      effects: h.buildings.map((b): Effect => ({ kind: 'building', facility: b, mult: 1.25 })),
    })
  }
  for (const f of facilities) {
    LADDERS[f.id].forEach(([emoji, name, flavor, extra], i) => {
      const place = FARM_PLACES[i]
      const region = regions.find((r) => r.id === place)!
      const effects: Effect[] =
        extra && 'quality' in extra
          ? [{ kind: 'price', mult: QUALITY_MULT }]
          : extra
            ? extra.link.map((b): Effect => ({ kind: 'building', facility: b, mult: extra.mult }))
            : [{ kind: 'building', facility: f.id, mult: RUNG_MULT[place] }]
      out.push({
        id: `${f.id}_${place}`,
        name,
        emoji,
        description: flavor,
        cost: Math.round(region.unlockCost * RUNG_COST_SHARE * (f.baseCost / 10_000)),
        requires: { franchises, place },
        building: f.id,
        effects,
      })
    })
  }
  return out
}
