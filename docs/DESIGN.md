# Schnitzelverse: design

## Pillars

| Pillar | What you do | How it grows |
|---|---|---|
| 🥩 Supply | Get the ingredients | Corner shop → grow and raise your own → industrial farms → orbital farms |
| 🍳 Kitchen | Make the schnitzel | Pound → bread (flour, egg, crumbs) → fry. Garage stove → restaurant line → factory → mega-fryer |
| 🚚 Distribution | Feed people | Neighbours → friends → street → town → city → region → country → continent → planet → galaxy |

Key systems:

- **Demand cap per region** (population × appetite). A saturated area forces you to expand outward.
- **Schnitzel goes cold.** Freshness decays over delivery time, so each jump in distance needs faster logistics: walk → bike → van → trucks → drones → hyperloop → teleporter.
- **Every ingredient gets its own production chain** (from Chapter 2): wheat → flour → bread → crumbs; pigs → lard; chickens → eggs; sunflowers → oil; potatoes → sides.
- **Crispness / quality** (later): the perfect Wiener Schnitzel has breading that puffs up away from the meat. Better oil, temperature and timing → higher prices and food-critic events.

## Automation ladder

1. Manual clicks
2. Family helpers (Grandma, uncle, cousin, the kid on a bike)
3. Machines (tenderizer, breading station, deep fryer, conveyor)
4. Managers / autobuyers with settings
5. Logistics routes
6. Schnitzel OS: in-game scripting
7. AI operations: the empire runs itself, prestige timing included

## Prestige layers (each adds a new mechanic)

| Layer | Reset | Currency | Unlocks |
|---|---|---|---|
| 0 | Garage run | 💰 money | Basic loop |
| 1 | Franchise: sell the business | ✨ Golden Crumbs | Permanent upgrades, own ingredient chains |
| 2 | New cuisine | 📜 Recipes | Variants as rule-changing challenges: Wiener, Cordon Bleu, Milanese, Tonkatsu, vegan, Czech řízek… |
| 3 | Planetary saturation → space | 🚀 Orbit | Zero-g frying, Mars potatoes, lab-grown meat |
| ∞ | Dyson Fryer | 🌌 | A star powers the fryer. Feed every being in the universe. |

Challenges: Lent (no meat), Oil Crisis, Health Inspector Week, Breadcrumb Shortage, Oktoberfest rush.

## Franchise (layer 1, built)

- Unlocks when you first reach the whole town.
- Golden Crumbs come from **lifetime earnings**: you are worth **floor(√(lifetime money earned / 2,500))** crumbs in total, and selling pays out the ones you haven't collected yet (the Cookie Clicker model). Resetting early gives nothing extra; the way to more crumbs is earning faster: better perks and going deeper (the next town, the city).
- Resets money, reputation, stock, helpers, equipment and places. Keeps crumbs, perks, settings, statistics and the story log.
- The **recipe book** (collapsed by default, opens after you sell) has 11 perks: price, orders, kitchen speed, clicks, pack size, cooling, reputation, plus start-of-run bonuses (money, helpers, Auntie's list, pre-unlocked places). Start-of-run perks also apply the moment you buy them.
- Auntie's shopping list keeps a cash reserve ($25 by default) so a fresh run can still hire; if an ingredient runs out completely she buys one pack anyway.
- **The next town over** needs 1 franchise; **the city** needs 3.

Selling strategies compared with the playtest bot over 8 hours (`npm run playtest`):

| Strategy | Franchises | Lifetime ✨ | City reached |
|---|---|---|---|
| Sell when the reward doubles your lifetime crumbs | 7 | 163 | 2h 42m |
| Sell when the reward triples | 6 | 172 | 3h 25m |
| Sell the moment you reach the town | 20 | 27 | never |
| Idle: no clicking after run 1, checks every 10 min | 6 | 134 | 3h 57m |

**Two ways to sell.** Selling needs at least 1 Golden Crumb. Crumbs come from lifetime earnings (√(earnings ÷ 2,500), minus what you've collected). After a huge run (say, overnight) the next crumb from earnings can be hours away, so there is a second way: in a run that reaches your furthest place ever (or beyond, at least the whole town), you can sell for at least 5% of your lifetime crumbs. Those bonus crumbs are tracked apart, so they don't push the next earnings crumb further away. Tying it to your record place keeps it from being a quick-reset trick.

## Chapter 2: Grandpa's farm (built)

- **Why:** the corner shop's van brings only **30 of each ingredient per second** (shelves hold a minute's worth). Plenty for Chapter 1, the bottleneck from the city on.
- **Unlocks at 2 franchises**, as soon as the next town brings the first real demand (opening it at 3 left a run where the shop ran dry with nothing to do about it). Grandpa offers the old farm.
- **Eight buildings in four chains**, bought with money and reset each franchise like helpers:
  - wheat field → mill → flour → bakery → breadcrumbs (flour is shared with breading, so wheat is the usual bottleneck)
  - sunflower field → oil press (2 seeds → 1 oil)
  - chicken coop → eggs
  - pig farm → butcher (1 pig → 8 meat)
- The farm fills stock first (to Auntie's target), the shop covers the rest. Farm goods are kept to a buffer of 50 so nothing piles up.
- The Farm panel opens with a **supply overview**: per ingredient, what the kitchen uses at its real speed (its slowest step), what the farm makes and what the shop adds, with shortfalls highlighted. Each building shows its actual output against capacity, and says whether it is short of input or simply has enough stock.
- Farm buildings barely pay for themselves as money-savers (30–130 min); their job is beating the shop's limit. Without a farm the region takes 18h instead of under 5h and the country is never reached.
- **Six Chapter 2 upgrades:** tractor (fields ×2), better feed (animals ×2), industrial machines (processors ×2), delivery vans (delivery ×3), industrial kitchen (kitchen ×3), refrigerated trucks (delivery ×3, cooling ×0.5).
- **Farm deeds** perk: start each run with +1 of every building per level.
- **Farm gear** (`farmGear.ts`): every building has a ladder of 13 small upgrades, one rung for each place reached in the run (town, next town, city, region, country, continent, planet, orbit, Moon, Mars, belt, Jupiter, Sun). A rung speeds up its own building (×1.2 near home up to ×1.4 at the Sun) and costs half the place's price × the building's price relative to $10K. Some rungs are **links** that help another chain (pig manure → fields, bran → pigs, lard → oil press, beehives → wheat and sunflowers, crumbs → hens, seed cake → pigs, straw → pigs and hens, eggshells → sunflowers), and one per chain step is **quality** (price ×1.02: free-range pigs, dry-aged cutlets, stone-ground flour, sourdough crumbs, cold-pressed oil, golden-yolk hens). Each chain also gets a **farm hand** from the family once the farm opens (Cousin Pavel, Aunt Jarmila, Great-uncle Franta, little Bára: ×1.25 for the chain).
- **Count goals**: owning 10, 25, 50, 100, 200, 400, 800, 1,600 and 3,200 of a building makes each of them ×1.2 faster (shown as 🎯 with a progress bar on the building).
- **Farm page**: what the kitchen needs (one bar per ingredient: farm, shop, short) beside the shop with its own equipment; farm-wide equipment; then one card per chain with the farm hand, the buildings as a flow, 🐢 on the slowest step, each building's gear (buyable rows, owned icons with pop-ups, 🔒 and the place where the next rung unlocks) and its count goal. Grandpa weighs building gear and group gear per dollar against another building.
- **Balance:** with the gear and goals the farm stops being the bottleneck from Chapter 3 on (the bot buys out the shop ~2–8K times a run instead of 15–20K), so pace is set by the kitchen, fleet and franchise loop. To keep space a long climb, the places after the planet cost ~150–300× more each step (orbit $10B, Moon $3T, Mars $500T, belt $15Qa, Jupiter $600Qa, the Sun $60Qi; reputation ~13% of the price). Bot: planet ~10¼h, orbit ~10¾h, Moon ~12¾h, Mars ~17h, belt ~23h, Jupiter ~37h (before the farm gear: planet 13½h, Mars 27½h, belt 39h, Jupiter never).
- **New places:** the whole region (4 franchises) and the whole country (6 franchises).

Measured with the playtest bot over 32 hours (sell when the reward doubles): next town 1h 48m, city 2h 58m, region 4h 39m, **country 16h 34m**.

Farm buildings get 10% more expensive per building (they started at 15%, which made a planet-scale farm unaffordable). The **Green thumb** perk (whole farm ×1.25 per level) and the **Mega farms** upgrade (×3) keep the farm in step with late-game demand.

## Chapter 3: on the road (built)

- **Every place has a distance**, from 20 m (neighbours) to 12,000 km (the planet). Your helpers reach **400 km**, everything up to the country. You can't carry schnitzel further yourself.
- **The fleet unlocks at 5 franchises.** Vehicles add delivery capacity on their own price curve (+10% each), which breaks the helper cost wall:

| Vehicle | Capacity | Range | Speed | First one |
|---|---|---|---|---|
| 🚐 Delivery van | 25/s | 300 km | 80 km/h | $2M |
| 🚛 Heated truck | 120/s | 2,500 km | 70 km/h | $20M |
| 🚆 Schnitzel express | 600/s | 6,000 km | 140 km/h | $250M |
| ✈️ Cargo plane | 3,000/s | 20,000 km | 800 km/h | $4B |

- **Freshness on arrival:** the share still hot = exp(−distance ÷ (speed × 20) × cooling multiplier). Slow trucks to the continent arrive 24% hot; planes 88%. Cold arrivals sell for 40%.
- **Routing:** the fleet goes first, longest range first, each vehicle to the best-paying place it can reach; helpers cover what is left nearby.
- **Route map:** in the Distribution tab, one coloured line per carrier (helpers, each vehicle kind) runs beside the places from the garage to the farthest place it reaches, where its icon sits. Solid line and dots where it delivers, faint where it could go but has nothing left; the key shows how busy each carrier is. Each place has a status line: keeping up, building up, piling up because there is not enough schnitzel (carriers have room to spare) or because every carrier that reaches it is busy. Tracked per route in `Flows.routes`, smoothed in the store (`src/engine/routes.ts`).
- **New places:** the whole continent (8 franchises, 2,000 km, trucks or better) and **the whole planet** (10 franchises, 12,000 km, planes only).
- **Upgrades:** route planning (fleet ×2), on-board fryers (cooling ×0.5), logistics hub (fleet ×3). **Perks:** Fleet contracts (+1 of every vehicle per run), Logistics degree (fleet ×1.25 per level).

Measured with the playtest bot over 64 hours (sell when the reward doubles, runs up to 2 hours, saves up to an hour of income for the next place):

| Place | First reached |
|---|---|
| Town | 41 min |
| Next town | 1h 52m |
| City | 2h 48m |
| Region | 4h 33m |
| Country | 8h 5m |
| Continent | 18h 30m |
| **The whole planet** | **58h 19m** |

## Managers (built)

Perks bought with Golden Crumbs that do the buying for you, also offline. Each can be switched on and off (sidebar and Franchise tab). They look around once a second of game time and only buy things that cost at most 10% of your money (equipment: 25%), so they never empty the till.

| Manager | Crumbs | Does |
|---|---|---|
| 👵 Grandma, head of staff | 2 | Hires for the slowest step while capacity is below demand × 1.3; buys (or briefly saves for) equipment for that step when it adds more per dollar |
| 🧔 Uncle, the quartermaster | 3 | Buys equipment, cheapest first |
| 👩 Mum, the estate agent | 4 | Unlocks the next place; when it only lacks money that is ≤ 5 minutes of recent income away, the others pause briefly to save up |
| 👴 Grandpa, farm boss | 10 (Ch. 2) | Builds the building holding back the least-covered ingredient, following the chain upstream; buys (or briefly saves for) farm equipment or farm gear for that building when it adds more per dollar |
| 🧑‍💼 The kid, now a dispatcher | 40 (Ch. 3) | Buys vehicles to reach every place, then capacity while delivery lags the kitchen |

The family runs the business; the staff does the work. Helpers and farm buildings are renamed as their tab is promoted (`names.ts`; ids and saves never change):

| | Family / farm | Factory / Agro empire | Mega factory | Crust complex | Orbital kitchen / Space farms | Terraformed worlds |
|---|---|---|---|---|---|---|
| Pound | Uncle with a mallet | Tenderizing crew | Hydraulic press | Pounding robot | Graviton flattener | |
| Bread | Grandma | Breading line | Crumb cascade | Breading bot | Zero-g crumb nebula | |
| Fry | Cousin at the stove | Fry cook brigade | Industrial fryer | Fry-o-tron | Plasma fryer | |
| Pigs | Pig farm | Pork ranch | | | Orbital pig habitat | Pig planet |
| Wheat | Wheat field | Wheat plains | | | Hydroponic wheat bay | Terraformed prairie |

(and so on for every building; the kid becomes courier → driver → drone → jetpack courier with the distribution tab.)

Buying: ×1 / ×10 / Max for helpers, farm buildings and vehicles (one shared setting).

## Crispness (built)

Unlocks for good the first time you reach the next town. Prices × (1 + crispness), reputation × (1 + crispness / 4).

- Crispness = skill × fryer temperature × fresh oil.
- Skill: 0.1 to start, + technique upgrades (Double dip … Crunch lab, Cosmic crumbs; +0.65 in all on Earth), + Crisp master perk (+0.03 per level). Reputation gets a quarter of the bonus.
- Fryer 150–190 °C: 170 °C is the sweet spot; hotter fries faster (+1.5%/°C) but crispness drops (0 at ±30 °C).
- Oil changes: now and then (1 oil, ×1), often (2 oil, ×1.5), every batch (3 oil, ×1.8). More oil means more shop or farm.
- This is the first "perfect it" system; later content can add more (sauces, sides, plating).

## Badge bonuses

Badges that take an hour of play or more add income, all prices +x%, adding up. Tiers come from when the bot earns them: 1–5 h +0.5%, 5–20 h +1%, 20 h+ +2%, beyond 64 h (and Chapter 4) +3%. Easy badges, the hall of shame and click counts give nothing. Table in `badgeBonus.ts`.

The second shelf (`badgesExtra.ts`, 0.010) took the count from 102 to 254: longer goals in every category (served and earned up to 1e24–1e30, 1,000 of each helper, 100 and 400 of each farm building, all farm gear, fleets of 1,000, 500 franchises, 1,000 hours), two new categories (Fame: reputation in one run; Badge hunter: 25 to 250 badges and The Last Lemon for all of them), speedruns, and silly secrets (exact sums, settings, lopsided families). Only the far-away ones (beyond the bot's 64 hours, plus the belt and Jupiter like the other space places) add +3%.

## Chapter 4: the stars (built)

Starts for good the first time you reach the whole planet. Space places are reachable only by space vehicles; helpers and Earth vehicles stay on Earth.

| Place | Distance | Orders/s | Price | Cost | ⭐ |
|---|---|---|---|---|---|
| 🛰️ Orbital station | 400 km | 20K | $30 | $3B | 400M |
| 🌕 Moon base | 384,400 km | 60K | $60 | $30B | 2B |
| 🔴 Mars colony | 225M km | 200K | $150 | $400B | 15B |
| 🪨 Asteroid belt | 400M km | 600K | $400 | $1.5T | 30B |
| 🪐 Jupiter's moons | 630M km | 2M | $1K | $6T | 150B |
| ☀️ Whole Solar System | 6B km | 8M | $3K | $30T | 800B |

Space pays far more per schnitzel than Earth (orbit $30 → Solar System $3K): that is the late game's money engine. Bot (sells when crumbs double, 2 h runs, all managers): see the farm balance note in Chapter 2 for the current timeline (planet ~10¼h, Mars ~17h, Jupiter ~37h, the Solar System beyond 64h). `tools/saves/mars.txt` (made by `tools/demo-save.sim.ts`) loads a game just past Mars.

Vehicles: 🚀 Schnitzel rocket (2K/s, Moon range, $1B), 🛸 Crust cruiser (12K/s, to Jupiter, $50B), 🌌 Schnitzel ark (80K/s, whole system, $2T). Space freshness uses each vehicle's own `freshKm`.
Upgrades: Zero-g fryer (kitchen ×3), Hydroponic domes (farm ×3), Teleport pantry (shop packs ×10), Orbital sun mirrors (fields ×3), Cutlet cloning vats (animals ×3), Matter replicators (processing ×3), Terraforming (farm ×5, new promotion "Terraformed worlds"), Space elevator (fleet ×2), Billboard on the Moon (orders ×2), Cosmic crumbs (crisp +0.5), Dyson fryer (kitchen ×5). Perk: Launch contracts. New promotions: Space farms, Orbital kitchen (20K/s), Space program, Interplanetary.

## Interface

The tabs follow the game's own loop: **prep → making → distribution**, then Franchise and Records. Each pipeline tab is named after how far you've come in it, and every level is a "Promoted" badge:

| Tab | Levels |
|---|---|
| Prep | 🛒 Corner shop → 🚜 Farm (Chapter 2) → 🌾 Agro empire (Mega farms or 150 buildings) |
| Making | 🏚️ Garage → 🏠 House (2/s) → 🏭 Factory (20/s) → 🏗️ Mega factory (200/s) → 🏛️ Crust complex (2,000/s), by kitchen speed |
| Distribution | 🚶 On foot → 🚲 Bike courier → 🚐 Delivery service → 🛣️ Logistics → ✈️ Global airline, by delivery method |

- **Prep:** the corner shop (before the farm) or the farm's chain cards with the shop as backup; supply equipment.
- **Making:** kitchen, kitchen helpers, kitchen equipment. **Distribution:** places with orders per second, delivery helpers, the fleet, delivery equipment. Equipment is sorted onto a tab by what it improves.
- **Franchise:** the Business dashboard (this run, crumbs per hour, the "selling doubles your crumbs" hint) above selling, the next-crumb progress bar and the recipe book.
- **Records:** five headline tiles with silly comparisons (schnitzels laid end to end, the pork weighed in blue whales and Eiffel Towers, the money stacked in $100 notes; `compare.ts`), the income chart (now and best ever) beside personal bests (best income, biggest sale, most served in a run, longest run, fastest town, farthest place), a run history (one bar per franchise: crumbs from the sale on a log scale, coloured by how far the run got, the current run hatched; `stats.runs`, last 100, recorded at each franchise) and “Your story” as a timeline across the page (all 14 big steps, with the play time you first got there; the rest faded as a roadmap). Before the first recorded run, the run panel shows this run so far instead of a lone bar, all the detailed numbers, then 254 badges (including promotions) in 14 categories, garage chatter.
- **Why?** ⓘ next to prices, orders, cooling and every speed lists each upgrade, perk, badge bonus and crispness that multiplies it.
- **Buttons live where they act**, each with a pop-up (after a short hover) saying what it does and, when greyed out, why: **🍳 Cook all three** in the kitchen (pound, bread, fry in one click; names the missing ingredients), **🛒 Restock** in the corner shop (gone once Auntie's shopping list is bought), **📣 Knock on the neighbours' door** in Distribution (one extra order from the next-door neighbours, at most every 5 s, never past their order limit). Early on customers are the limit, so clicking still has a purpose. Cheap early upgrades fill the wait between places: chalkboard (orders ×1.3, $150), lemon wedges (reputation ×1.5, $250), flyers (orders ×1.3, $450), street group chat (orders ×1.4, $800). First run (bot): street 8¾ min, block 18, district 24, town 31 active / 36 idle. Reputation targets (street 200, block 1,100, district 4,000, town 10,000) are set so reputation arrives only a little before the money (street $200).
- **Corner shop limit in Chapter 1:** the shop sells 30 of each ingredient per second. Mrs. Horáková's bigger van (×1.5, $3K, ⭐1,500) and the wholesale market card (×2, $20K, ⭐5,000) keep it ahead of the kitchen until Grandpa's farm (2 franchises); the shop panel shows supply vs kitchen use and how far the farm is. After that it stays a backup to the farm but keeps growing slowly, by small steps (×1.25–×1.5 each, about ×39 in total): second van, mini-market, night deliveries, supermarket, regional depot, Horáková & Sons grocery chain, then an orbital hypermarket and a galactic grocer in space. The shop is renamed as it grows (mini-market → supermarket → wholesale depot → grocery chain → orbital hypermarket → galactic grocer).
- **Size:** the whole stylesheet is in rem, so ☰ Game → Settings → Size scales everything: Fit to window (default, 14–20px text by window width) or Small / Normal / Large / Extra large. Margins show a faint gingham tablecloth.
- **Kitchen buffers are automatic:** each step keeps about 3 seconds of what the next step can use (at least 10 cutlets / 10 breaded / 5 hot) and then pauses: cook to order, nothing goes cold, nothing to set up. Each step card has one fixed status line (working / ready, waiting / waiting for an ingredient), so the layout never jumps.
- **Badge jokes:** the bottom of the sidebar shows one earned badge (emoji, name, joke), a different one every 10 seconds or on a click (`BadgeQuote.tsx`). A garage-chatter line less than 12 seconds old is shown there first; before the first badge it is always the chatter.
- **Header:** the chapter by name (“Chapter 3 · On the road”), then the run and the farthest place you sell to this run. The four headline numbers in the sidebar use three significant digits (`fmtCompact`: 7.42K, 74.2K, 742K) so they always fit without being cut off.
- **Look**: one style everywhere, taken from the welcome page: the header is a golden brand band with the logo (`Logo.tsx`: a schnitzel in a flaming pan, which becomes the pan circling a planet once the orbit has been reached in any run; the browser-tab icon follows, `useTabIcon.ts`); tabs are pills with the active one in the brand colours; panels have a thin golden band on top; list emoji sit on tinted tiles; primary buttons are golden gradients with a soft glow; every dialog opens with the brand band.
- **Welcome page** on a new game and after a hard reset (☰ Game → How to play reopens it; Esc closes it): a wide page with a hero banner, the garage story (Grandma's “Thin. Golden. Never soggy.”) beside a four-chapter journey, six “how it works” cards, the first six steps as numbered cards (Auntie's shopping list marked ⭐ best first buy) and a big “Fire up the pan!” button. One column on phones.
- **First minutes:** a one-line guide in the sidebar and a pulsing button until the first helper is hired. Floating "+$" on clicks, a sizzling fryer (off with reduced motion).
- **Game menu:** four plain items with a one-line hint each, no icons: How to play, Settings, Saves, About & what's new. Closes on a click outside or Esc. A yellow dot on ☰ Game and a “New” pill mark a version whose news the player hasn't opened yet (`newsSeen`; a new player is marked as caught up when they close the welcome page).
- **Saves dialog:** says the game saves itself, then one row each for Save now, Keep a copy (download / copy text), Load a copy (open file / paste text), Undo a mistake (restore the backup from up to 10 minutes ago) and Start over.
- **About & what's new:** as wide as the welcome page, with the same hero. What the game is and why on the left, the changelog on the right (first on phones): one card per public release with an emoji, a playful title and a few plain-language lines. The entries live in `src/changelog.ts`; a test checks the newest one matches `GAME_VERSION`.
- Tab markers: ⚠ an ingredient short or a place unreachable, + a new place ready to unlock, perks you can afford, new badges.
- **Status sidebar** (every tab): key numbers; Grandma's first-minutes tips; managers' switches; per-second flow with the bottleneck; ingredients and their source; the next place's progress and ETA; the latest chatter line. On narrow screens it becomes a strip with the key numbers.

## Pacing targets

- First Franchise reset: ~30–45 min
- Layer 2: days
- Layer 3: weeks
- Endgame: months

## Roadmap

- [x] **M0 Scaffold**: engine/UI split, game loop, save/export/import, offline progress (8h cap), big numbers, tests
- Random events: skipped on purpose (no rewards for being there at the right moment).
- [x] **M1 Garage slice**: manual cooking, corner shop, 4 helpers, 14 upgrades, 6 regions, cooling, auto-restock, story log
- [x] **M1.1 Playtest fixes**: Mum's fridge (no soft-locks), cook-to-order buffers, pacing to ~45 min, playtest bot (`npm run playtest`)
- [x] **M2 Franchise prestige**: Golden Crumbs, 11-perk recipe book, two franchise-gated places (next town, city)
- [x] **M3 Own supply chains (Chapter 2)**: shop supply limit, 8 farm buildings, 6 upgrades, Farm deeds perk, region and country
- [x] **M4 Logistics (Chapter 3)**: distances, fleet with range/speed/capacity, freshness on arrival, continent and the whole planet
- [x] **M5 Automation & polish**: managers, buy ×10/Max, badges (+ bonuses), "Why?" breakdowns, crispness, income chart, settings, Night shift perk (+4 h offline per level), backups, browser smoke test in CI
- [ ] **M6 Cuisine layer** and challenges
- [ ] **M7 Schnitzel OS** scripting
- [x] **M8 Space (Chapter 4)**: six space places, three space vehicles, six upgrades
