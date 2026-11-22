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
    version: '0.011',
    date: '22 Nov 2026',
    emoji: '🍋',
    title: 'Beyond the Sun',
    items: [
      'Chapter 5, the Schnitzelverse: seven new places past the Solar System, from the next-door star to the end of everything.',
      'Warp freighters, wormhole gates and stasis crates, so schnitzel arrives hot even in another galaxy.',
      'The Franchise tab is now a family tree: every perk opens the next, pick-one choices and a big capstone per family member.',
      'Managers have ranks, their own cards with what they bought lately, and Mum can even sell the business for you (only if you switch it on).',
      'Mrs. Horáková’s shop grows with every place you reach, the Solar System comes sooner, and the sidebar shows what holds you back.',
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
