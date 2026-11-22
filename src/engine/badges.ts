// Badges: silly achievements. Earned badges survive every franchise.
// The hard ones also add a little income (see badgeBonus.ts).
import { FACILITIES, REGIONS, UPGRADES, VEHICLES, WORKERS, type RegionId, type StageId } from './content'
import { D } from './decimal'
import { TIERS } from './tiers'
import { MORE_BADGES } from './badgesExtra'
import type { GameState } from './state'

export type BadgeCategory =
  | 'promotions'
  | 'served'
  | 'money'
  | 'family'
  | 'places'
  | 'franchise'
  | 'farm'
  | 'fleet'
  | 'space'
  | 'beyond'
  | 'fame'
  | 'shame'
  | 'byHand'
  | 'collector'
  | 'misc'

export interface BadgeDef {
  id: string
  category: BadgeCategory
  emoji: string
  name: string
  /** What you have to do. Shown while locked, unless the badge is secret. */
  goal: string
  /** The joke, revealed when earned. */
  flavor: string
  secret?: boolean
  check: (s: GameState) => boolean
}

export const BADGE_CATEGORIES: { id: BadgeCategory; name: string }[] = [
  { id: 'promotions', name: 'Promotions' },
  { id: 'served', name: 'Schnitzels served' },
  { id: 'money', name: 'Money' },
  { id: 'fame', name: 'Fame' },
  { id: 'family', name: 'Family & staff' },
  { id: 'places', name: 'Places' },
  { id: 'franchise', name: 'Franchise' },
  { id: 'farm', name: 'The farm' },
  { id: 'fleet', name: 'On the road' },
  { id: 'space', name: 'The stars' },
  { id: 'beyond', name: 'The Schnitzelverse' },
  { id: 'shame', name: 'Hall of shame' },
  { id: 'byHand', name: 'Made by hand' },
  { id: 'collector', name: 'Badge hunter' },
  { id: 'misc', name: 'Odds & ends' },
]

const served = (n: number) => (s: GameState) => s.stats.served.gte(n)
const earned = (n: number) => (s: GameState) => s.stats.earned.gte(n)
const workers = (id: (typeof WORKERS)[number]['id'], n: number) => (s: GameState) => s.workers[id] >= n
const place = (id: RegionId) => (s: GameState) => s.regions[id].unlocked
const byHand = (stage: StageId, n: number) => (s: GameState) => s.stats.byHand[stage] >= n
const totalFacilities = (s: GameState) => FACILITIES.reduce((n, f) => n + s.facilities[f.id], 0)
const totalVehicles = (s: GameState) => VEHICLES.reduce((n, v) => n + s.vehicles[v.id], 0)

/** Every level a pipeline tab can reach (beyond the first) is a promotion badge. */
const PROMOTIONS: BadgeDef[] = (['prep', 'making', 'distribution'] as const).flatMap((pillar) =>
  TIERS[pillar].slice(1).map((t, i) => ({
    id: `tier-${pillar}-${i + 1}`,
    category: 'promotions' as const,
    emoji: t.emoji,
    name: `Promoted: ${t.name}`,
    goal: t.goal,
    flavor: t.flavor,
    check: t.reached,
  })),
)

export const BADGES: BadgeDef[] = [
  ...PROMOTIONS,
  // ------------------------------------------------------------ served
  { id: 'served1', category: 'served', emoji: '🍽️', name: 'Beginner’s Luck', goal: 'Serve your first schnitzel', flavor: 'Mrs. Novák is hooked. There is no going back.', check: served(1) },
  { id: 'served10', category: 'served', emoji: '🔟', name: 'Neighbourhood Watch', goal: 'Serve 10 schnitzels', flavor: 'The whole street now “just happens to walk by” at lunchtime.', check: served(10) },
  { id: 'served100', category: 'served', emoji: '💯', name: 'Centurion of Crust', goal: 'Serve 100 schnitzels', flavor: 'Veni, vidi, frixi. I came, I saw, I fried.', check: served(100) },
  { id: 'served1k', category: 'served', emoji: '🥖', name: 'Breadcrumb Trail', goal: 'Serve 1,000 schnitzels', flavor: 'Hansel and Gretel would never get lost in your garage.', check: served(1e3) },
  { id: 'served10k', category: 'served', emoji: '🥋', name: 'Golden Brown Belt', goal: 'Serve 10,000 schnitzels', flavor: 'One more dan and you can pound with your bare hands.', check: served(1e4) },
  { id: 'served100k', category: 'served', emoji: '🧘', name: 'Schnitzel Sensei', goal: 'Serve 100,000 schnitzels', flavor: 'Wax on, flour off.', check: served(1e5) },
  { id: 'served1m', category: 'served', emoji: '🎉', name: 'Millionaire (in Schnitzels)', goal: 'Serve 1 million schnitzels', flavor: 'Your bank says that doesn’t count. Your heart says it does.', check: served(1e6) },
  { id: 'served10m', category: 'served', emoji: '🔨', name: 'Pound for Pound', goal: 'Serve 10 million schnitzels', flavor: 'Ten million cutlets, flattened. Physicists are concerned.', check: served(1e7) },
  { id: 'served100m', category: 'served', emoji: '🏟️', name: 'Stadium Snack', goal: 'Serve 100 million schnitzels', flavor: 'Enough to cover every football pitch in Europe. Twice.', check: served(1e8) },
  { id: 'served1b', category: 'served', emoji: '🅱️', name: 'Billion with a B', goal: 'Serve 1 billion schnitzels', flavor: 'B for breaded. Obviously.', check: served(1e9) },
  { id: 'served10b', category: 'served', emoji: '🌍', name: 'More Schnitzels Than People', goal: 'Serve 10 billion schnitzels', flavor: 'Everyone on Earth has had one. Some had seconds.', check: served(1e10) },
  { id: 'served1t', category: 'served', emoji: '🌌', name: 'Schnitzel Singularity', goal: 'Serve 1 trillion schnitzels', flavor: 'The crust has achieved self-awareness. It is delicious.', check: served(1e12) },

  // ------------------------------------------------------------ money
  { id: 'money1k', category: 'money', emoji: '🪙', name: 'Pocket Money', goal: 'Earn $1,000 in total', flavor: 'Dad wants rent for the garage now.', check: earned(1e3) },
  { id: 'money1m', category: 'money', emoji: '💰', name: 'Garage Millionaire', goal: 'Earn $1 million in total', flavor: 'Still parks the bike next to the fryer.', check: earned(1e6) },
  { id: 'money1b', category: 'money', emoji: '🏦', name: 'Breaded Billionaire', goal: 'Earn $1 billion in total', flavor: 'Your accountant now speaks only in schnitzels.', check: earned(1e9) },
  { id: 'money1t', category: 'money', emoji: '👑', name: 'Trillionaire of Crunch', goal: 'Earn $1 trillion in total', flavor: 'You could buy a small country. You’d rather feed it.', check: earned(1e12) },
  { id: 'moneyBroke', category: 'money', emoji: '🕳️', name: 'Easy Come, Easy Go', goal: 'Have less than $1 after earning $1,000', flavor: 'Money is just schnitzel that hasn’t been fried yet.', secret: true, check: (s) => s.stats.earned.gte(1e3) && s.money.lt(1) },

  // ------------------------------------------------------------ family
  { id: 'firstHelper', category: 'family', emoji: '👨‍🦳', name: 'It’s a Family Business', goal: 'Hire your first helper', flavor: 'Paid in schnitzels and guilt.', check: (s) => WORKERS.some((w) => s.workers[w.id] > 0) },
  { id: 'wholeFamily', category: 'family', emoji: '👨‍👩‍👧‍👦', name: 'Hire the Whole Family', goal: 'Have every kind of helper at once', flavor: 'Christmas dinner is now a staff meeting.', check: (s) => WORKERS.every((w) => s.workers[w.id] > 0) },
  { id: 'grandmas10', category: 'family', emoji: '👵', name: 'Grandma Gang', goal: 'Have 10 grandmas', flavor: 'Nobody asks where they all came from.', check: workers('grandma', 10) },
  { id: 'grandmas100', category: 'family', emoji: '🧓', name: 'Grandmageddon', goal: 'Have 100 grandmas', flavor: 'They have unionised. Their only demand: you eat more.', check: workers('grandma', 100) },
  { id: 'uncles50', category: 'family', emoji: '🔨', name: 'Uncle-ception', goal: 'Have 50 uncles with mallets', flavor: 'The neighbours think it’s a drum circle.', check: workers('uncle', 50) },
  { id: 'cousins50', category: 'family', emoji: '🧑‍🍳', name: 'Kissing Cousins of the Fryer', goal: 'Have 50 cousins at the stove', flavor: 'Collectively, they have zero eyebrows.', check: workers('cousin', 50) },
  { id: 'kids25', category: 'family', emoji: '🚲', name: 'Tour de Schnitzel', goal: 'Have 25 kids on bikes', flavor: 'The peloton smells amazing.', check: workers('kid', 25) },
  { id: 'kids100', category: 'family', emoji: '🚴', name: 'The Paperboy Union', goal: 'Have 100 kids on bikes', flavor: 'Demands: more pocket money, fewer hills.', check: workers('kid', 100) },
  { id: 'family500', category: 'family', emoji: '🏘️', name: 'Is This a Cult?', goal: 'Have 500 helpers at once', flavor: 'It’s not a cult. It’s a family. With a logo.', check: (s) => WORKERS.reduce((n, w) => n + s.workers[w.id], 0) >= 500 },

  // ------------------------------------------------------------ places
  { id: 'placeFriends', category: 'places', emoji: '🍻', name: 'Party Animal', goal: 'Deliver to your friends', flavor: 'The garage party never really ended.', check: place('friends') },
  { id: 'placeTown', category: 'places', emoji: '🌆', name: 'Mayor’s Favourite', goal: 'Deliver to the whole town', flavor: 'There is talk of a statue. Of the schnitzel, not you.', check: place('town') },
  { id: 'placeCity', category: 'places', emoji: '🌃', name: 'Big City Crumbs', goal: 'Deliver to the city', flavor: 'The food critic gave you five stars and a lemon.', check: place('city') },
  { id: 'placeCountry', category: 'places', emoji: '🏞️', name: 'National Dish', goal: 'Deliver to the whole country', flavor: 'It was already the national dish. Now it’s officially yours.', check: place('country') },
  { id: 'placeContinent', category: 'places', emoji: '🌍', name: 'Continental Lunch', goal: 'Deliver to the whole continent', flavor: 'Forty countries, one crust.', check: place('continent') },
  { id: 'placePlanet', category: 'places', emoji: '🌐', name: 'Global Crunch', goal: 'Deliver to the whole planet', flavor: 'The sun never sets on a schnitzel.', check: place('planet') },
  { id: 'speedTown', category: 'places', emoji: '⏱️', name: 'Speedrun to Town', goal: 'Reach the whole town within 30 minutes of a run', flavor: 'Any% schnitzel, no glitches.', check: (s) => s.regions.town.unlocked && s.run.time <= 30 * 60 },
  { id: 'blitzTown', category: 'places', emoji: '⚡', name: 'Blitzschnitzel', goal: 'Reach the whole town within 5 minutes of a run', flavor: 'The mayor didn’t even have time to put on a tie.', check: (s) => s.regions.town.unlocked && s.run.time <= 5 * 60 },

  // ------------------------------------------------------------ franchise
  { id: 'franchise1', category: 'franchise', emoji: '✨', name: 'Sold Out (Literally)', goal: 'Franchise for the first time', flavor: 'You sold the garage. You kept the mallet.', check: (s) => s.prestige.franchises >= 1 },
  { id: 'franchise5', category: 'franchise', emoji: '🔁', name: 'Serial Seller', goal: 'Franchise 5 times', flavor: 'The estate agent sends you birthday cards now.', check: (s) => s.prestige.franchises >= 5 },
  { id: 'franchise10', category: 'franchise', emoji: '🤒', name: 'Franchise Fever', goal: 'Franchise 10 times', flavor: 'Symptoms include golden fingertips and selling things.', check: (s) => s.prestige.franchises >= 10 },
  { id: 'franchise25', category: 'franchise', emoji: '🙃', name: 'Have You Tried Not Selling?', goal: 'Franchise 25 times', flavor: 'Somewhere, a franchisee is very confused.', check: (s) => s.prestige.franchises >= 25 },
  { id: 'crumbs100', category: 'franchise', emoji: '🪙', name: 'Crumb Collector', goal: 'Collect 100 Golden Crumbs in total', flavor: 'Hoovering them up one by one.', check: (s) => s.prestige.totalCrumbs.gte(100) },
  { id: 'crumbs1k', category: 'franchise', emoji: '🐉', name: 'Crumb Dragon', goal: 'Collect 1,000 Golden Crumbs in total', flavor: 'You sleep on a hoard of them. It’s itchy.', check: (s) => s.prestige.totalCrumbs.gte(1e3) },
  { id: 'firstPerk', category: 'franchise', emoji: '📜', name: 'Recipe Reader', goal: 'Buy your first perk', flavor: 'Page one: “Step one, have a grandma.”', check: (s) => Object.values(s.prestige.perks).some((l) => (l ?? 0) > 0) },
  { id: 'recipe5', category: 'franchise', emoji: '🤫', name: 'The Secret’s Out', goal: 'Get The family recipe to level 5', flavor: 'It was lard. It was always lard.', check: (s) => (s.prestige.perks.familyRecipe ?? 0) >= 5 },

  // ------------------------------------------------------------ farm
  { id: 'farm1', category: 'farm', emoji: '🚜', name: 'Old MacSchnitzel', goal: 'Build your first farm building', flavor: 'E-I-E-I-Oil.', check: (s) => totalFacilities(s) >= 1 },
  { id: 'farmAll', category: 'farm', emoji: '🧺', name: 'Farm to Pan', goal: 'Own every kind of farm building at once', flavor: 'The shortest supply chain in history: from Grandpa to the pan.', check: (s) => FACILITIES.every((f) => s.facilities[f.id] > 0) },
  { id: 'pigs25', category: 'farm', emoji: '🐖', name: 'This Little Piggy', goal: 'Own 25 pig farms', flavor: 'Went to market. Did not come back.', check: (s) => s.facilities.pigFarm >= 25 },
  { id: 'coops25', category: 'farm', emoji: '🥚', name: 'Egg-cellent Work', goal: 'Own 25 chicken coops', flavor: 'Which came first? Your breading station.', check: (s) => s.facilities.coop >= 25 },
  { id: 'bakery10', category: 'farm', emoji: '🥖', name: 'Crumby Business', goal: 'Own 10 bakeries', flavor: 'They bake bread purely to destroy it. Like art.', check: (s) => s.facilities.bakery >= 10 },
  { id: 'farm250', category: 'farm', emoji: '🌾', name: 'Big Agriculture', goal: 'Own 250 farm buildings at once', flavor: 'Grandpa can no longer see the house from the tractor.', check: (s) => totalFacilities(s) >= 250 },

  // ------------------------------------------------------------ fleet
  { id: 'vehicle1', category: 'fleet', emoji: '🚐', name: 'Road Trip!', goal: 'Buy your first vehicle', flavor: 'Snacks for the drive: guess what.', check: (s) => totalVehicles(s) >= 1 },
  { id: 'plane1', category: 'fleet', emoji: '✈️', name: 'Flight of the Schnitzel', goal: 'Buy a cargo plane', flavor: 'Chicken or schnitzel? Schnitzel. Always schnitzel.', check: (s) => s.vehicles.plane >= 1 },
  { id: 'fleetAll', category: 'fleet', emoji: '🗺️', name: 'Logistics Nerd', goal: 'Own every kind of vehicle at once', flavor: 'You now say “last mile” at dinner parties.', check: (s) => VEHICLES.every((v) => s.vehicles[v.id] > 0) },
  { id: 'fleet100', category: 'fleet', emoji: '🚛', name: 'Convoy', goal: 'Own 100 vehicles at once', flavor: 'Ten-four, good buddy. Over and out-fried.', check: (s) => totalVehicles(s) >= 100 },

  // ------------------------------------------------------------ space
  { id: 'placeOrbit', category: 'space', emoji: '🛰️', name: 'Low Earth Orbit, High Crust Standards', goal: 'Deliver to the orbital station', flavor: 'Houston, we have a schnitzel.', check: place('orbit') },
  { id: 'placeMoon', category: 'space', emoji: '🌕', name: 'Fly Me to the Moon', goal: 'Deliver to the Moon base', flavor: 'The Moon is not made of cheese. It is now partly made of crumbs.', check: place('moon') },
  { id: 'placeMars', category: 'space', emoji: '🔴', name: 'Red Planet, Golden Crust', goal: 'Deliver to the Mars colony', flavor: 'The rover found traces of breadcrumbs. Yours.', check: place('mars') },
  { id: 'placeSolar', category: 'space', emoji: '☀️', name: 'Schnitzel of the Spheres', goal: 'Deliver to the whole Solar System', flavor: 'Even Pluto got one. Pluto is a planet again, out of gratitude.', check: place('solar') },
  { id: 'rocket10', category: 'space', emoji: '🚀', name: 'Launch Window', goal: 'Own 10 schnitzel rockets at once', flavor: 'Lift-off every lunch break.', check: (s) => s.vehicles.rocket >= 10 },
  { id: 'arkFleet', category: 'space', emoji: '🌌', name: 'Noah’s Schnitzel', goal: 'Own a schnitzel ark', flavor: 'Two by two, golden and crisp.', check: (s) => s.vehicles.ark >= 1 },

  // ------------------------------------------------------------ shame
  { id: 'cold1', category: 'shame', emoji: '🧊', name: 'Lukewarm Welcome', goal: 'Serve a cold schnitzel', flavor: 'Mr. Dvořák ate it anyway. He’s a saint.', check: (s) => s.stats.servedCold.gte(1) },
  { id: 'cold1k', category: 'shame', emoji: '🥶', name: 'Cold Shoulder', goal: 'Serve 1,000 cold schnitzels', flavor: 'Some people call it “schnitzel carpaccio”. Nobody does.', check: (s) => s.stats.servedCold.gte(1e3) },
  { id: 'cold1m', category: 'shame', emoji: '🏔️', name: 'Ice Age', goal: 'Serve 1 million cold schnitzels', flavor: 'A mammoth was found frozen inside one.', check: (s) => s.stats.servedCold.gte(1e6) },
  { id: 'rescue1', category: 'shame', emoji: '🧺', name: 'Mum’s Fridge', goal: 'Get rescued by Mum', flavor: 'Every empire starts with a parent’s fridge.', check: (s) => s.stats.rescues >= 1 },
  { id: 'rescue10', category: 'shame', emoji: '🏠', name: 'Still Living at Home', goal: 'Get rescued by Mum 10 times', flavor: 'She has started labelling the yoghurts.', check: (s) => s.stats.rescues >= 10 },
  { id: 'soldOut', category: 'shame', emoji: '🛒', name: 'Bought Out Mrs. Horáková', goal: 'Empty the corner shop’s shelves', flavor: 'She has never been this rich or this tired.', check: (s) => s.stats.soldOut > 0 },

  // ------------------------------------------------------------ made by hand (no bonus: just for the joy of it)
  { id: 'pound1', category: 'byHand', emoji: '🔨', name: 'Meat Your Maker', goal: 'Pound a cutlet by hand', flavor: 'Thwack. Next door, the dog has opinions about this.', check: byHand('pound', 1) },
  { id: 'pound10', category: 'byHand', emoji: '💪', name: 'Ten-Pound Weakling', goal: 'Pound 10 cutlets by hand', flavor: 'Your mallet arm is now visibly bigger than the other one.', check: byHand('pound', 10) },
  { id: 'pound100', category: 'byHand', emoji: '🥁', name: 'Hammer Time', goal: 'Pound 100 cutlets by hand', flavor: 'Uncle wipes away a tear: “You hold it just like I did in ’82.”', check: byHand('pound', 100) },
  { id: 'bread1', category: 'byHand', emoji: '🥚', name: 'Crumb Together', goal: 'Bread a cutlet by hand', flavor: 'Flour, egg, crumbs. There is flour in your eyebrow now. Forever.', check: byHand('bread', 1) },
  { id: 'bread10', category: 'byHand', emoji: '🙌', name: 'Dip Dip Hooray', goal: 'Bread 10 cutlets by hand', flavor: 'One hand is the “dry hand”. The other hand has given up on life.', check: byHand('bread', 10) },
  { id: 'bread100', category: 'byHand', emoji: '🍞', name: 'The Breadwinner', goal: 'Bread 100 cutlets by hand', flavor: 'Grandma inspected one, nodded, and said nothing. That is the highest honour there is.', check: byHand('bread', 100) },
  { id: 'fry1', category: 'byHand', emoji: '🍳', name: 'Baptism by Oil', goal: 'Fry a schnitzel by hand', flavor: 'It sizzled. You flinched. The smoke alarm gave a standing ovation.', check: byHand('fry', 1) },
  { id: 'fry10', category: 'byHand', emoji: '👂', name: 'Fry Hard', goal: 'Fry 10 schnitzels by hand', flavor: 'You can now tell the oil temperature by the sound alone. And by your screaming.', check: byHand('fry', 10) },
  { id: 'fry100', category: 'byHand', emoji: '👑', name: 'Lord of the Fries', goal: 'Fry 100 schnitzels by hand', flavor: 'One pan to rule them all. Your eyebrows are a distant memory.', check: byHand('fry', 100) },

  // ------------------------------------------------------------ misc
  { id: 'knock100', category: 'misc', emoji: '📣', name: 'Door-to-Door Salesman', goal: 'Knock on doors 100 times', flavor: 'Half the street pretends not to be home. The other half orders two.', check: (s) => s.stats.knocks >= 100 },
  { id: 'clicks100', category: 'misc', emoji: '👆', name: 'Clicky Fingers', goal: 'Click 100 times', flavor: 'Your mouse is starting to smell of oil.', check: (s) => s.stats.clicks >= 100 },
  { id: 'clicks1k', category: 'misc', emoji: '🤕', name: 'Repetitive Schnitzel Injury', goal: 'Click 1,000 times', flavor: 'Doctor’s orders: rest the wrist, hire an uncle.', check: (s) => s.stats.clicks >= 1e3 },
  { id: 'clicks10k', category: 'misc', emoji: '🦾', name: 'The Mallet Is Your Hand Now', goal: 'Click 10,000 times', flavor: 'You have become the tenderizer.', check: (s) => s.stats.clicks >= 1e4 },
  { id: 'allEquipment', category: 'misc', emoji: '🧰', name: 'Fully Equipped', goal: 'Own every Chapter 1 upgrade in one run', flavor: 'The garage now has more gadgets than a spaceship.', check: (s) => UPGRADES.filter((u) => !u.requires?.franchises && !u.requires?.place && !u.space).every((u) => s.upgrades[u.id]) },
  { id: 'lard', category: 'misc', emoji: '🤫', name: 'Grandma Approves', goal: 'Fry in lard', flavor: '“Finally,” she whispers. “Finally.”', check: (s) => !!s.upgrades.lard },
  { id: 'hour1', category: 'misc', emoji: '⏳', name: 'One More Click', goal: 'Play for 1 hour', flavor: 'Just one more schnitzel and then bed.', check: (s) => s.stats.playtime >= 3600 },
  { id: 'hour10', category: 'misc', emoji: '🌙', name: 'Just Five More Minutes', goal: 'Play for 10 hours', flavor: 'The sun came up. The fryer never went down.', check: (s) => s.stats.playtime >= 36000 },
  { id: 'hour100', category: 'misc', emoji: '🌱', name: 'Touch Grass (Then Bread It)', goal: 'Play for 100 hours', flavor: 'Grass schnitzel is not a thing. Yet.', check: (s) => s.stats.playtime >= 360000 },
  { id: 'lemon', category: 'misc', emoji: '🍋', name: 'Squeeze the Lemon', goal: 'Secret', flavor: 'You found the lemon. Every proper schnitzel needs one. (Click the logo 10 times.)', secret: true, check: (s) => s.stats.logoClicks >= 10 },
  { id: 'zen', category: 'misc', emoji: '🧘', name: 'Zen Kitchen', goal: 'Secret', flavor: 'Staff on every step, not a cutlet waiting, a hot one ready. Pure cook-to-order. The fryer is at peace.', secret: true, check: (s) => WORKERS.every((w) => s.workers[w.id] > 0) && s.items.cutlet.lt(1) && s.items.breaded.lt(1) && s.items.hot.gte(1) },
  { id: 'everywhere', category: 'misc', emoji: '📍', name: 'Everywhere at Once', goal: 'Secret', flavor: 'Every place unlocked in a single run. Your map is just one big pin.', secret: true, check: (s) => REGIONS.every((r) => s.regions[r.id].unlocked) },
  { id: 'hoarder', category: 'misc', emoji: '🐿️', name: 'Breadcrumb Hoarder', goal: 'Secret', flavor: 'Ten thousand bags of breadcrumbs in stock. For winter.', secret: true, check: (s) => s.items.crumbs.gte(D(1e4)) },
]

BADGES.push(...MORE_BADGES, {
  id: 'allBadges',
  category: 'collector',
  emoji: '🍋',
  name: 'The Last Lemon',
  goal: 'Earn every other badge',
  flavor: 'There is nothing left to earn. Grandma hands you a lemon. “Again,” she says.',
  check: (s) => BADGES.every((b) => b.id === 'allBadges' || s.badges[b.id] !== undefined),
})

export const BADGE_BY_ID: Record<string, BadgeDef> = Object.fromEntries(BADGES.map((b) => [b.id, b]))

/** Badges earned since you last looked at Records (the newest ones), newest first. */
export function unseenBadges(state: GameState): string[] {
  const earned = Object.entries(state.badges).sort((a, b) => b[1] - a[1])
  return earned.slice(0, Math.max(0, earned.length - state.badgesSeen)).map(([id]) => id)
}
