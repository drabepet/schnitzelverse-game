// Farm gear: a ladder of small upgrades for every farm building, one rung
// for each place you reach (the town, the city, … Mars, the Sun), plus a
// family farm hand for each chain. Most rungs make their own building faster;
// some help another chain (links), a few make schnitzel worth more (quality).
// Only data and a builder here: data/upgrades.ts appends the result to UPGRADES.
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
  'nextStar',
  'cluster',
  'milkyWay',
  'nextGalaxy',
  'localGroup',
  'universe',
  'schnitzelverse',
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
  nextStar: 1.3,
  cluster: 1.3,
  milkyWay: 1.4,
  nextGalaxy: 1.3,
  localGroup: 1.3,
  universe: 1.4,
  schnitzelverse: 1.5,
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
    ['🌟', 'Starlight sties', 'Three suns, three meals a day. The pigs approve of Alpha Centauri.'],
    ['🐽', 'Pig choir', 'Trained by Grandma. They oink in perfect harmony across a hundred stars.'],
    ['🌀', 'Spiral-arm pastures', 'Pigs grazing on the edge of the galaxy. The view is unreal.', { link: ['wheatField', 'sunflowers'], mult: 1.3 }],
    ['🌫️', 'Andromeda acorns', 'Imported from the next galaxy. They taste faintly of the future.'],
    ['🛁', 'Black-hole mud bath', 'The deepest mud in existence. Pigs go in and come out calmer.', { quality: true }],
    ['🌌', 'Pigs in every galaxy', 'There is no corner of the universe without a happy pig in it.'],
    ['🍋', 'The pig of all pigs', 'A single legendary pig that exists in every universe at once. It is very relaxed about it.'],
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
    ['🌟', 'Starlight scalpels', 'Sharpened on a sunbeam. Pavel won’t let anyone else touch them.'],
    ['✂️', 'Cluster cutting crew', 'A thousand Pavels across a thousand stars. All of them hum the same polka.'],
    ['🔭', 'Light-year precision', 'Every cutlet the same thickness across the whole galaxy. To the atom.', { quality: true }],
    ['🌫️', 'Andromeda apprentices', 'They learned from Pavel by watching old videos. Very old. Light takes a while.'],
    ['🫙', 'Galactic lard rendering', 'Pork fat by the nebula, straight to the oil.', { link: ['oilPress'], mult: 1.3 }],
    ['🌌', 'Cosmic cleaver', 'One swing, a billion cutlets. Pavel sits down afterwards.'],
    ['🍋', 'The final cut', 'Pavel’s masterpiece: the perfect cutlet, in every universe at once.'],
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
    ['🌟', 'Triple-sun harvest', 'Three suns mean three harvests a day. The scarecrow needs a holiday.'],
    ['🌾', 'Cluster crop circles', 'Aliens finally admitted it was them. They wanted the recipe.'],
    ['🌀', 'Galaxy-wide crop rotation', 'Wheat on this arm, potatoes on that one. The soil of the Milky Way says thanks.'],
    ['🌫️', 'Andromeda heirloom wheat', 'Older than the Earth. Bakes like a dream.', { quality: true }],
    ['🐔', 'Galactic straw', 'Leftover straw from a thousand worlds, for every pig and hen.', { link: ['pigFarm', 'coop'], mult: 1.3 }],
    ['🌌', 'Fields between the galaxies', 'Out in the dark between galaxies, wheat grows in perfect silence.'],
    ['🍋', 'The everfield', 'One field that exists in every universe. It is always harvest time somewhere.'],
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
    ['🌟', 'Solar-wind sails', 'Three suns blowing on one windmill. It spins rather fast.'],
    ['✨', 'Star-cluster millstones', 'A pair of neutron stars, grinding very carefully.'],
    ['🌀', 'Spiral-arm mill', 'The galaxy turns, the mill turns. Grandpa calls it efficient.'],
    ['🌫️', 'Andromeda flour', 'Milled in another galaxy, finer than anything on Earth.', { quality: true }],
    ['🐖', 'Bran by the light year', 'The sieved-out bits of a galaxy of wheat, for the pigs.', { link: ['pigFarm'], mult: 1.3 }],
    ['🌌', 'Cosmic mill', 'It grinds whole wheat worlds. The noise is gentle, like distant thunder.'],
    ['🍋', 'The mill at the end of everything', 'It grinds the last grain of wheat in the last universe. Then starts again.'],
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
    ['🌟', 'Starfire ovens', 'Each oven is lit by a different sun. They argue about which is best.'],
    ['✨', 'Cluster bakeries', 'One bakery per star. Each smells of warm bread for a light year.'],
    ['🌀', 'Galactic sourdough', 'A starter shared across the whole Milky Way. It has a name: Kevin.', { quality: true }],
    ['🌫️', 'Andromeda crumb lab', 'Crumb science, now with two galaxies of data.'],
    ['🐔', 'Galaxy crumbs for the hens', 'The tiniest crumbs of a whole galaxy. The hens love them.', { link: ['coop'], mult: 1.3 }],
    ['🌌', 'Big Bang bakery', 'Started with a single loaf. Then it expanded very, very fast.'],
    ['🍋', 'The breadcrumb of everything', 'One crumb, infinitely golden. It crunches in every universe.'],
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
    ['🌟', 'Three-sun sunflowers', 'They can’t decide which sun to face, so they spin. Constantly.'],
    ['✨', 'Starlight fields', 'Planted around every star in the cluster. Very confused bees.'],
    ['🐝', 'Galactic bees', 'Bees the size of buses pollinate whole planets of crops.', { link: ['wheatField', 'sunflowers'], mult: 1.3 }],
    ['🌫️', 'Andromeda sunflowers', 'They grow facing the Milky Way. Homesick, maybe.'],
    ['🌻', 'Supernova seeds', 'Seeds from a sunflower that saw a star explode. Very oily.', { quality: true }],
    ['🌌', 'Sunflowers in every galaxy', 'Wherever there is a star, there is a sunflower looking at it.'],
    ['🍋', 'The sunflower of all suns', 'It faces every sun in every universe at once. It has a stiff neck.'],
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
    ['🌟', 'Triple-sun press', 'Three suns heat the oil. Fries a fraction faster.'],
    ['✨', 'Cluster pipelines', 'Oil pipes between the stars. Only slightly leaky.'],
    ['🌀', 'Galactic press', 'The spin of the whole galaxy squeezes the seeds.'],
    ['🌫️', 'Andromeda cold-press', 'Pressed in the cold between galaxies. Clear as glass.', { quality: true }],
    ['🐖', 'Galactic seed cake', 'A galaxy’s worth of pressed seeds for the pigs.', { link: ['pigFarm'], mult: 1.3 }],
    ['🌌', 'Cosmic oil wells', 'The universe turns out to be full of sunflower oil. Who knew.'],
    ['🍋', 'The last drop', 'The final drop of oil in every universe. Always just enough for one more batch.'],
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
    ['🌟', 'Three-sun hen house', 'Three sunrises a day means three roosters. Nobody sleeps.'],
    ['🌻', 'Cluster eggshell compost', 'Crushed shells by the shipload for the sunflower stars.', { link: ['sunflowers'], mult: 1.3 }],
    ['🌀', 'Galactic hens', 'A hen on every habitable planet. The eggs travel by warp.'],
    ['🌫️', 'Andromeda layers', 'Hens from the next galaxy. Their yolks glow faintly.', { quality: true }],
    ['🥚', 'Egg nebula', 'A cloud of eggs, gently drifting into the breading station.'],
    ['🌌', 'Cosmic coop', 'One coop, the size of a galaxy cluster. The hens are very proud.'],
    ['🍋', 'The first egg', 'It came before the chicken. In every universe. Question settled.'],
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
