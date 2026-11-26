// The second shelf of badges (0.010): longer goals for players who already
// have the first hundred, plus fame, the badge hunt itself and a lot of nonsense.
// Most give no bonus; the few far-away ones are listed in badgeBonus.ts.
import {
  FACILITIES,
  FACILITY_BY_ID,
  KITCHEN_FACILITIES,
  type FacilityId,
  FARM_GOALS,
  PERKS,
  REGION_INDEX,
  REGIONS,
  type UpgradeId,
  UPGRADES,
  VEHICLES,
  WORKERS,
} from './content'
import { criticStars, crispness } from './rules'
import type { BadgeDef } from './badges'
import { badgeCount, building, byHand, earned, fame, franchises, hours, ownedUpgrades, place, served, speedrun, totalCrumbs, totalVehicles, totalWorkers, totalFacilities, vehicles, workers } from './badgeChecks'


const SHOP_GEAR: UpgradeId[] = ['biggerVan', 'wholesaleCard', 'secondVan', 'miniMarket', 'nightDeliveries', 'supermarket', 'regionalDepot', 'groceryChain', 'hypermarket', 'galacticGrocer']
// The ingredient farm only: star paprika has its own records (below).
const farmGear = () => UPGRADES.filter((u) => u.building && !FACILITY_BY_ID[u.building].space)
const farmHands = () => UPGRADES.filter((u) => u.chain && u.chain !== 'paprika')
const paprikaGear = () => UPGRADES.filter((u) => u.building && FACILITY_BY_ID[u.building].space)
const fleetGear = () => UPGRADES.filter((u) => u.vehicle)
/** Places with at least this many critic stars right now. */
const starred = (s: Parameters<BadgeDef['check']>[0], stars: number) => REGIONS.filter((r) => s.regions[r.id].unlocked && criticStars(s, r) >= stars)

type Def = Omit<BadgeDef, 'category'>
const cat = (category: BadgeDef['category'], defs: Def[]): BadgeDef[] => defs.map((d) => ({ ...d, category }))

/** Farm buildings: 100 and 400 of each, each with its own joke. */
const FARM_COUNTS: [FacilityId, string, string, string, string, string][] = [
  ['wheatField', 'wheat fields', '🌾', 'Amber Waves of Crumbs', 'Bread Basket Case', 'Grandpa named every field. He’s running out of saints.'],
  ['sunflowers', 'sunflower fields', '🌻', 'Van Gogh’s Nightmare', 'Sunflower Supremacy', 'Every flower faces the sun. And then the oil press.'],
  ['coop', 'chicken coops', '🐔', 'Cluck Norris', 'Coop d’État', 'The hens have formed a government. Their only law: more grit.'],
  ['pigFarm', 'pig farms', '🐷', 'Hog Heaven', 'Pig Brother Is Watching', 'Some pigs are more equal than others. All of them are schnitzel.'],
  ['mill', 'mills', '⚙️', 'Run of the Mill', 'Mill-ionaire', 'Don Quixote tried to fight them. He lost. Then he had lunch.'],
  ['bakery', 'bakeries', '🍞', 'Loaf Story', 'Yeast of Eden', 'They bake bread purely to crumb it. The French are furious.'],
  ['oilPress', 'oil presses', '🛢️', 'Press Freedom', 'Slick Operation', 'The sunflower seeds never stood a chance.'],
  ['butcher', 'butchers', '🔪', 'Cutlet Above the Rest', 'Prime Cuts Minister', 'The butchers have a choir. It mostly sings “thwack”.'],
]

export const MORE_BADGES: BadgeDef[] = [
  // ------------------------------------------------------------ served
  ...cat('served', [
    { id: 'served10t', emoji: '🔭', name: 'Visible From Space', goal: 'Serve 10 trillion schnitzels', flavor: 'Astronauts report a faint golden glow over Central Europe.', check: served(1e13) },
    { id: 'served100t', emoji: '🌋', name: 'Tectonic Breading', goal: 'Serve 100 trillion schnitzels', flavor: 'Geologists have named a new layer of rock: the Crumbocene.', check: served(1e14) },
    { id: 'served1qa', emoji: '🪐', name: 'Quadrillion Crunch', goal: 'Serve 1 quadrillion schnitzels', flavor: 'Saturn asked for a ring of them. Saturn got a ring of them.', check: served(1e15) },
    { id: 'served1qi', emoji: '☄️', name: 'Comet Tail of Crumbs', goal: 'Serve 1 quintillion schnitzels', flavor: 'Every shooting star is now a schnitzel that missed its plate.', check: served(1e18) },
    { id: 'served1sx', emoji: '🌠', name: 'Galactic Lunch Rush', goal: 'Serve 1 sextillion schnitzels', flavor: 'The Milky Way is being renamed the Breaded Way.', check: served(1e21) },
    { id: 'served1sp', emoji: '♾️', name: 'Schnitzel Event Horizon', goal: 'Serve 1 septillion schnitzels', flavor: 'Not even light can escape. Light doesn’t want to. It smells too good.', check: served(1e24) },
    { id: 'runServed1m', emoji: '🏃', name: 'One-Run Wonder', goal: 'Serve 1 million schnitzels in a single run', flavor: 'From empty garage to a million plates, without selling up.', check: (s) => s.run.served.gte(1e6) },
    { id: 'runServed1b', emoji: '🏃‍♀️', name: 'Marathon Fryer', goal: 'Serve 1 billion schnitzels in a single run', flavor: 'Your fryer has not been switched off since spring.', check: (s) => s.run.served.gte(1e9) },
    { id: 'runServed1t', emoji: '🦸', name: 'Ironman of the Iron Pan', goal: 'Serve 1 trillion schnitzels in a single run', flavor: 'Grandma suggests you take a break. You suggest she takes a schnitzel.', check: (s) => s.run.served.gte(1e12) },
  ]),

  // ------------------------------------------------------------ money
  ...cat('money', [
    { id: 'money1qa', emoji: '🤑', name: 'Quadrillionaire Quarterback', goal: 'Earn $1 quadrillion in total', flavor: 'Your wallet needs its own postcode.', check: earned(1e15) },
    { id: 'money1qi', emoji: '🏰', name: 'Crust Fund Kid', goal: 'Earn $1 quintillion in total', flavor: 'Your grandchildren will never have to pound a cutlet. They will anyway. Tradition.', check: earned(1e18) },
    { id: 'money1sx', emoji: '💎', name: 'Six Commas of Crunch', goal: 'Earn $1 sextillion in total', flavor: 'The economists ran out of words. Now they just point and drool.', check: earned(1e21) },
    { id: 'money1sp', emoji: '🏛️', name: 'Bank of Breadcrumbs', goal: 'Earn $1 septillion in total', flavor: 'The central bank now backs its currency with schnitzel.', check: earned(1e24) },
    { id: 'money1no', emoji: '🌌', name: 'Infinite Money Glitch', goal: 'Earn $1 nonillion in total', flavor: 'It’s not a glitch. It’s a business model.', check: earned(1e30) },
    { id: 'cash1b', emoji: '🛏️', name: 'Under the Mattress', goal: 'Have $1 billion in hand at once', flavor: 'Grandma doesn’t trust banks. The mattress is now four metres tall.', check: (s) => s.money.gte(1e9) },
    { id: 'cash1qa', emoji: '🏊', name: 'Money Bin Dive', goal: 'Have $1 quadrillion in hand at once', flavor: 'Like a certain duck, but with breadcrumbs instead of coins.', check: (s) => s.money.gte(1e15) },
    { id: 'runMoney1t', emoji: '📈', name: 'Hostile Takeover of Lunch', goal: 'Earn $1 trillion in a single run', flavor: 'The stock market now opens with a sizzle.', check: (s) => s.run.earned.gte(1e12) },
    { id: 'brokeRich', emoji: '🎰', name: 'All In', goal: 'Secret', flavor: 'Earned a trillion over the years, and right now you have less than a dollar. Bold.', secret: true, check: (s) => s.stats.earned.gte(1e12) && s.money.lt(1) },
  ]),

  // ------------------------------------------------------------ fame
  ...cat('fame', [
    { id: 'fame1k', emoji: '⭐', name: 'Local Celebrity', goal: 'Have 1,000 reputation', flavor: 'The postman asks for an autograph. On a napkin. With crumbs.', check: fame(1e3) },
    { id: 'fame1m', emoji: '🌟', name: 'Famous for Fifteen Minutes', goal: 'Have 1 million reputation', flavor: 'Fifteen minutes is exactly how long a schnitzel stays perfectly crisp.', check: fame(1e6) },
    { id: 'fame1b', emoji: '📺', name: 'Prime Time Fryer', goal: 'Have 1 billion reputation', flavor: 'Your cooking show is called “Pound It”. Ratings: off the charts.', check: fame(1e9) },
    { id: 'fame1t', emoji: '🎬', name: 'Schnitzel: The Movie', goal: 'Have 1 trillion reputation', flavor: 'The lead role went to a very convincing cutlet.', check: fame(1e12) },
    { id: 'fame1qa', emoji: '🗿', name: 'Carved in Crust', goal: 'Have 1 quadrillion reputation', flavor: 'There is a mountain with your face on it. And a lemon.', check: fame(1e15) },
    { id: 'fame1qi', emoji: '👽', name: 'Known in Other Galaxies', goal: 'Have 1 quintillion reputation', flavor: 'The aliens didn’t come for our water. They came for the schnitzel.', check: fame(1e18) },
    { id: 'fame1sx', emoji: '🛐', name: 'Saint Schnitzel', goal: 'Have 1 sextillion reputation', flavor: 'Pilgrims travel light years to see the original frying pan.', check: fame(1e21) },
  ]),

  // ------------------------------------------------------------ family
  ...cat('family', [
    { id: 'uncles250', emoji: '🪓', name: 'Uncle Sam-wich', goal: 'Have 250 uncles with mallets', flavor: 'The windows rattle three streets away.', check: workers('uncle', 250) },
    { id: 'uncles1k', emoji: '🌩️', name: 'Thousand Mallet Thunder', goal: 'Have 1,000 uncles with mallets', flavor: 'Seismographs in Japan picked it up. They want schnitzel too.', check: workers('uncle', 1000) },
    { id: 'grandmas500', emoji: '🧶', name: 'Knitting Circle of Doom', goal: 'Have 500 grandmas', flavor: 'They knitted a cosy for the fryer. And for the garage. And for the town.', check: workers('grandma', 500) },
    { id: 'grandmas1k', emoji: '🍬', name: 'Infinite Hard Candy', goal: 'Have 1,000 grandmas', flavor: 'Every pocket of every apron holds a boiled sweet from 1987.', check: workers('grandma', 1000) },
    { id: 'cousins250', emoji: '🔥', name: 'Cousin Overflow', goal: 'Have 250 cousins at the stove', flavor: 'Nobody knows all their names. Everyone is called “cousin”.', check: workers('cousin', 250) },
    { id: 'cousins1k', emoji: '🧯', name: 'Fire Brigade on Speed Dial', goal: 'Have 1,000 cousins at the stove', flavor: 'The fire brigade now just sits outside, eating, in case.', check: workers('cousin', 1000) },
    { id: 'kids500', emoji: '🛞', name: 'Critical Mass', goal: 'Have 500 kids on bikes', flavor: 'Traffic stops every lunchtime. Nobody complains: they all get one.', check: workers('kid', 500) },
    { id: 'kids1k', emoji: '🏁', name: 'Grand Tour de Crumb', goal: 'Have 1,000 kids on bikes', flavor: 'The yellow jersey is breaded.', check: workers('kid', 1000) },
    { id: 'family1k', emoji: '🎪', name: 'Family Reunion (Stadium Edition)', goal: 'Have 1,000 helpers at once', flavor: 'The group photo needs a drone.', check: (s) => totalWorkers(s) >= 1000 },
    { id: 'family5k', emoji: '🏙️', name: 'Population: Family', goal: 'Have 5,000 helpers at once', flavor: 'The family is now officially a town. The town is now officially hungry.', check: (s) => totalWorkers(s) >= 5000 },
    { id: 'family10k', emoji: '🧬', name: 'Family Tree (Forest)', goal: 'Have 10,000 helpers at once', flavor: 'Genealogists have given up and opened a schnitzel stand.', check: (s) => totalWorkers(s) >= 10000 },
    { id: 'evenFamily', emoji: '⚖️', name: 'No Favourites', goal: 'Secret', flavor: 'Exactly the same number of uncles, grandmas, cousins and kids (at least 10 each). Mum is very proud.', secret: true, check: (s) => s.workers.uncle >= 10 && WORKERS.every((w) => s.workers[w.id] === s.workers.uncle) },
    { id: 'soloGrandma', emoji: '🦸‍♀️', name: 'Grandma Does It All', goal: 'Secret', flavor: '50 grandmas and not a single other helper. They prefer it this way.', secret: true, check: (s) => s.workers.grandma >= 50 && s.workers.uncle === 0 && s.workers.cousin === 0 && s.workers.kid === 0 },
  ]),

  // ------------------------------------------------------------ places
  ...cat('places', [
    { id: 'placeStreet', emoji: '🛣️', name: 'Street Food', goal: 'Deliver to your street', flavor: 'Technically all food on this street is now street food.', check: place('street') },
    { id: 'placeBlock', emoji: '🏘️', name: 'New Kid on the Block', goal: 'Deliver to the block', flavor: 'Step by step, cutlet by cutlet.', check: place('block') },
    { id: 'placeDistrict', emoji: '🗳️', name: 'District Attorney of Taste', goal: 'Deliver to the district', flavor: 'The verdict: guilty of excessive crunch.', check: place('district') },
    { id: 'placeNextTown', emoji: '🚏', name: 'Over the Hill', goal: 'Deliver to the next town over', flavor: 'They had their own schnitzel. Had.', check: place('nextTown') },
    { id: 'placeRegion', emoji: '🗺️', name: 'Regional Delicacy', goal: 'Deliver to the whole region', flavor: 'The tourist board changed the slogan to “Come for the castles, stay for the cutlets”.', check: place('region') },
    { id: 'speedCity', emoji: '🏎️', name: 'City Sprint', goal: 'Reach the city within 30 minutes of a run', flavor: 'The city didn’t see you coming. It smelled you coming.', check: speedrun('city', 30) },
    { id: 'speedCountry', emoji: '🚄', name: 'Coast to Coast by Lunch', goal: 'Reach the whole country within 1 hour of a run', flavor: 'The national railway asked how you did it. You said: “Grandma.”', check: speedrun('country', 60) },
    { id: 'speedPlanet', emoji: '🌪️', name: 'Around the World in 80 Minutes', goal: 'Reach the whole planet within 80 minutes of a run', flavor: 'Phileas Fogg took 80 days and didn’t bring a single schnitzel.', check: speedrun('planet', 80) },
    { id: 'flashTown', emoji: '📸', name: 'Blink and You Miss It', goal: 'Reach the whole town within 2 minutes of a run', flavor: 'The town council is still looking for the ribbon to cut.', check: speedrun('town', 2) },
    { id: 'speedOrbit', emoji: '🧑‍🚀', name: 'Escape Velocity', goal: 'Reach the orbital station within 2 hours of a run', flavor: 'You left the atmosphere faster than the oil smell.', check: speedrun('orbit', 120) },
  ]),

  // ------------------------------------------------------------ franchise
  ...cat('franchise', [
    { id: 'franchise50', emoji: '🏷️', name: 'Everything Must Go', goal: 'Franchise 50 times', flavor: 'You’ve sold the garage so often it has its own estate agent.', check: franchises(50) },
    { id: 'franchise100', emoji: '💯', name: 'Century of Sales', goal: 'Franchise 100 times', flavor: 'There are now more franchisees than schnitzels. Almost.', check: franchises(100) },
    { id: 'franchise250', emoji: '🌀', name: 'Groundhog Fry', goal: 'Franchise 250 times', flavor: 'You wake up. It’s the garage again. Grandma says: “Thin. Golden.” Again.', check: franchises(250) },
    { id: 'franchise500', emoji: '🔄', name: 'The Eternal Return of the Cutlet', goal: 'Franchise 500 times', flavor: 'Nietzsche would have loved this. Nietzsche would have ordered two.', check: franchises(500) },
    { id: 'crumbs10k', emoji: '🏔️', name: 'Mount Crumbmore', goal: 'Collect 10,000 Golden Crumbs in total', flavor: 'Mountaineers try to climb it. They eat it instead.', check: totalCrumbs(1e4) },
    { id: 'crumbs100k', emoji: '🏜️', name: 'Golden Desert', goal: 'Collect 100,000 Golden Crumbs in total', flavor: 'It sparkles. It crunches underfoot. Camels love it.', check: totalCrumbs(1e5) },
    { id: 'crumbs1m', emoji: '🌞', name: 'Crumb Supernova', goal: 'Collect 1 million Golden Crumbs in total', flavor: 'Visible from three solar systems over.', check: totalCrumbs(1e6) },
    { id: 'crumbs1b', emoji: '🪙', name: 'The Golden Age', goal: 'Collect 1 billion Golden Crumbs in total', flavor: 'Historians will call this era “the crispy times”.', check: totalCrumbs(1e9) },
    { id: 'recipe10', emoji: '📖', name: 'Recipe Scholar', goal: 'Get The family recipe to level 10', flavor: 'Chapter 10: “Never, ever wash the pan with soap.”', check: (s) => (s.prestige.perks.familyRecipe ?? 0) >= 10 },
    { id: 'recipe25', emoji: '🧙', name: 'Grand Master of the Recipe', goal: 'Get The family recipe to level 25', flavor: 'You can now make a schnitzel by thinking about it very hard.', check: (s) => (s.prestige.perks.familyRecipe ?? 0) >= 25 },
    { id: 'allPerks', emoji: '📚', name: 'Read the Whole Book', goal: 'Own every perk in the recipe book', flavor: 'The last page just says: “Now go and feed someone.”', check: (s) => PERKS.every((p) => (s.prestige.perks[p.id] ?? 0) > 0) },
    { id: 'allManagers', emoji: '🗂️', name: 'Middle Management', goal: 'Promote every manager', flavor: 'The family now holds meetings about meetings. With schnitzel.', check: (s) => PERKS.filter((p) => p.manager).every((p) => (s.prestige.perks[p.id] ?? 0) > 0) },
    { id: 'firstFork', emoji: '🍴', name: 'A Fork in the Road', goal: 'Pick a side in the family tree', flavor: 'Thin or thick, pigs or wheat. There is no wrong answer. (There is. Grandma knows.)', check: (s) => PERKS.some((p) => p.fork && (s.prestige.perks[p.id] ?? 0) > 0) },
    { id: 'forkSwap', emoji: '🔄', name: 'Changed My Mind', goal: 'Switch a choice in the family tree', flavor: 'Grandma pretends not to notice. She noticed.', check: (s) => Object.keys(s.run.forkSwaps ?? {}).length > 0 },
    { id: 'capstone1', emoji: '🌳', name: 'Top of the Tree', goal: 'Get a capstone in the family tree', flavor: 'The whole branch, done. The family is unbearably proud.', check: (s) => PERKS.some((p) => p.capstone && (s.prestige.perks[p.id] ?? 0) > 0) },
    { id: 'capstonesAll', emoji: '🏡', name: 'The Whole Family Tree', goal: 'Get all five capstones', flavor: 'Grandma’s lard, Uncle’s shed, Mum’s statue, Grandpa’s empire, the kid’s starships. Christmas will be unbearable.', check: (s) => PERKS.filter((p) => p.capstone).every((p) => (s.prestige.perks[p.id] ?? 0) > 0) },
    { id: 'crumbMiser', emoji: '🐉', name: 'Scrooge McCrumb', goal: 'Secret', flavor: 'A thousand Golden Crumbs unspent in your pocket. They’re not for spending. They’re for looking at.', secret: true, check: (s) => s.prestige.crumbs.gte(1e3) },
  ]),

  // ------------------------------------------------------------ farm
  ...cat('farm', [
    ...FARM_COUNTS.flatMap(([id, plural, emoji, n100, n400, flavor]) => [
      { id: `${id}100`, emoji, name: n100, goal: `Own 100 ${plural}`, flavor, check: building(id, 100) },
      { id: `${id}400`, emoji, name: n400, goal: `Own 400 ${plural}`, flavor: `400 of them. ${flavor}`, check: building(id, 400) },
    ]),
    { id: 'farm1k', emoji: '🏞️', name: 'Agro-Empire Strikes Back', goal: 'Own 1,000 farm buildings at once', flavor: 'Grandpa now commutes between barns by helicopter.', check: (s) => totalFacilities(s) >= 1000 },
    { id: 'farm5k', emoji: '🌐', name: 'Planet Farm', goal: 'Own 5,000 farm buildings at once', flavor: 'Seen from orbit, the fields spell “MORE CRUMBS”.', check: (s) => totalFacilities(s) >= 5000 },
    { id: 'farmGoalsAll', emoji: '🎯', name: 'Bullseye Barnyard', goal: 'Reach every count goal for one kind of farm building', flavor: `${FARM_GOALS[FARM_GOALS.length - 1].toLocaleString('en')} of one building. Grandpa has stopped counting and started humming.`, check: (s) => FACILITIES.some((f) => s.facilities[f.id] >= FARM_GOALS[FARM_GOALS.length - 1]) },
    { id: 'farmHandsAll', emoji: '🧑‍🌾', name: 'All Hands on Deck', goal: 'Get every family farm hand in one run', flavor: 'Pavel, Jarmila, Franta and little Bára. Christmas is cancelled; harvest is on.', check: (s) => farmHands().every((u) => s.upgrades[u.id]) },
    { id: 'farmGear10', emoji: '🔧', name: 'Gear Head', goal: 'Own 10 pieces of farm gear in one run', flavor: 'Grandpa has a shed for the gear. And a shed for the sheds.', check: (s) => farmGear().filter((u) => s.upgrades[u.id]).length >= 10 },
    { id: 'farmGear50', emoji: '🛠️', name: 'Tractor Pimp', goal: 'Own 50 pieces of farm gear in one run', flavor: 'The combine harvester has neon underlights now.', check: (s) => farmGear().filter((u) => s.upgrades[u.id]).length >= 50 },
    { id: 'farmGearAll', emoji: '🏆', name: 'Grandpa’s Pride', goal: 'Own every piece of farm gear in one run', flavor: 'He shed a single tear. It was immediately used to water the wheat.', check: (s) => farmGear().every((u) => s.upgrades[u.id]) },
    { id: 'buildingMaxed', emoji: '🥇', name: 'Best in Show', goal: 'Own every piece of gear for one farm building in one run', flavor: 'It has a sash. It has a rosette. It has its own fan club.', check: (s) => KITCHEN_FACILITIES.some((f) => farmGear().filter((u) => u.building === f.id).every((u) => s.upgrades[u.id])) },
    { id: 'pigsOnly', emoji: '🐽', name: 'Animal Farm', goal: 'Secret', flavor: '100 pig farms, not a single field. The pigs are thrilled. The bread is not.', secret: true, check: (s) => s.facilities.pigFarm >= 100 && s.facilities.wheatField === 0 },
  ]),

  // ------------------------------------------------------------ food critics (records only: no bonuses, see badgeBonus.ts)
  ...cat('critics', [
    { id: 'criticFirst', emoji: '🌟', name: 'Noted', goal: 'Earn a critic’s star anywhere', flavor: 'The critic wrote one word in the notebook. Mum has been guessing which word for a week.', check: (s) => starred(s, 1).length > 0 },
    { id: 'criticThree', emoji: '🏵️', name: 'Nothing to Complain About', goal: 'Earn ★★★ at a place', flavor: 'The critic left without a single note. It is the most upsetting day of their career.', check: (s) => starred(s, 3).length > 0 },
    { id: 'criticFive', emoji: '📰', name: 'Front Page', goal: 'Have ★★★ at five places at once', flavor: 'Five papers, one headline: “STILL HOT”.', check: (s) => starred(s, 3).length >= 5 },
    { id: 'criticAll', emoji: '🗞️', name: 'The Whole Guidebook', goal: 'Have ★★★ at every place you’ve opened (at least twelve)', flavor: 'The guidebook is now just your menu with a map stapled to it.', check: (s) => { const open = REGIONS.filter((r) => s.regions[r.id].unlocked).length; return open >= 12 && starred(s, 3).length === open } },
    { id: 'criticSpace', emoji: '🪐', name: 'Reviewed in Orbit', goal: 'Earn a critic’s star at a place in space', flavor: '“Arrived hot. In a vacuum. How?” The critic is still writing.', check: (s) => starred(s, 1).some((r) => r.space) },
    { id: 'criticVerse', emoji: '🍋', name: 'Critic of Everything', goal: 'Earn ★★★ in the Schnitzelverse', flavor: 'Every critic in every universe agreed. That has never happened before, about anything.', check: (s) => starred(s, 3).some((r) => r.id === 'schnitzelverse') },
    { id: 'fitOutsAll', emoji: '🔧', name: 'Tinkerer', goal: 'Fit a vehicle out for 📦 cargo and one for 🔥 express', flavor: 'Uncle has unscrewed every seat in the fleet at least once. He put most of them back.', check: (s) => !!s.fitOutsTried.cargo && !!s.fitOutsTried.express },
    { id: 'fleetGearAll', emoji: '🧳', name: 'Roof Rack on a Wormhole', goal: 'Own every piece of fleet gear in one run', flavor: 'Roof racks on the wormhole. Nobody asked. Everybody looked.', check: (s) => fleetGear().every((u) => s.upgrades[u.id]) },
  ]),
  // ------------------------------------------------------------ star paprika (records only: no bonuses, see badgeBonus.ts)
  ...cat('paprika', [
    { id: 'paprikaFirst', emoji: '🏜️', name: 'Red Sand, Big Plans', goal: 'Build your first paprika dunes', flavor: 'Grandma’s old tin, a little Martian sand, and a lot of questions nobody can answer.', check: building('paprikaDunes', 1) },
    { id: 'paprikaMill', emoji: '⚗️', name: 'Grind Time', goal: 'Build a paprika mill', flavor: 'The whole valley sneezes in unison. It is weirdly beautiful.', check: building('paprikaMill', 1) },
    { id: 'paprikaFold', emoji: '⛽', name: 'Fold Here', goal: 'Fly a schnitzel on fold paprika', flavor: 'Please keep your crust inside the vehicle at all times.', check: (s) => s.stats.paprikaBurned.gt(0) },
    { id: 'paprikaSails', emoji: '⛵', name: 'Becalmed', goal: 'Fly a million schnitzels on solar sails', flavor: 'They arrived. Eventually. Cold, and with a light tan.', check: (s) => s.stats.sailed.gte(1e6) },
    { id: 'paprikaTank', emoji: '🛢️', name: 'Full Tank', goal: 'Keep a million fold paprika in stock', flavor: 'Enough to fold the Solar System twice. Mum wants to know why the garage smells of Mars.', check: (s) => s.items.fold.gte(1e6) },
    { id: 'paprikaDunes50', emoji: '🪱', name: 'Worm Union', goal: 'Own 50 paprika dunes', flavor: 'The crumb worms have formed a union. Their only demand: more crusts.', check: building('paprikaDunes', 50) },
    { id: 'paprikaDeep', emoji: '🔮', name: 'Deep Fold', goal: 'Build a paprika distillery', flavor: 'Boiled down until space itself wrinkles. Do not sniff the lid.', check: building('paprikaDistillery', 1) },
    { id: 'paprikaWhistle', emoji: '📯', name: 'Worm Whisperer', goal: 'Get Grandma’s worm whistle', flavor: 'One blast and the worms leave the pipes alone. Two blasts and they come for dinner.', check: (s) => !!s.upgrades.paprikaDistillery_cluster },
    { id: 'paprikaBillion', emoji: '🤧', name: 'Sneeze Speed', goal: 'Burn a billion pinches of star paprika', flavor: 'Mission control has stopped asking how. Mission control has started sneezing.', check: (s) => s.stats.paprikaBurned.gte(1e9) },
    { id: 'paprikaGearAll', emoji: '🍋', name: 'The Last Pod', goal: 'Own every piece of paprika gear in one run', flavor: 'It folds space just by being looked at. Grandma keeps it in the spice rack anyway.', check: (s) => paprikaGear().every((u) => s.upgrades[u.id]) },
    { id: 'paprikaCosmic', emoji: '🌌', name: 'Fold the Universe', goal: 'Burn a quadrillion pinches of star paprika', flavor: 'Somewhere, a crumb worm the size of a galaxy smiles and asks for a crust.', check: (s) => s.stats.paprikaBurned.gte(1e15) },
  ]),

  // ------------------------------------------------------------ fleet
  ...cat('fleet', [
    { id: 'truck1', emoji: '🚚', name: 'Keep On Truckin’', goal: 'Buy a heated truck', flavor: 'The heater is set to “schnitzel”. There is no other setting.', check: vehicles('truck', 1) },
    { id: 'train1', emoji: '🚂', name: 'The Schnitzel Express', goal: 'Buy a schnitzel express', flavor: 'All aboard! Next stop: everywhere hungry.', check: vehicles('train', 1) },
    { id: 'vans100', emoji: '🚐', name: 'Van-tastic Hundred', goal: 'Own 100 delivery vans', flavor: 'The car park is now just one long, warm van.', check: vehicles('van', 100) },
    { id: 'trucks100', emoji: '🛻', name: 'Truck Stop Royalty', goal: 'Own 100 heated trucks', flavor: 'Every truck stop in the country has a framed photo of you.', check: vehicles('truck', 100) },
    { id: 'trains50', emoji: '🛤️', name: 'Gravy Train', goal: 'Own 50 schnitzel expresses', flavor: 'It’s not gravy. It’s lemon. Please don’t put gravy on it.', check: vehicles('train', 50) },
    { id: 'planes100', emoji: '🛫', name: 'Air Supremacy', goal: 'Own 100 cargo planes', flavor: 'Air traffic control just says “schnitzel incoming” now.', check: vehicles('plane', 100) },
    { id: 'fleet500', emoji: '🚦', name: 'Gridlock Gourmet', goal: 'Own 500 vehicles at once', flavor: 'Every traffic jam on the continent is yours.', check: (s) => totalVehicles(s) >= 500 },
    { id: 'fleet1k', emoji: '🛣️', name: 'Highway to Hungry', goal: 'Own 1,000 vehicles at once', flavor: 'The roads have been renamed. They’re all called Schnitzelstraße.', check: (s) => totalVehicles(s) >= 1000 },
    { id: 'vansOnly', emoji: '🤏', name: 'Small Business Energy', goal: 'Secret', flavor: 'Delivering to the whole country with nothing but vans. Hats off to the drivers.', secret: true, check: (s) => s.regions.country.unlocked && s.vehicles.van > 0 && VEHICLES.every((v) => v.id === 'van' || s.vehicles[v.id] === 0) },
  ]),

  // ------------------------------------------------------------ space
  ...cat('space', [
    { id: 'placeBelt', emoji: '🪨', name: 'Rock and Roll (Breaded)', goal: 'Deliver to the asteroid belt', flavor: 'The miners asked for something crunchy. They meant gravel. They got better.', check: place('belt') },
    { id: 'placeJupiter', emoji: '🟠', name: 'By Jove, It’s Crispy', goal: 'Deliver to Jupiter’s moons', flavor: 'Europa’s oceans are now 0.01% frying oil.', check: place('jupiter') },
    { id: 'cruiser1', emoji: '🛸', name: 'Cruise Control', goal: 'Buy a crust cruiser', flavor: 'It goes faster than light. The schnitzel arrives before you order it.', check: vehicles('cruiser', 1) },
    { id: 'rocket100', emoji: '🎆', name: 'Fireworks Lunch', goal: 'Own 100 schnitzel rockets', flavor: 'Every launch looks like New Year’s Eve. Every landing smells like Sunday.', check: vehicles('rocket', 100) },
    { id: 'ark10', emoji: '🚢', name: 'Armada of Abundance', goal: 'Own 10 schnitzel arks', flavor: 'Ten arks. Not a single animal on board. Just schnitzel.', check: vehicles('ark', 10) },
    { id: 'bestSolar', emoji: '🪐', name: 'Hello From the Other Side (of the Sun)', goal: 'Have reached the whole Solar System at least once', flavor: 'The Sun is the only thing hotter than your fryer. For now.', check: (s) => s.stats.bestPlace >= REGION_INDEX.solar },
  ]),

  // ------------------------------------------------------------ beyond (Chapter 5)
  ...cat('beyond', [
    { id: 'placeNextStar', emoji: '⭐', name: 'Neighbourly Light Years', goal: 'Deliver to the next-door star', flavor: 'Four light years for a schnitzel. Still hot. Still worth it.', check: place('nextStar') },
    { id: 'placeCluster', emoji: '✨', name: 'Star Struck', goal: 'Deliver to your star cluster', flavor: 'A few hundred suns, one golden crust.', check: place('cluster') },
    { id: 'placeMilkyWay', emoji: '🌀', name: 'Milky Way, Extra Crispy', goal: 'Deliver to the whole Milky Way', flavor: 'The galaxy was named after milk. It should have waited for you.', check: place('milkyWay') },
    { id: 'placeNextGalaxy', emoji: '🌫️', name: 'The Andromeda Strain (Breaded)', goal: 'Deliver to the next galaxy over', flavor: 'Highly contagious. Symptoms: craving crust.', check: place('nextGalaxy') },
    { id: 'placeLocalGroup', emoji: '🫧', name: 'Group Hug', goal: 'Deliver to the Local Group', flavor: 'Fifty galaxies, one big family lunch.', check: place('localGroup') },
    { id: 'placeUniverse', emoji: '🌌', name: 'Universal Lunch Break', goal: 'Deliver to the whole universe', flavor: 'Everywhere there is anything, there is now schnitzel.', check: place('universe') },
    { id: 'placeNextUniverse', emoji: '🚪', name: 'Knock Knock', goal: 'Deliver to the universe next door', flavor: 'Another universe, the same hungry faces, slightly different laws of gravy.', check: place('nextUniverse') },
    { id: 'placeSchnitzelverse', emoji: '🍋', name: 'The End (of the Pan)', goal: 'Deliver to the Schnitzelverse', flavor: 'Thin. Golden. Never soggy. Everywhere. Grandma was right all along.', check: place('schnitzelverse') },
    { id: 'warp1', emoji: '🌠', name: 'Warp Factor Lunch', goal: 'Buy a warp freighter', flavor: 'Engage. (The schnitzel, not the engines. Well, both.)', check: vehicles('warp', 1) },
    { id: 'warp100', emoji: '🚀', name: 'Warp Armada', goal: 'Own 100 warp freighters', flavor: 'Space bends around your delivery route out of respect.', check: vehicles('warp', 100) },
    { id: 'wormhole1', emoji: '🕳️', name: 'Down the Wormhole', goal: 'Open a wormhole gate', flavor: 'In one side in the garage, out the other side in another galaxy. Still sizzling.', check: vehicles('wormhole', 1) },
    { id: 'wormhole25', emoji: '🧀', name: 'Swiss Cheese Spacetime', goal: 'Own 25 wormhole gates', flavor: 'Physicists say spacetime now has more holes than it should. They’re eating while they say it.', check: vehicles('wormhole', 25) },
    { id: 'stasis', emoji: '🧊', name: 'Frozen in Time, Still Sizzling', goal: 'Get stasis crates', flavor: 'Fried today, eaten in a thousand years, still too hot to touch.', check: (s) => !!s.upgrades.stasisCrates },
    { id: 'cosmicCrew', emoji: '💥', name: 'The Kitchen at the End of the Universe', goal: 'Own all three Chapter 5 kitchen crews in one run', flavor: 'A black hole pounds, a galaxy breads, supernovas fry. Grandma supervises.', check: (s) => !!s.upgrades.singularityTenderizer && !!s.upgrades.crumbGalaxy && !!s.upgrades.supernovaFryers },
    { id: 'michelin', emoji: '⭐', name: 'Starred Review', goal: 'Earn three Michelin stars (actual stars)', flavor: 'The inspector cried. Then asked for seconds. Then for the recipe. No.', check: (s) => !!s.upgrades.michelinStars },
    { id: 'warpContractsMax', emoji: '📝', name: 'Signed, Sealed, Warped', goal: 'Get Warp contracts to the top level', flavor: 'Three warp freighters waiting at the garage every morning. The neighbours have complained about the parking.', check: (s) => (s.prestige.perks.warpContracts ?? 0) >= 3 },
    { id: 'speedMilkyWay', emoji: '🏎️', name: 'Galactic Speedrun', goal: 'Reach the whole Milky Way within 2 hours of a run', flavor: 'From an empty garage to four hundred billion stars before lunch.', check: speedrun('milkyWay', 120) },
    { id: 'speedUniverse', emoji: '⏱️', name: 'The Universe in a Lunch Break', goal: 'Reach the whole universe within 2 hours of a run', flavor: 'Big Bang to big lunch in two hours flat.', check: speedrun('universe', 120) },
    { id: 'gearSchnitzelverse', emoji: '👴', name: 'Grandpa of Everything', goal: 'Own a piece of Schnitzelverse farm gear', flavor: 'Grandpa now has a farm in every universe. He still wears the same hat.', check: (s) => farmGear().some((u) => u.requires?.place === 'schnitzelverse' && s.upgrades[u.id]) },
    { id: 'bestSchnitzelverse', emoji: '🏁', name: 'Been There, Fried That', goal: 'Have reached the Schnitzelverse at least once', flavor: 'You fed everything. Everything says thank you. Everything wants seconds.', check: (s) => s.stats.bestPlace >= REGION_INDEX.schnitzelverse },
    { id: 'fiveChapters', emoji: '📚', name: 'The Whole Story', goal: 'Reach Chapter 5', flavor: 'A garage, a farm, a road, the stars, and then everything else.', check: (s) => !!s.milestones.solar || s.regions.solar.unlocked },
  ]),

  // ------------------------------------------------------------ shame
  ...cat('shame', [
    { id: 'cold1b', emoji: '🧊', name: 'Permafrost Platter', goal: 'Serve 1 billion cold schnitzels', flavor: 'Penguins have started ordering. They love it.', check: (s) => s.stats.servedCold.gte(1e9) },
    { id: 'cold1t', emoji: '🥶', name: 'Absolute Zero Tolerance', goal: 'Serve 1 trillion cold schnitzels', flavor: 'Somewhere, a physicist measured one at −273 °C. It was still a little soggy.', check: (s) => s.stats.servedCold.gte(1e12) },
    { id: 'rescue50', emoji: '🛋️', name: 'Basement Dweller', goal: 'Get rescued by Mum 50 times', flavor: 'She’s turned your room into a pantry. You’re still in it.', check: (s) => s.stats.rescues >= 50 },
    { id: 'soldOut1k', emoji: '📦', name: 'Shelf Destroyer', goal: 'Empty the corner shop’s shelves 1,000 times', flavor: 'Mrs. Horáková now restocks with a bulldozer.', check: (s) => s.stats.soldOut >= 1000 },
    { id: 'soldOut100k', emoji: '🌪️', name: 'Supply Chain Tornado', goal: 'Empty the shop’s shelves 100,000 times', flavor: 'Economists study you. Mostly with fear.', check: (s) => s.stats.soldOut >= 1e5 },
    { id: 'tooHot', emoji: '🔥', name: 'Charcoal Chef', goal: 'Turn the fryer all the way up', flavor: 'Faster! Darker! Crispier! The smoke alarm has filed for divorce.', check: (s) => s.crisp.unlocked && s.crisp.temperature >= 190 },
    { id: 'tooCold', emoji: '🫠', name: 'Soggy Bottom', goal: 'Turn the fryer all the way down', flavor: 'It’s more of a warm bath for the cutlet, really.', check: (s) => s.crisp.unlocked && s.crisp.temperature <= 150 },
    { id: 'coldPile', emoji: '🗻', name: 'Glacier in the Garage', goal: 'Have 1 million cold schnitzels waiting at once', flavor: 'They’re not leftovers. They’re a monument.', check: (s) => s.items.cold.gte(1e6) },
    { id: 'orderPile', emoji: '📞', name: 'Your Call Is Important to Us', goal: 'Let 1 million orders pile up in one place', flavor: 'The hold music is a frying sound. On loop. Forever.', check: (s) => REGIONS.some((r) => s.regions[r.id].orders.gte(1e6)) },
  ]),

  // ------------------------------------------------------------ made by hand (no bonus)
  ...cat('byHand', [
    { id: 'pound1k', emoji: '🦍', name: 'Gorilla Grip', goal: 'Pound 1,000 cutlets by hand', flavor: 'Your mallet arm has its own postcode now.', check: byHand('pound', 1000) },
    { id: 'pound10k', emoji: '⚒️', name: 'Thor’s Little Helper', goal: 'Pound 10,000 cutlets by hand', flavor: 'Thor asked to borrow your mallet. You said no.', check: byHand('pound', 1e4) },
    { id: 'bread1k', emoji: '🧤', name: 'Wet Hand, Dry Hand', goal: 'Bread 1,000 cutlets by hand', flavor: 'You have mastered the ancient art. Your sleeves have not.', check: byHand('bread', 1000) },
    { id: 'bread10k', emoji: '🥋', name: 'Crumb Fu', goal: 'Bread 10,000 cutlets by hand', flavor: 'Flour. Egg. Crumbs. Flour. Egg. Crumbs. You hear it in your sleep.', check: byHand('bread', 1e4) },
    { id: 'fry1k', emoji: '🫳', name: 'Asbestos Fingers', goal: 'Fry 1,000 schnitzels by hand', flavor: 'You flip them with your fingers now. Don’t try this at home. You are at home.', check: byHand('fry', 1000) },
    { id: 'fry10k', emoji: '🐉', name: 'Dragon of the Pan', goal: 'Fry 10,000 schnitzels by hand', flavor: 'You breathe on the oil to heat it. Grandma is impressed and slightly worried.', check: byHand('fry', 1e4) },
  ]),

  // ------------------------------------------------------------ badge hunt
  ...cat('collector', [
    { id: 'badges25', emoji: '🎖️', name: 'Badge Rookie', goal: 'Earn 25 badges', flavor: 'Your apron is starting to clink when you walk.', check: badgeCount(25) },
    { id: 'badges50', emoji: '🏅', name: 'Decorated Veteran of the Fryer', goal: 'Earn 50 badges', flavor: 'You need a second apron for the badges.', check: badgeCount(50) },
    { id: 'badges100', emoji: '🎗️', name: 'Badge of Honour', goal: 'Earn 100 badges', flavor: 'The badges now have badges.', check: badgeCount(100) },
    { id: 'badges150', emoji: '🧥', name: 'Heavier Than the Mallet', goal: 'Earn 150 badges', flavor: 'Your apron weighs more than Uncle’s mallet. He is jealous.', check: badgeCount(150) },
    { id: 'badges200', emoji: '🏛️', name: 'Museum of Me', goal: 'Earn 200 badges', flavor: 'Tickets are €5. Includes a schnitzel.', check: badgeCount(200) },
    { id: 'badges250', emoji: '👑', name: 'Badge Emperor', goal: 'Earn 250 badges', flavor: 'You don’t collect badges any more. Badges collect you.', check: badgeCount(250) },
  ]),

  // ------------------------------------------------------------ misc
  ...cat('misc', [
    { id: 'clicks100k', emoji: '🖱️', name: 'Mouse Murderer', goal: 'Click 100,000 times', flavor: 'Your mouse has applied for early retirement.', check: (s) => s.stats.clicks >= 1e5 },
    { id: 'knock1k', emoji: '🚪', name: 'Knock Knock. Who’s There? Schnitzel.', goal: 'Knock on doors 1,000 times', flavor: 'Schnitzel who? Schnitzel you later, I’ve got 999 more doors.', check: (s) => s.stats.knocks >= 1000 },
    { id: 'knock10k', emoji: '🔔', name: 'Doorbell Destroyer', goal: 'Knock on doors 10,000 times', flavor: 'The street has installed a schnitzel flap.', check: (s) => s.stats.knocks >= 1e4 },
    { id: 'hour24', emoji: '🌅', name: 'A Whole Day of Frying', goal: 'Play for 24 hours', flavor: 'Twenty-four hours. The fryer has developed a personality.', check: hours(24) },
    { id: 'hour48', emoji: '🗓️', name: 'Weekend Warrior', goal: 'Play for 48 hours', flavor: 'An entire weekend. You regret nothing. You smell of oil.', check: hours(48) },
    { id: 'hour250', emoji: '🧓', name: 'Grew a Beard Over the Pan', goal: 'Play for 250 hours', flavor: 'It caught fire twice. You kept frying.', check: hours(250) },
    { id: 'hour500', emoji: '🏚️', name: 'Never Left the Garage', goal: 'Play for 500 hours', flavor: 'Dad has given up on parking the car in there.', check: hours(500) },
    { id: 'hour1000', emoji: '⌛', name: 'Thousand-Hour Crust', goal: 'Play for 1,000 hours', flavor: 'They say mastery takes 10,000 hours. You’re a tenth of the way to breadcrumb enlightenment.', check: hours(1000) },
    { id: 'longRun', emoji: '🐢', name: 'Commitment Issues? Never.', goal: 'Keep one run going for 24 hours', flavor: 'A full day without selling. The garage has never felt so loved.', check: (s) => s.run.time >= 86400 },
    { id: 'longRun3d', emoji: '🦕', name: 'The Long Fry', goal: 'Keep one run going for 3 days', flavor: 'At this point the fryer is a family heirloom.', check: (s) => s.run.time >= 3 * 86400 },
    { id: 'upgrades50', emoji: '🧲', name: 'Gadget Magnet', goal: 'Own 50 upgrades in one run', flavor: 'There is a gadget for flipping the gadget that flips the schnitzel.', check: (s) => ownedUpgrades(s) >= 50 },
    { id: 'upgrades100', emoji: '🤖', name: 'More Machine Than Kitchen', goal: 'Own 100 upgrades in one run', flavor: 'The garage hums. The garage beeps. The garage may be sentient.', check: (s) => ownedUpgrades(s) >= 100 },
    { id: 'upgrades150', emoji: '🚀', name: 'Overengineered', goal: 'Own 150 upgrades in one run', flavor: 'NASA called. They want to borrow your toaster.', check: (s) => ownedUpgrades(s) >= 150 },
    { id: 'shopAll', emoji: '🏪', name: 'Mrs. Horáková’s Pension Plan', goal: 'Buy every corner shop upgrade in one run', flavor: 'She retired to a villa by the sea. It’s shaped like a shopping basket.', check: (s) => SHOP_GEAR.every((id) => s.upgrades[id]) },
    { id: 'crisp50', emoji: '🥇', name: 'Audibly Crispy', goal: 'Get crispness to +50%', flavor: 'You can hear it from the next room. You can hear it from the next town.', check: (s) => crispness(s) >= 0.5 },
    { id: 'crisp100', emoji: '💥', name: 'Sonic Crunch', goal: 'Get crispness to +100%', flavor: 'Every bite breaks the sound barrier.', check: (s) => crispness(s) >= 1 },
    { id: 'hotPile', emoji: '♨️', name: 'Heat Wave', goal: 'Have 1 million hot schnitzels waiting at once', flavor: 'The garage is now the warmest place in Europe.', check: (s) => s.items.hot.gte(1e6) },
    { id: 'meatPile', emoji: '🥩', name: 'Meat Mountain', goal: 'Secret', flavor: 'A million cutlets in stock. The freezer has its own weather.', secret: true, check: (s) => s.items.meat.gte(1e6) },
    { id: 'eggPile', emoji: '🥚', name: 'Egg Avalanche', goal: 'Secret', flavor: 'A million eggs. Do not, under any circumstances, sneeze.', secret: true, check: (s) => s.items.eggs.gte(1e6) },
    { id: 'oilPile', emoji: '🛢️', name: 'Oil Baron', goal: 'Secret', flavor: 'A million litres of oil. Several countries want a word.', secret: true, check: (s) => s.items.oil.gte(1e6) },
    { id: 'lemon100', emoji: '🍋', name: 'When Life Gives You Lemons', goal: 'Secret', flavor: 'Clicked the logo 100 times. Make schnitzel. Always make schnitzel.', secret: true, check: (s) => s.stats.logoClicks >= 100 },
    { id: 'lemon1k', emoji: '🍹', name: 'Lemon Addict', goal: 'Secret', flavor: 'A thousand clicks on the logo. The plate is getting dizzy.', secret: true, check: (s) => s.stats.logoClicks >= 1000 },
    { id: 'nerd', emoji: '🤓', name: 'Scientific Method', goal: 'Secret', flavor: 'Switched to scientific numbers. 1.00e0 schnitzel please.', secret: true, check: (s) => s.settings.notation === 'scientific' },
    { id: 'bigText', emoji: '👓', name: 'Grandpa’s Glasses', goal: 'Secret', flavor: 'Extra large text. Grandpa can finally read the menu. He orders schnitzel.', secret: true, check: (s) => s.settings.uiScale === 'xl' },
    { id: 'noPopups', emoji: '🤐', name: 'The Silent Treatment', goal: 'Secret', flavor: 'Turned off badge pop-ups. And yet, here’s one. Sort of.', secret: true, check: (s) => !s.settings.badgePopups },
    { id: 'micromanager', emoji: '🙅', name: 'Micromanager', goal: 'Secret', flavor: 'Promoted three managers, switched them all off. “I’ll do it myself,” you said.', secret: true, check: (s) => {
      const bought = PERKS.filter((p) => p.manager && (s.prestige.perks[p.id] ?? 0) > 0)
      return bought.length >= 3 && bought.every((p) => s.managersOff[p.id])
    } },
    { id: 'hotOnly', emoji: '😇', name: 'Never Served Cold', goal: 'Secret', flavor: '10,000 schnitzels served and not one of them cold. Mr. Dvořák is almost disappointed.', secret: true, check: (s) => s.stats.served.gte(1e4) && s.stats.servedCold.lt(1) },
    { id: 'palindrome', emoji: '🪞', name: 'Palindrome Payday', goal: 'Secret', flavor: 'Exactly $12,321 in hand. Read it backwards. Still money.', secret: true, check: (s) => s.money.floor().eq(12321) },
    { id: 'leet', emoji: '💾', name: 'L33T Fryer', goal: 'Secret', flavor: 'Exactly 1,337 schnitzels served. You are now a hacker. Of cutlets.', secret: true, check: (s) => s.stats.served.floor().eq(1337) },
  ]),
]
