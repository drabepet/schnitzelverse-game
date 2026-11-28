// The story: milestones logged as you go.
import { CHAPTER2_FRANCHISES } from './farm'
import { CHAPTER3_FRANCHISES, CRITIC_STARS } from './fleet'
import { REGIONS } from './regions'
import type { GameState } from '../state'

// ---------------------------------------------------------------- story

export interface Milestone {
  id: string
  check: (s: GameState) => boolean
  text: string
}

export const MILESTONES: Milestone[] = [
  {
    id: 'firstServed',
    check: (s) => s.stats.served.gte(1),
    text: "Mrs. Novák from next door: “Is that schnitzel I smell? Bring me another one!”",
  },
  {
    id: 'firstCold',
    check: (s) => s.stats.servedCold.gte(1),
    text: 'Mr. Dvořák: “It was a bit cold… I ate it anyway.” (Hot schnitzel earns more and builds reputation.)',
  },
  {
    id: 'served10',
    check: (s) => s.stats.served.gte(10),
    text: 'Grandma: “You are doing it wrong. Move over.” Maybe the family can help?',
  },
  {
    id: 'friends',
    check: (s) => s.regions.friends.unlocked,
    text: 'The garage party was a hit. Your friends now want schnitzel every Friday.',
  },
  {
    id: 'earned1000',
    check: (s) => s.stats.earned.gte(1000),
    text: 'Dad: “So… is this a business now? Should I move the car out of the garage for good?”',
  },
  {
    id: 'served1000',
    check: (s) => s.stats.served.gte(1000),
    text: 'One thousand schnitzels. The garage floor is permanently covered in breadcrumbs.',
  },
  {
    id: 'town',
    check: (s) => s.regions.town.unlocked,
    text: 'The mayor called. Someone said the word “franchise”… You can now sell the business and start over with Golden Crumbs.',
  },
  {
    id: 'firstFranchise',
    check: (s) => s.prestige.franchises >= 1,
    text: 'Grandma: “Golden Crumbs? In my day we called that experience.” Spend them in the Franchise panel.',
  },
  {
    id: 'nextTown',
    check: (s) => s.regions.nextTown.unlocked,
    text: 'You drove past your first franchise. The queue went round the corner.',
  },
  {
    id: 'city',
    check: (s) => s.regions.city.unlocked,
    text: 'The city. A food critic booked a table under a fake name. Everybody knows it is her.',
  },
  {
    id: 'chapter2',
    check: (s) => s.prestige.franchises >= CHAPTER2_FRANCHISES,
    text: 'Grandpa called: “The old farm has been empty for years. Fields, a mill, a pigsty… take it.” Chapter 2: the farm is open.',
  },
  {
    id: 'soldOut',
    // Only once the farm exists: before that, 'grow your own' is advice you can't take.
    check: (s) => s.stats.soldOut > 0 && s.prestige.franchises >= CHAPTER2_FRANCHISES,
    text: 'Mrs. Horáková from the corner shop: “I’m out, dear. The van only comes so often. Have you thought about growing your own?”',
  },
  {
    id: 'region',
    check: (s) => s.regions.region.unlocked,
    text: 'Motorway services now sell your schnitzel. Truck drivers plan their routes around it.',
  },
  {
    id: 'country',
    check: (s) => s.regions.country.unlocked,
    text: 'The whole country. The president was photographed eating one. With a lemon wedge, correctly.',
  },
  {
    id: 'chapter3',
    check: (s) => s.prestige.franchises >= CHAPTER3_FRANCHISES,
    text: 'Your helpers can’t cycle to the other end of the country. Chapter 3: on the road. Buy a fleet. And the food critics are out: schnitzel that arrives hot earns a place stars, and stars put the price up.',
  },
  {
    id: 'firstStar',
    check: (s) => s.prestige.franchises >= CHAPTER3_FRANCHISES && REGIONS.some((r) => s.regions[r.id].critic >= CRITIC_STARS[0]),
    text: '★ The first food critic’s review: “Hot, thin, golden. One star, and they’ll be back.”',
  },
  {
    id: 'firstThreeStars',
    check: (s) => s.prestige.franchises >= CHAPTER3_FRANCHISES && REGIONS.some((r) => s.regions[r.id].critic >= CRITIC_STARS[2]),
    text: '★★★ Three stars! “Every schnitzel arrived sizzling. We have nothing left to complain about, which upsets us.”',
  },
  {
    id: 'continent',
    check: (s) => s.regions.continent.unlocked,
    text: 'The whole continent. Forty countries argue about potato salad versus fries. Everyone orders both.',
  },
  {
    id: 'planet',
    check: (s) => s.regions.planet.unlocked,
    text: 'The whole planet. Eight billion people, one schnitzel each. Grandma says you can stop now. You won’t. Chapter 4: the stars. Rockets are on the Fleet list, and space equipment is in every tab.',
  },
  {
    id: 'orbit',
    check: (s) => s.regions.orbit.unlocked,
    text: 'The orbital station placed its first order. The schnitzel arrived floating. Nobody minded.',
  },
  {
    id: 'moon',
    check: (s) => s.regions.moon.unlocked,
    text: 'Moon base unlocked. The flag is a lemon wedge on a stick.',
  },
  {
    id: 'mars',
    check: (s) => s.regions.mars.unlocked,
    text: 'Mars colony. The red planet now smells of golden crust.',
  },
  {
    id: 'solar',
    check: (s) => s.regions.solar.unlocked,
    text: 'The whole Solar System eats your schnitzel. Grandma looks up at the night sky and points further. Chapter 5: the Schnitzelverse.',
  },
  {
    id: 'nextStar',
    check: (s) => s.regions.nextStar.unlocked,
    text: 'The next-door star. Three suns rise over a plate of schnitzel. Nobody there has ever been this happy.',
  },
  {
    id: 'cluster',
    check: (s) => s.regions.cluster.unlocked,
    text: 'Your whole star cluster orders lunch. The group chat is just photos of crust.',
  },
  {
    id: 'milkyWay',
    check: (s) => s.regions.milkyWay.unlocked,
    text: 'The whole Milky Way. Four hundred billion stars, one menu.',
  },
  {
    id: 'nextGalaxy',
    check: (s) => s.regions.nextGalaxy.unlocked,
    text: 'The next galaxy over. Andromeda stops heading our way and starts queueing politely.',
  },
  {
    id: 'localGroup',
    check: (s) => s.regions.localGroup.unlocked,
    text: 'The Local Group. Fifty galaxies agree on one thing for the first time in history.',
  },
  {
    id: 'universe',
    check: (s) => s.regions.universe.unlocked,
    text: 'The whole universe eats your schnitzel. And at the very edge of it, somebody finds a door.',
  },
  {
    id: 'nextUniverse',
    check: (s) => s.regions.nextUniverse.unlocked,
    text: 'The universe next door. Same street, different physics. Nobody there has ever heard of breadcrumbs.',
  },
  {
    id: 'schnitzelverse',
    check: (s) => s.regions.schnitzelverse.unlocked,
    text: 'The Schnitzelverse. Every table in every universe. Grandma takes off her apron, just for a minute.',
  },
  // The epilogue: Now, the lemon. Orders stop growing; the share of everyone fed is the goal.
  {
    id: 'everyone',
    check: (s) => s.badges.everyone !== undefined,
    text: 'Everyone in every universe has ordered at once. There is nobody left to ask, only plates left to fill.',
  },
  {
    id: 'fed10',
    check: (s) => s.stats.bestFed >= 0.1,
    text: 'One in ten of everyone, fed at once. The queue at the end of everything starts to move.',
  },
  {
    id: 'fed50',
    check: (s) => s.stats.bestFed >= 0.5,
    text: 'Half of everyone, fed at once. The other half can hear the sizzle.',
  },
  {
    id: 'fedAll',
    check: (s) => s.stats.bestFed >= 1,
    text: 'Every order in every universe, served. Hot. Grandma reaches for the lemon.',
  },
]

/**
 * The family chronicle: what the family says when a milestone happens, logged
 * right under it (Records → Family chronicle). In space the kid runs the
 * radio, so the lines turn into mission control calls.
 */
export const FAMILY_LINES: Record<string, string> = {
  firstServed: 'Grandma: “Thin. Golden. Never soggy. Remember that.”',
  firstCold: 'Grandma: “Cold schnitzel is a crime. Faster, child.”',
  served10: 'The kid: “I can carry two plates on my bike! Probably.”',
  friends: 'Mum: “Friday schnitzel night. I’m putting it on the fridge calendar.”',
  earned1000: 'Uncle: “A thousand dollars. I’ll build you a proper workbench. Out of a door.”',
  served1000: 'Grandma: “A thousand. Now they start to be good.”',
  town: 'Mum: “The whole town, darling. I’ve already told everyone at the hairdresser’s.”',
  firstFranchise: 'Auntie: “Same garage, fresh start. I kept your shopping list.”',
  nextTown: 'The kid: “Our name on a sign! Can I ride past it again?”',
  city: 'Grandma: “A critic? Then we fry exactly as always.”',
  chapter2: 'Grandpa: “Pigs, wheat, sunflowers, hens. Bring boots.”',
  soldOut: 'Grandpa: “Shops run out. Fields don’t. Mostly.”',
  region: 'Uncle: “I fixed the coffee machine at the services. They gave us the whole counter.”',
  country: 'Mum: “The president! I framed the photo. Twice.”',
  chapter3: 'The kid: “Vans! With engines! I still get to wave from the window, right?”',
  firstStar: 'Mum: “One star! I’ve already told the hairdresser. She wants it laminated.”',
  firstThreeStars: 'Grandma: “Three stars. Good. Now don’t let it go cold.”',
  continent: 'Grandma: “Forty countries, one rule: lemon, not ketchup.”',
  planet: 'Grandpa: “Eight billion plates. The pigs want a raise.”',
  orbit: '📡 Mission control: “Station reports one schnitzel, slightly floating. Crust intact. Over.”',
  moon: '📡 Mission control: “Moon base requests more lemons. Repeat: more lemons. Over.”',
  mars: '📡 Mission control: “Mars confirms delivery. The dust storm delayed nobody. Over.”',
  solar: 'Grandma: “Further. Always further. And keep the oil at 170.”',
  nextStar: '📡 Mission control: “Three suns, one crust. They request seconds. Over.”',
  cluster: '📡 The kid, on the radio: “It’s me, I run mission control now. The cluster says the crust is legendary.”',
  milkyWay: '📡 Mission control: “Galactic core on line one. They want the recipe. Grandma says no. Over.”',
  nextGalaxy: 'Mum: “Andromeda. I always said that neighbourhood had potential.”',
  localGroup: 'Uncle: “Fifty galaxies, one fryer. I may need a longer extension cord.”',
  universe: 'Grandpa: “Every star is a farm now. I miss my tractor.”',
  nextUniverse: 'Grandma: “A whole universe and nobody taught them to bread a cutlet? Pack my bowls.”',
  schnitzelverse: 'Grandma: “Thin. Golden. Never soggy.” She smiles. “You remembered.”',
  everyone: 'Mum: “Everyone has ordered, darling. Even the hairdresser’s cousin in the universe next door.”',
  fed10: 'Grandpa: “More fields, then. There is always more soil somewhere.”',
  fed50: 'Uncle: “Half way. I’ve worn out my third mallet in this universe alone.”',
  fedAll: 'Grandma: “Now. The lemon.” She squeezes it over the very last plate, and the whole of everything smells of it.',
}

/** The legend of star paprika (Chapters 4–5), behind the 📜 button on the fuel box and the paprika chain. */
export const PAPRIKA_LEGEND: { title: string; paragraphs: string[] } = {
  title: '🌶️ The legend of star paprika',
  paragraphs: [
    'It began with a spill. On the first schnitzel run to Mars, Cousin Jitka dropped Grandma’s paprika tin in the red sand. By morning the dunes had sprouted, and the pods glowed faintly in the dark.',
    'The pilot who sniffed one on the way home landed on Earth eleven minutes before he took off. Scientists call it fold paprika: one pinch and space creases like a tablecloth, and Mars is a sneeze away.',
    'The dunes are guarded by crumb worms, longer than freight trains, drawn by the smell of frying. They ask for nothing but the crusts. Grandpa feeds them by hand and has named every one.',
    'Past the Sun, the stills boil it down into deep-fold paprika, so strong that a pilot once folded the whole galaxy into a sandwich by accident. Nobody knows where Grandma got the first tin. She only says: “A good recipe always travels.”',
  ],
}
