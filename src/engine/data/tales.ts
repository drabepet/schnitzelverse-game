// Kitchen tales: one short story per chapter (a 2–3 minute read), unlocked
// when the chapter opens, read from ☰ Game → Kitchen tales.

export interface Tale {
  /** The chapter it belongs to (1–5). */
  chapter: number
  emoji: string
  title: string
  paragraphs: string[]
}

export const TALES: Tale[] = [
  {
    chapter: 1,
    emoji: '🏚️',
    title: 'The mallet and the smoke alarm',
    paragraphs: [
      'Every empire starts somewhere. This one started on a Tuesday, in a garage that smelled of bicycle oil and old paint, with Grandma holding a pork loin the way other people hold a newborn.',
      '“Thin,” she said. “Golden. Never soggy.” Then she handed the mallet to Uncle, who had retired from butchering eleven years ago and had been waiting for this moment ever since.',
      'The first cutlet was too thick. The second was too thin; you could read the newspaper through it, and Uncle did, out loud, until Grandma took the newspaper away. The third was perfect. Grandma did not say it was perfect. She nodded once, which in this family is the same as a parade.',
      'Breading came next. Three bowls: flour, egg, crumbs. Grandma does not measure. Grandma has never measured. When the cousin asked how much flour, she looked at him the way you look at someone who has asked how much air to breathe.',
      'Then the pan. The cousin was put in charge of frying because he was the only one who had not been put in charge of anything yet. The oil shimmered. The cutlet went in. It sang. The whole garage went quiet to listen to it sing.',
      'And then the smoke alarm went off.',
      'It was not the schnitzel’s fault. It was the cousin’s eyebrows, which had leaned in too close to admire his work and were now, briefly, on fire. Mum put them out with a tea towel without putting down her coffee. Nobody has mentioned the eyebrows since. They grew back. Mostly.',
      'The smell drifted down the street. Within ten minutes Mrs. Dvořáková from next door was standing in the doorway, holding an empty plate and pretending she had come about something else. She ate the schnitzel standing up. She asked for another. She asked whether they did deliveries.',
      'They did not do deliveries. The kid, who was nine and owned a bicycle, said that they did now.',
      'By evening there were four orders from the street, one from the block, and a note under the garage door that just said “MORE” in capital letters. Grandma framed it. It is still on the wall, next to the smoke alarm, which nobody has ever been allowed to fix.',
      'That night, washing the pan, Grandma said the thing she always says, the thing that has been said in this family for longer than anyone can remember: “Somebody, somewhere, is hungry.”',
      'Uncle, drying the mallet, said: “Then we had better get faster.”',
    ],
  },
  {
    chapter: 2,
    emoji: '🚜',
    title: 'Grandpa buys a pig',
    paragraphs: [
      'The trouble with the corner shop was Mrs. Horáková. Not because she was unkind; she was the kindest woman in the district. The trouble was that she had one van, one nephew to drive it, and thirty slices of pork a second, and the family now needed a great deal more than thirty.',
      'So Grandpa, who had said nothing at all for three days, put on his good hat and went out. He came back with a pig.',
      '“That is one pig,” said Grandma.',
      '“It is the first pig,” said Grandpa, which is the most he had said in a week.',
      'By the end of the month there was a farm. Not a big one. A field of wheat, a field of sunflowers, a coop of hens with strong opinions, and a sty with eleven pigs, all named after footballers. Cousin Pavel moved out of his flat and into the barn with his knives, his apron and a radio that only played polka.',
      'It turned out that a schnitzel is not one thing. It is a pig, a hen, a field of wheat and a field of sunflowers, all agreeing to meet in the same pan at the same time. If the wheat is late, there is no flour. If the flour is late, the bakery stands idle, and if the bakery is idle, there are no crumbs, and Grandma will not bread a cutlet in anything but her own crumbs, and so the whole kitchen stops and everyone looks at the bakery.',
      'The bakery was Aunt Jarmila. She baked the bread, let it go stale, and grated it into crumbs: the only baker in history who bakes purely in order to destroy. She called it art. Grandpa called it “the bottleneck” and drew it on a chalkboard with an arrow.',
      'There were setbacks. The hens went on strike when the rooster was moved to a different coop. The pigs escaped twice, once to the pub. The sunflowers, Great-uncle Franta insisted, needed to be spoken to every morning, and they did produce more oil when he did, which nobody could explain and everyone stopped trying to.',
      'And then, one autumn morning, the first schnitzel came off the line that had never touched a shop at all. Farm pork. Farm eggs. Farm flour, farm crumbs, farm oil. Grandma took one bite, put the fork down, and was quiet for a long time.',
      '“The eggs,” she finally said, “are better than mine.”',
      'It was the only time anyone has ever heard her say that. The hens were given a raise. Nobody knows what a hen does with a raise, but they seemed pleased about it.',
    ],
  },
  {
    chapter: 3,
    emoji: '🚐',
    title: 'Ninety kilometres an hour, still crispy',
    paragraphs: [
      'The kid on the bike had grown up. He was nineteen now, had a driving licence and a moustache he was not ready for, and one afternoon he parked a white van in front of the garage with the family name painted on the side, slightly crooked.',
      '“It has a hot box in the back,” he said. “Like an oven, but it drives.”',
      'This was the start of the great argument. A schnitzel, said Grandma, is at its best for four minutes after it leaves the pan. After that it is still a schnitzel, but it is a schnitzel with regrets. And the next town was forty minutes away.',
      'The first delivery to the next town arrived lukewarm. The customer ate it anyway and sent back a very polite letter, which Grandma took personally. The second delivery arrived hot but soggy, because the kid had closed the box too tight and the crust had steamed itself into sadness. Grandma took that personally too.',
      'So the family did what it always does: it held a meeting in the kitchen and everyone shouted. Uncle wanted a faster van. Mum wanted a closer town. Cousin Pavel suggested frying in the van, which was vetoed after a short demonstration in the yard.',
      'In the end it was Grandpa, again, who solved it. He drilled holes in the lid of the hot box (small ones, in a pattern only he understood) so the steam could leave while the heat stayed. The next schnitzel arrived in the next town crisp enough to make a sound when you tapped it. The customer tapped it. The customer cried a little. The customer ordered twelve more.',
      'After that, the vans multiplied. Then a heated truck, forty tonnes of golden crust on the motorway, with a driver who swore the cab smelled so good that other lorries followed him for miles. Then a train with a dining car that had no seats, only crates. Then an aeroplane, because the kid had seen the map on the wall and noticed that the world went on past the edge of the country.',
      'Every vehicle was a new argument about distance and heat. Every argument ended the same way: faster is hotter, hotter is better, and nothing leaves the garage without Grandma looking at it first.',
      'The first schnitzel to cross an ocean arrived on another continent still warm. It was served to a man who had never heard of schnitzel, who looked at it suspiciously, cut it, ate it, and then sat very still for a while.',
      '“Who made this?” he asked.',
      'The pilot, who had been told what to say, said: “Grandma.”',
    ],
  },
  {
    chapter: 4,
    emoji: '🚀',
    title: 'Frying without up',
    paragraphs: [
      'The rocket was the kid’s idea, of course. By then he was running the whole fleet from a desk with six screens, and one evening he turned them all to the sky and said, “There are people up there, and they are eating out of tubes.”',
      'Nobody in the family could bear that. A tube.',
      'The first problem was gravity, or rather the lack of it. Oil does not stay in a pan in orbit. It floats away in golden bubbles that drift around the cabin and stick to the astronauts’ hair. The cousin’s first space schnitzel took four hours, two cleaning crews and one very patient commander, and it arrived round. Perfectly round. Breaded on all sides at once.',
      'Grandma looked at the photograph for a long time. “It is not a schnitzel,” she said. “But it is not a crime.”',
      'They learned. They built a fryer that spun, so the oil pressed itself against the walls like washing in a machine, and the cutlet cooked in the middle, flat and golden, while the station turned slowly overhead. They called it the zero-g fryer. The astronauts called it the best thing that had ever happened to them.',
      'The Moon was easier. There is a little gravity on the Moon, enough to keep the oil polite. The first Moon base schnitzel was eaten in a crater by twelve people in helmets who had to take turns taking them off, very quickly, to take a bite.',
      'Mars was hard. Mars was far. The schnitzel left Earth hot and arrived months later as something the crew politely used as a doorstop. It looked, for a while, as if Mars would simply have to eat out of tubes forever.',
      'And then Cousin Jitka, unloading supplies in the red dust, tripped over a crate and dropped Grandma’s old tin of paprika. You may have heard what happened next. If you haven’t, ask the paprika farmers; they tell it better, and every year the story gets a little longer.',
      'What matters is this: within a season, ships were reaching Mars in a sneeze, and the schnitzel arrived hot. The colonists held a festival. They grilled nothing, because everything was fried. They named the main street after Grandma, then renamed it, because she wrote to them and said a street was too much fuss, and then quietly renamed it back when she wasn’t looking.',
      'On the night of the festival, somebody pointed a telescope at Earth and found the garage, a tiny warm dot on the dark side of the planet, its light still on.',
      '“She’s still up,” said the colonist.',
      '“She’s always up,” said Jitka. “Somebody, somewhere, is hungry.”',
    ],
  },
  {
    chapter: 5,
    emoji: '🌌',
    title: 'The last plate',
    paragraphs: [
      'There is a moment, past the Sun, when the map runs out. The kid, who was not a kid any more and had not been for a long time, stood in front of a screen that showed every star in the galaxy and asked the question the whole family had been avoiding.',
      '“How far do we go?”',
      'Grandma did not look up from the breading. “Are they hungry out there?”',
      'They were. They always were. The next star had a planet of tall, quiet people who had never tasted anything crisp, and who wept, softly and in harmony, at their first bite. The star cluster beyond it had a civilisation of very small people who ordered one schnitzel between a million of them and still sent back compliments. The galaxy next door was so far away that the warp freighters had to carry stasis crates, little boxes where time stood still, so the schnitzel inside stayed exactly four minutes out of the pan for a thousand years.',
      'The kitchen grew to match. The fryers were plasma now, then something stranger. Uncle’s mallet had become a machine that bent space until a cutlet was exactly four millimetres thin across an entire planet. Grandma’s three bowls had become a nebula. The cousin, eyebrows long since grown back, ran a ring of fryers around the core of the galaxy and still checked every hundredth schnitzel by hand.',
      'And somewhere in all of it, every evening, Grandma still breaded one cutlet herself, in the old garage, in the old bowls, and ate it at the old table.',
      'The family worried. It was all so big. Did she even know how big it had become? Mum finally asked her, one night, whether it was strange to feed a whole universe from a garage.',
      'Grandma thought about it. “When I was a girl,” she said, “we had one pan and eight people. My mother cut every schnitzel into eight pieces so nobody went without. A universe is just more pieces.”',
      'Then she slid her plate across the table.',
      'It was the last plate of the evening, and it was meant for whoever was hungriest, and everyone at the table looked at it, and nobody took it, because in this family you never take the last plate.',
      'So it sat there, golden, still sizzling a little, while outside the window ten thousand galaxies ate their dinner. And it was, the cousin said afterwards, the most peaceful he had ever seen her.',
      '“Somebody, somewhere,” said Grandma, “is hungry.”',
      'And then, because she is who she is, she got up and fried another one.',
    ],
  },
]
