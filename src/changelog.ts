// What's new, shown in ☰ Game → About. Newest first. Add an entry with each
// public release (the test checks the top one matches GAME_VERSION). Keep it
// short and from the player's side: what's new to play, not how it's built.

export interface ChangelogEntry {
  version: string
  date: string
  emoji: string
  title: string
  items: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.015',
    date: '27 Nov 2026',
    emoji: '🔊',
    title: 'Sound on',
    items: [
      'Sound: every pound, crumb and sizzle, each sale and knock at the door, new places and badges, and a short tune for each chapter.',
      'Set effects and music apart in ☰ Game → Settings, or mute it all with 🔊 at the top. It goes quiet while the game’s tab is in the background.',
      'The same emoji on every computer and phone: the game now brings its own.',
      'Our own pictures for the schnitzel and what goes into it: 🍖 hot, 🍗 cold, 🫓 pounded, 🍘 breaded, flour, oil, wheat and Grandma’s pan.',
      'Hover the hot and cold schnitzels in Distribution to see which is which, and the ⓘ next to a number to see what makes it up.',
    ],
  },
  {
    version: '0.014',
    date: '26 Nov 2026',
    emoji: '🌟',
    title: 'The critics are coming',
    items: [
      'Food critics, from Chapter 3: every place watches how much arrives hot. Earn ★ ★★ ★★★ and that place pays more.',
      'Fit out each kind of vehicle: 📦 cargo carries twice as much, 🔥 express keeps it hot twice as far. Switch any time, free.',
      'Gear for every vehicle, from roof racks to stasis cupboards, and goals for 10, 25, 50… of a kind.',
      'The family joins in at your first sale: Grandma hires and Mum opens the next place while you’re away.',
      'A new place: the universe next door, between the universe and the Schnitzelverse.',
      'Choose who spends first in the family office, and whether each waits for the one before.',
      'Eight new records for critics’ darlings, and tidier delivery rows on phones.',
    ],
  },
  {
    version: '0.013',
    date: '25 Nov 2026',
    emoji: '🌶️',
    title: 'Spice of the stars',
    items: [
      'The kitchen gets three stations: Uncle, Grandma and the cousin each have their own column, with helpers, gear for every place you reach, and goals for 10, 25, 50… helpers.',
      'Star paprika: grow it on Mars, burn it to fly past the Moon. Without it, ships drift on solar sails and the schnitzel arrives cold.',
      'Kitchen tales: a short story for every chapter, in ☰ Game. A new one waits for you each time a chapter opens.',
      'Eleven new records for paprika pilots, worm whisperers and champion sneezers.',
      'Space kitchens grow step by step instead of in giant leaps, so the farm and the fleet matter again.',
      'Updates load faster: the game keeps the parts that didn’t change.',
    ],
  },
  {
    version: '0.012',
    date: '23 Nov 2026',
    emoji: '📖',
    title: 'The family album',
    items: [
      'Nothing jumps any more: the numbers tick, the panels stay put.',
      'See what holds you back: the sidebar names the slowest part and takes you there, buy buttons fill up as you save, and the header says what opens the next chapter.',
      'Safer saves: restore points to undo a mistake, a reminder to keep a copy at each new chapter, and the family covers for you for 12 hours while you’re away.',
      'Every chapter has its own colours, the family comments on your milestones (mission control takes over in space), and big moments get a little fanfare.',
      'New settings: numbers in words (4.56 quadrillion), a calmer display speed and fewer effects.',
      'Every Golden Crumb you’ve ever collected adds a little income, and the Franchise tab previews your next sale.',
      'Smarter managers: nobody buys fryers or vans while the farm is the real limit.',
    ],
  },
  {
    version: '0.011',
    date: '22 Nov 2026',
    emoji: '🍋',
    title: 'Beyond the Sun',
    items: [
      'Chapter 5, the Schnitzelverse: seven new places past the Solar System, from the next-door star to the end of everything.',
      'Warp freighters, wormhole gates and stasis crates, so schnitzel arrives hot even in another galaxy.',
      'The Franchise tab is now a family tree: every perk opens the next, pick-one choices and a big capstone per family member.',
      'Managers have ranks, their own cards with what they bought lately, and Mum can even sell the business for you at the best moment (only if you switch it on).',
      'Mrs. Horáková’s shop grows with every place you reach, the Solar System comes sooner, the sidebar shows what holds you back, and the Franchise tab shows all your Golden Crumbs at a glance.',
    ],
  },
  {
    version: '0.010',
    date: '21 Nov 2026',
    emoji: '🏅',
    title: 'A wall full of badges',
    items: [
      '152 new badges, 254 in all: bigger goals, a Fame section, speedruns and some very silly secrets.',
      'The sidebar shows the joke from one of your badges, a new one every 10 seconds.',
      'A brand-new Records page: fun numbers, personal bests, your story so far and a bar for every run.',
      'The header tells you which chapter you’re in and where you’re selling.',
      'Short, tidy numbers in the sidebar, a simpler game menu, a saves page and this What’s new.',
    ],
  },
  {
    version: '0.009',
    date: '20 Nov 2026',
    emoji: '🚜',
    title: 'Grandpa goes shopping',
    items: [
      'Every farm building has its own gear: a new piece for each place you reach, from the town all the way to the Sun.',
      'The family lends a hand on the farm, and owning 10, 25, 50… of a building makes them all faster.',
      'The corner shop grows up too, from a second van to a galactic grocer.',
      'A route map shows which vehicle delivers how far.',
      'A brand-new look, and a logo that follows you into orbit.',
      'Space takes a little longer, so the stars feel earned.',
    ],
  },
  {
    version: '0.008',
    date: '20 Nov 2026',
    emoji: '🧠',
    title: 'A smarter family',
    items: [
      'Managers think before they spend: equipment when it beats another helper, saving up when the next place is close.',
      'A second way to franchise: reaching a new farthest place pays Golden Crumbs too.',
      'Every greyed-out button tells you why, and what to do about it.',
      'The first places want a bit more reputation, so fame and money arrive together.',
    ],
  },
  {
    version: '0.007',
    date: '19 Nov 2026',
    emoji: '🎉',
    title: 'Out of the garage',
    items: [
      'The first public version: from Grandma’s frying pan to the stars, in four chapters.',
      'Franchise and start over with Golden Crumbs, grow your own farm, run a fleet, fly to Mars.',
      'Family managers, crispness, 80 badges and a Records tab.',
    ],
  },
]
