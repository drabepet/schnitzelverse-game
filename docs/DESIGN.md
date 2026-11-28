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
- **The family tree** (replaces the flat recipe book and manager list): one branch per family member, each a vertical column (`BRANCHES` in data/franchise.ts, `FamilyTree.tsx`). The manager (that person's promotion) sits on top and needs nothing; below it the perks, row by row, each needing levels in the ones above (`TREE_REQUIRES`). Two cross-links join branches: Crisp master needs Green thumb, the statue needs the family recipe.
  - 👵 Grandma, the kitchen: recipe → loyal family / fast hands → better everything → crisp master → pick one: thin and fast (kitchen ×1.2/level) or thick and golden (prices ×1.15/level) → capstone: Grandma's lard secret (prices ×2.5).
  - 🔨 Uncle, stores and money: head start → Auntie remembers / night shift → bulk contracts → pick one: Uncle stays in the kitchen (kitchen ×1.15) or takes the van (helper delivery ×1.3, fleet ×1.1) → capstone: Uncle's workshop (kitchen ×2, shop ×3).
  - 👩 Mum, fame and places: word of mouth → local legend → old connections → pick one: gossip queen (orders ×1.2) or darling of the press (reputation ×1.3) → capstone: a statue in the town square (reputation ×3, orders ×1.5).
  - 👴 Grandpa, the farm (Chapter 2): farm deeds → green thumb → pick one: pig farmer (animals ×1.3) or crop farmer (fields ×1.3), both processing ×1.1 → capstone: the farm empire (farm ×3).
  - 🚲 The kid, deliveries: thermos → fleet contracts / logistics degree → pick one: speed demon (cooling ×0.8) or heavy hauler (fleet ×1.2) → launch contracts → warp contracts → capstone: the galactic courier (fleet ×3, cooling ÷2).
  - **Pick one:** both sides cost the same (5 levels); owning one blocks the other. You can switch once per choice per run (`swapFork`), levels carried over, so a choice is a plan for the run, not a trap.
  - **Chapter caps:** endless perks top out at 10 / 20 / 40 / 75 / 150 levels in chapters 1–5 (`CHAPTER_CAPS`), far beyond normal play (the bot has ~25 at 64 h, ~41 at 14 days); only a wall against grinding one chapter forever.
  - Perks bought before the tree keep their levels; you just can't level them further until their prerequisites are met. Badges: A Fork in the Road, Changed My Mind, Top of the Tree, The Whole Family Tree.
- Auntie's shopping list keeps a cash reserve ($25 by default) so a fresh run can still hire; if an ingredient runs out completely she buys one pack anyway.
- **The next town over** needs 1 franchise; **the city** needs 3.
- **Family pride:** every Golden Crumb ever collected is worth a little, even after it's spent: prices ×(1 + 0.01 × log10(collected + 1)) (`familyPride`, `CRUMB_PRIDE_PER_DECADE`), so ×1.01 at 9 crumbs, ×1.09 at a billion, ×1.14 at 100 trillion (late in the game). Listed under Why? as “Family pride”. Small on purpose: at 2% per tenfold the bot reached the Schnitzelverse in 12d 12h, at 5% in 11d 3h (13d 15h without it, before the kitchen stations; with them and 1% it is 13d 15h again).

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

### Critics and the fleet (built)

Distribution had the fewest choices in the game. Two additions feed each other:

- **Food critics (from Chapter 3).** Every place keeps a rolling share of the schnitzels that arrived hot there (`RegionState.critic`, averaged over about 5 minutes, `CRITIC_SECONDS`). Updated per tick from what was delivered, so offline is the same as online. **★ at 70%, ★★ at 85%, ★★★ at 97%** hot; each star multiplies **that place's** price by 1.1 (`placePrice`, so ★★★ is ×1.33). Every arrival counts: cold stock from the kitchen and solar-sail trips pull a place down. Each place row shows `★★☆ · 90% arrive hot · ★★★ at 97% · price +21%`.
- **Fit-outs.** Each kind of vehicle is Standard, 📦 Cargo (carries ×2, keeps food hot only half as far) or 🔥 Express (keeps food hot twice as far). Free to switch any time, kept between runs (`state.fitOuts`). The wormhole gate is always hot, so it has no Express. Applied as mod sources, so Why? shows them.
- **Fleet gear** (`fleetGear.ts`): four rungs per vehicle at the places it works, alternating 📦 capacity ×1.3 and ❄️ fresh ×1.3 (the wormhole's are all capacity). Each costs 15% of its place's price, never less than one vehicle, and goes only on a vehicle you own. Uncle buys capacity rungs when delivery is the limit and fresh rungs always (stars).
- **Count goals** for vehicles, like the farm and kitchen crews (×1.2 at 10, 25, 50… of a kind).
- **Food critics records** (8, records only, no bonus): first star, ★★★ somewhere, at five places, everywhere (12+ places), a star in space, ★★★ in the Schnitzelverse, both fit-outs tried, all fleet gear in one run.

## Managers (built)

Perks bought with Golden Crumbs that do the buying for you, also offline. Each can be switched on and off (sidebar and Franchise tab). They look around once a second of game time and only buy things that cost at most 10% of your money (equipment: 25%), so they never empty the till.

| Manager | Crumbs | Does |
|---|---|---|
| 👵 Grandma, head of staff | 2 | Hires for the slowest step while capacity is below demand × 1.3, but no further than 1.2× what the ingredients can feed; buys (or briefly saves for) equipment for that step when it adds more per dollar |
| 🧔 Uncle, the quartermaster | 3 | Buys equipment: what helps the bottleneck first, then what always helps (prices, reputation, crispness), never what would only add idle capacity; cheapest first |
| 👩 Mum, the estate agent | 4 | Unlocks the next place; when it only lacks money that is ≤ 5 minutes of recent income away (15 min when customers are the limit), the others pause briefly to save up |
| 👴 Grandpa, farm boss | 10 (Ch. 2) | Builds the building holding back the least-covered ingredient, following the chain upstream; buys (or briefly saves for) farm equipment or farm gear for that building when it adds more per dollar |
| 🧑‍💼 The kid, now a dispatcher | 40 (Ch. 3) | Buys vehicles to reach every place, then capacity while delivery lags the kitchen (or 1.2× the ingredients, when they are the limit) |

**Spending where it helps.** The business sells only as much as its weakest part allows: customers, ingredients (farm plus corner shop, `supplyLimit`), kitchen or delivery (`businessLimits`). The managers don't grow a part that would only stand idle:
- Grandma grows the kitchen no further than customers want (×1.3) and no further than 1.2× what the ingredients can feed (`SUPPLY_LEAD`). Her card says “Waiting for the farm” then.
- The kid grows the fleet no further than the kitchen (×1.1), the ingredients (×1.2 ×1.1) or customers (×1.3), but always buys a vehicle for a place nobody can reach yet.
- Grandpa grows the farm no further than customers want (×1.3).
- Uncle sorts equipment by use (`gearUse`): what adds to the bottleneck first, then what always helps (prices, reputation, crispness, Auntie, packs), and he skips equipment whose only effect is capacity in a part that is already 20% past the limit. A kitchen step's own gear counts against that step. Equipment with no effect of its own (it only opens something) always counts as useful.
- When customers are the limit, a new place is the only thing that helps, so Mum saves for it three times longer (`SAVE_FOR_PLACE_CUSTOMERS`: 15 minutes of income, 45 at rank 2).

The 20% lead keeps each part a step ahead of the next, so they take turns growing instead of waiting for each other.

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

### Ranks, the dial, the log and Mum's sale

- **Ranks:** every manager is a perk with 3 levels at the top of their family-tree branch: 1 On the job, 2 Old hand, 3 Runs the show. Each rank costs 1,000× the one before (Grandma 2 → 2,000 → 2M crumbs; the kid 40 → 40K → 40M). Rank 2: Grandma, Grandpa and the kid buy ten at a time when that's still cheap enough; Uncle buys the biggest piece he can afford first (not the cheapest); Mum asks the others to save for a place up to 15 minutes away (not 5). Rank 2 also opens the Bold setting, rank 3 All in. Rank 3 Mum can sell the business (below).
- **The family joins in** (`familyJoinsIn`): the first sale makes Grandma and Mum managers (rank 1, free), with a chronicle line. From then on the business hires and opens places while you're away, so a player who looks in a few times a day doesn't wait a whole visit for the next town (the bot's three-times-a-day player waited 8 hours for it). Run 1 stays hands-on. Older saves past their first sale get them on load.
- **Who goes first** (the family at work, from two promoted spenders): Uncle, Grandpa, the kid and Grandma spend in the player's order each second (`managerOrder`, ↑ buttons; Mum always goes first, she opens places and sells). **Strict** (off by default): the next in line only buys once the one before has nothing left to buy, saving up counts as busy (`managerWants`), so “farm before fleet” really holds. The default order is the old fixed one.
- **How boldly** (a dial per manager): Careful ×0.5, Normal ×1, Bold ×2.5 (rank 2), All in ×5 (rank 3) of their usual share of your money per purchase, at most 90% (`spendShare`).
- **The family at work** (Franchise tab, under the tree): a card per manager with rank, on/off, what they're doing now, money spent this run, their last three purchases and the dial. Purchases are logged by comparing what the business owns before and after each manager's turn, merged while they keep buying (`managerLog`, last 40). The sidebar's rotating box shows the newest manager purchase (from the last 3 minutes) every other turn with the badge jokes.
- **Sidebar managers**: a face per promoted manager with a status dot: green just bought something (last minute), amber saving up, pale nothing to do, grey with a slash switched off (`managerMood`). Hovering a face shows a pop-up with the status and the last purchase; hovering the “Managers” title shows the colour key (`MoodLegend`, also under “The family at work”). The pop-up is a portal on `document.body`, so the main panel can't draw over it.
- **Mum sells the business** (rank 3, **off by default**): a switch with a rule and an option for Auntie to spend the crumbs on the cheapest perks right after, never on a pick-one choice (`autoSell`). The rules:
  - **At the best moment** (default, `bestMomentToSell`): Mum sells as soon as the sale triples lifetime crumbs (`BEST_SALE_EARLY`), or once the run's **growth** has peaked: `crumbGrowth` = ln(1 + sale ÷ lifetime) ÷ hours, tracked from 15 minutes into a run (`run.growthPeak`); she sells when it falls 3% below the run's best (`CRUMB_RATE_DROP`) and the sale adds at least 10% (`BEST_SALE_MIN_SHARE`). The sale inside it is unrounded (`crumbRate`, frontier sales left out), because whole crumbs make the early rate a sawtooth.
    - Why growth, not crumbs per hour: plain crumbs per hour ignores compounding, so it waits far too long early on (bot: 295 crumbs in 8 hours against 746 for “triples”). Without the 10% floor and unrounding, it sold every 16 minutes for +1 crumb (72 in 8 hours).
    - Bot, 24 hours, triples vs best moment: lifetime 4.83M vs **7.69M**; planet 15h 24m vs 11h 53m; Mars 20h 35m vs 19h 05m. At 8 hours triples has more crumbs (746 vs 554) but best moment reaches every place sooner. Late on, triples only kept selling because the bot forces a sale after 2 hours; Mum with that rule would stop selling. Run it with `PLAYTEST_HOURS=24` on `tools/playtest-franchise.sim.ts`.
  - **When it adds +10/25/50/100/200%** of lifetime crumbs. The old "doubles" and "triples" rules were +100% and +200%; saves migrate to those. Late in the game a run only adds about 5–25% of lifetime crumbs, so the big shares never fire there.
  - **After a set time** (10 minutes to 24 hours).
  - The sell box shows one line on Mum (`mumSellStatus`): off, “in 1h 20m” (time rule), the share now against the rule's share, or for the best moment the growth against the run's best and the 3% dip she waits for.

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

**Star paprika records** (11, their own category): the first dunes, mill and distillery, the first schnitzel flown on fold paprika, a million on solar sails, a full tank, 50 dunes, Grandma's worm whistle, a billion and a quadrillion pinches burned (`stats.paprikaBurned`, `stats.sailed`), and every piece of paprika gear. Records only: none of them adds a bonus, so the balance stays as it is. The farm's own gear and farm-hand badges count the ingredient farm only.

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
Upgrades: Zero-g fryer (kitchen ×1.5), Hydroponic domes (farm ×3), Teleport pantry (shop packs ×10), Orbital sun mirrors (fields ×2.5), Cutlet cloning vats (animals ×2.5), Matter replicators (processing ×2.5), Terraforming (farm ×5, new promotion "Terraformed worlds"), Space elevator (fleet ×2), Billboard on the Moon (orders ×2), Cosmic crumbs (crisp +0.5), Dyson fryer (kitchen ×3). The farm jumps used to be ×3, ×3 and ×5 (×45 per group in one chapter), which left the farm 4× ahead of what the business sold; now Hydroponic domes ×3, the group gear ×2.5, Terraforming ×5 (×37.5; the Chapter 5 farm upgrades went from ×5 to ×6 to keep the pace) and the farm grows through its gear ladders and count goals, like the kitchen. Perk: Launch contracts. New promotions: Space farms, Orbital kitchen (20K/s), Space program, Interplanetary.

### Star paprika: ship fuel (built)

Space shouldn't be the early game with bigger numbers, so long trips burn fuel grown on the farm: our own homage to the desert-spice classics, with schnitzel's own spice.

- **The chain** (`paprika` in `FARM_CHAINS`, a card on the farm from Chapter 4): 🏜️ **paprika dunes** (a field, 🌶️ pods) → ⚗️ **paprika mill** (2 pods → ⛽ fold paprika) → 🔮 **paprika distillery** (2 fold → 🌌 deep-fold paprika). The dunes and mill can be built once the 🔴 Mars colony is reached in a run, the distillery once the next-door star is (`requires` on the building; `space`/`deep` hide them until their chapter). They share the farm's field and processor equipment, have their own gear ladders from their opening place on (11 and 7 rungs, `FUEL_RUNG_COST_SHARE`), count goals, and a farm hand (👩‍🚀 Cousin Jitka moves to Mars). The farm-deeds perk and the “every kind of farm building” badge stay with the ingredient farm (`KITCHEN_FACILITIES`).
- **Burning it** (`fuelFor`, tick step 6): every schnitzel flown to Mars or further burns `FUEL_PER_SCHNITZEL` (0.01) fold paprika; beyond the Sun, deep-fold paprika. Orbit and the Moon need none, so the cruiser's Moon runs never wait for Mars. Crates without fuel drift on **solar sails** and arrive cold (40% of the price). Nothing gets stuck, offline included.
- **The farm plans for it:** what the fleet would burn at full capacity is part of `supplyNeeds` and `consumption` (`fleetFuelNeed`), so the mill makes enough each tick and Grandpa grows the paprika chain like any short ingredient (no further than customers want). Uncle counts paprika gear as always useful. Crumb worms are flavour only: no random events.
- **Pace:** the chain is cheap next to the places it opens with (dunes $50T, mill $100T, distillery $100Q and fast), so the bot reaches every place up to the Solar System at the same time as before, and the Schnitzelverse at 13d 17h (13d 15h without paprika). The first 15 minutes of a run in Chapter 5 fly partly on sails while Grandpa rebuilds the chain.
- **On screen:** the Distribution tab opens with a 🌶️ fuel box (each fuel: what the farm makes of what the fleet burns, a coverage bar, how much flies on sails, a link to the chain on the farm, and 📜 The legend, a short story behind a button); the sidebar lists the fuels after the ingredients; the chain card says what the fleet needs and gets; every place that needs fuel has a line: “⛽ Flying on fold paprika”, “⛽ Fold paprika for 60% of the trips; the rest drift on solar sails and arrive cold”, or “⛵ On solar sails”.

## Chapter 5: the Schnitzelverse (built)

Starts for good the first time you reach the whole Solar System (`CHAPTER5_REGION`). The places echo Chapter 1 at cosmic size and the game ends at the last one (`FINAL_REGION`): there is no second reset layer.

| Place | Distance | Orders/s | Price | Cost | ⭐ | Echoes |
|---|---|---|---|---|---|---|
| ⭐ The next-door star | 4.2 ly | 25M | $10K | $12Qi | 1.5Qi | the neighbours |
| ✨ Your star cluster | 50 ly | 80M | $30K | $240Qi | 30Qi | your street |
| 🌀 The whole Milky Way | 100,000 ly | 250M | $100K | $4Sx | 500Qi | the whole town |
| 🌫️ The next galaxy over | 2.5M ly | 800M | $300K | $21Sx | 2.6Sx | the next town over |
| 🫧 The Local Group | 10M ly | 2.5B | $1M | $800Sx | 100Sx | the city |
| 🌌 The whole universe | 46B ly | 8B | $3M | $7.2Sp | 900Sx | the whole planet |
| 🚪 The universe next door | 1e27 km | 14B | $5.5M | $17Sp | 2.1Sp | |
| 🍋 The Schnitzelverse | everywhere at once | 25B | $10M | $20Sp | 2.5Sp | the finale |

The Solar System got cheaper with it ($4Qi, 500Qa ⭐; was $60Qi, 8Qi ⭐), so it arrives at about 2¼ days instead of never in the bot's 64 hours.

- **Vehicles** (`deep`: only in Chapter 5): 🌠 Warp freighter (1M/s, reaches the Milky Way, $500Qa; arrives cold past the nearby stars without stasis crates), 🕳️ Wormhole gate (30M/s, any distance, no cooling, $1Sx). Perk: Warp contracts (start runs with warp freighters, up to 3).
- **Equipment:** stasis crates (cooling ÷100), warp coils (fleet ×3), a constellation shaped like a schnitzel (orders ×3), pig planets / wheat worlds / nebula mills (farm groups ×6), quantum crunch (crisp +0.3), neutron star fryer (kitchen ×3), your face in the night sky (reputation ×3), three Michelin stars (prices ×2), the intergalactic grocer (shop ×1.5, renames the shop “Horáková’s universe”). A fifth kitchen crew on every step (singularity tenderizer, crumb galaxy, supernova fryers), and a farm-gear rung per building at every new place (56 pieces).
- **Promotions:** Galactic farms, Cosmic kitchen (1B/s), Warp logistics, Wormhole network.
- **Badges:** a new section, The Schnitzelverse (20 badges: every place, the vehicles, the crews, speedruns, the final one). Place and promotion badges add +3% like the space ones.
- **Finale:** reaching the Schnitzelverse shows a closing screen once (`finaleSeen`): the story's ending, your numbers, credits for the family, then “Keep frying”, and Chapter 6 opens.
- **Display:** numbers get suffixes up to Vg (1e63) before going scientific; far distances are in light years.
- **Sidebar:** when the next place is more than 3 hours away and a sale would pay at least a quarter of your lifetime crumbs, it suggests franchising instead of waiting.

Bot (sells when crumbs double, 2 h runs, `PLAYTEST_HOURS=340 PLAYTEST_IDLE_STEP=4`): Solar System 2d 5h, next-door star 3d 13h, star cluster 4d 9h, Milky Way 5d 23h, next galaxy 8d 7h, Local Group 9d 9h, universe 11d 17h, the Schnitzelverse 12d 23h.

## Chapter 6: Now, the lemon (built)

The post-game. At the finale Grandma says “Not bad. Now, the lemon.” Chapter 6 opens the first time you reach the Schnitzelverse (`chapter6Unlocked` = `epilogueOpen`: `stats.bestPlace` at the Schnitzelverse) and its goal is to **feed everyone in every universe at once**.

- **Why:** at the finale players served ~1% of their orders (the finale save: 15T/s of 1.33Qa/s, held back by bread and fry; the bots 0.2–1.2%), and the share never moved: Word of mouth and Better everything both grow ×1.25 a level, so orders and kitchen rose together. Helpers had hit their price wall (one more fry cousin: 14 minutes of income for +0.2%), and money piled up with nothing to buy.
- **Orders stop growing:** Word of mouth stops at level 35 (`WORD_OF_MOUTH_MAX`; the effect is clamped too, for saves already past it), and Mum's pick-one is decided for good: in Chapter 6 **Gossip queen** wins (`endgamePick`). Darling of the press's levels move over, the choice locks, and the tile says why (Mum quit the press after the last interviewer asked whether the schnitzel comes gluten-free; “We’re past famous, darling. We’re lunch.”). To make up for the reputation, the move also gives **Local legend +1** for free, once (`endgameGift`; ×1.5 against the press's ×2.0). Every other source of orders already has a top, so the most customers can ever order is fixed: **`EVERYONE_ORDERS` ≈ 6.4Qa/s**, worked out from the data in rules.ts (every place, every piece of order equipment, every order perk at its top; pick-one perks only on the side Chapter 6 picks). A new order perk without a `maxLevel` makes the game refuse to start. The “🍋 Everyone has ordered” ceiling in the orders breakdown only guards it.
- **Fed share:** `fedShare` = what the business sells (its weakest part, `businessLimits`) ÷ everyone; `stats.bestFed` keeps the best, checked once a minute. The sidebar shows it (🍋 Now, the lemon: fed now, best, next goal) from Chapter 6 on.
- **What closes the gap** (everything except orders), opening once the Schnitzelverse is reached in a run:
  - **A sixth kitchen crew** per step (multiverse mallets, every crumb everywhere, the fryer at the end of everything), ×4 each (`LEMON_CREW_MULT`), $2–3e27. They rename the crews like the others.
  - **Grandma’s standards**: three ladders (kitchen, farm, fleet) of 8 rungs, each ×2 (`STANDARDS_MULT`). A rung shows only once you own the one before (`after` on the upgrade). First rungs $4e27 / $2e27 / $1e27, each ×5 the one before (`STANDARDS_COST`). Tried against the bots: ×8 left them stuck at ~63% after 4 days; ×4 fed everyone in 15 hours with the 25/50/75% tales an hour apart; ×6 took 3 days once Gossip queen joined the goal. Uncle buys them like other equipment (the bottleneck’s first).
- **Badges** (new section, Now, the lemon): Everyone Has Ordered, fed 2 / 5 / 10 / 25 / 50 / 75 / 100% (these seven +3% each), Kitchen of Everything (the three crews), Up to Standard, Grandma Nods (a ladder’s top), Bedtime Stories (every kitchen tale). Chronicle lines at everyone ordered, 10%, 50% and 100%.
- **Kitchen tales:** five for Chapter 6, one when it opens and one at 25 / 50 / 75 / 100% fed (`fed` on the tale): the queue at the end of everything, Uncle meets the other Uncles, Mrs. Horáková closes for lunch, the kid takes one more delivery, the lemon. Tales now have ids (1–5 are the old chapter tales, so older saves’ `talesRead` still match). The card offers the first open tale not offered yet, so a fed tale gets its own card (“🍋 25% of everyone fed!”); Later counts all open ones as offered. The Tales dialog lists a chapter’s later tales under its first, locked ones saying when they open.
- **The end:** at 100% a closing card (`LemonDialog`, `lemonSeen`): Grandma squeezes the lemon. The game goes on (badges, records, the rest of the ladders).
- **Look and sound:** a lemon-gold chapter skin (light and dark) and a sixth chapter tune (the garage polka, slower, ending high). Chapter 5’s emoji is now 🌌; 🍋 belongs to Chapter 6. Perk chapter caps get a sixth step (300).

Bots (`tools/playtest-strategies.sim.ts`, the EPILOGUE line: time after the Schnitzelverse):

| | Hybrid (Schnitzelverse at 4d 19h) | Mum’s best moment (at 4d 11h) |
|---|---|---|
| 10% fed | 10h 35m | 14h 10m |
| 25% (second tale) | 17h 16m | 20h 57m |
| 50% (third tale) | 19h 26m | 23h 31m |
| 75% (fourth tale) | 30h 3m | 32h 38m |
| Everyone fed (the lemon) | 34h 0m (6d 5h in all) | 36h 33m (5d 23h in all) |

The share climbs in steps: each sale rebuilds the ladders faster with more crumbs, so a big stretch can come in one run (25% to 50% took about 2 hours for both bots).

## Interface

The tabs follow the game's own loop: **prep → making → distribution**, then Franchise and Records. Each pipeline tab is named after how far you've come in it, and every level is a "Promoted" badge:

| Tab | Levels |
|---|---|
| Prep | 🛒 Corner shop → 🚜 Farm (Chapter 2) → 🌾 Agro empire (Mega farms or 150 buildings) |
| Making | 🏚️ Garage → 🏠 House (2/s) → 🏭 Factory (20/s) → 🏗️ Mega factory (200/s) → 🏛️ Crust complex (2,000/s), by kitchen speed |
| Distribution | 🚶 On foot → 🚲 Bike courier → 🚐 Delivery service → 🛣️ Logistics → ✈️ Global airline, by delivery method |

- **Prep:** the corner shop (before the farm) or the farm's chain cards with the shop as backup; supply equipment.
- **Making: one column per kitchen station**, like the family tree (`KitchenPage.tsx`). On top: Cook all three, the buy amount and what's waiting between the steps. Then Pound, Bread and Fry side by side, each with its person (the look follows the crew upgrades: Uncle with a mallet → … → Graviton flattener), the step's recipe, click button, speed and status line, hiring, the count goal and the station's own gear; a 🐢 on the slowest step. Below: **Whole kitchen** (kitchen-wide speed, prices, reputation) beside Crispness. One column on narrow screens.
  - **Kitchen gear** (`kitchenGear.ts`, `station` on the upgrade): each station has a ladder of 20 rungs, one per place from the town to the Schnitzelverse, like the farm's. Most speed up their own station (×1.15–1.3, smaller than the farm's, `KITCHEN_RUNG_MULT`); three per ladder help the next step (🔗 ×1.15: pound → bread → fry → pound); two are ✨ quality (price ×1.02). Rung price: 20 / 25 / 30% of the place's price (pound / bread / fry). The station's older gear (mallet, deep fryer, the five crew upgrades) sits in the same column.
  - **Count goals for the crews**, the farm's table: 10, 25, 50 … 3,200 helpers at a station, each ×1.2 for every helper there (in `modSources`, so Why?, capacity and the managers all see it).
  - **Smaller jumps in space.** The kitchen used to leap: the chapter 4 crews were ×8 each, the Zero-g fryer ×3, the Dyson fryer ×5, so one purchase left it 8× ahead of what the business could sell (Mars save: 195M/s kitchen for 24M/s of customers). Now the chapter 4 crews are ×2, the chapter 5 crews ×5, Zero-g ×1.5, Dyson ×3, the Neutron star fryer ×3, and the ladders grow it in small steps: the same save now has 54M/s (2.2×). The bot reaches every place up to the Solar System at the same time as before, and the Schnitzelverse at 13d 15h.
- **Distribution:** places with orders per second, delivery helpers, the fleet, delivery equipment. Equipment is sorted onto a tab by what it improves.
- **Franchise:** four crumb tiles at the top (to spend; collected in total; this run with crumbs per hour now and at its best; franchises and the biggest sale), then selling (with a preview: the sale's share of all you've collected and family pride before → after), the next-crumb progress bar, the family tree and the family at work. (The old Business dashboard is gone: its numbers are in the sidebar.)
- **Records:** five headline tiles with silly comparisons (schnitzels laid end to end, the pork weighed in blue whales and Eiffel Towers, the money stacked in $100 notes; `compare.ts`), the income chart (now and best ever) beside personal bests (best income, biggest sale, most served in a run, longest run, fastest town, farthest place), a run history (one bar per franchise: crumbs from the sale on a log scale, coloured by how far the run got, the current run hatched; `stats.runs`, last 100, recorded at each franchise) and “Your story” as a timeline across the page (all 14 big steps, with the play time you first got there; the rest faded as a roadmap). Before the first recorded run, the run panel shows this run so far instead of a lone bar, all the detailed numbers, then 293 badges (including promotions) in 16 categories (the 🌶️ Star paprika ones are records only, no bonus), and the **family chronicle**: the story log, where each milestone gets a line from someone in the family (`FAMILY_LINES` in data/story.ts: Grandma, Mum, Uncle, Auntie, Grandpa, the kid), and from the orbit on, mission control on the radio (monospaced, blue edge).
- **Why?** ⓘ next to prices, orders, cooling and every speed lists each upgrade, perk, badge bonus and crispness that multiplies it.
- **Buttons live where they act**, each with a pop-up (after a short hover) saying what it does and, when greyed out, why: **🍳 Cook all three** in the kitchen (pound, bread, fry in one click; names the missing ingredients), **🛒 Restock** in the corner shop (gone once Auntie's shopping list is bought), **📣 Knock on the neighbours' door** in Distribution (one extra order from the next-door neighbours, at most every 5 s, never past their order limit). Early on customers are the limit, so clicking still has a purpose. Cheap early upgrades fill the wait between places: chalkboard (orders ×1.3, $150), lemon wedges (reputation ×1.5, $250), flyers (orders ×1.3, $450), street group chat (orders ×1.4, $800). First run (bot): street 8¾ min, block 18, district 24, town 31 active / 36 idle. Reputation targets (street 200, block 1,100, district 4,000, town 10,000) are set so reputation arrives only a little before the money (street $200).
- **Corner shop limit in Chapter 1:** the shop sells 30 of each ingredient per second. Mrs. Horáková's bigger van (×1.5, $3K, ⭐1,500) and the wholesale market card (×2, $20K, ⭐5,000) keep it ahead of the kitchen until Grandpa's farm (2 franchises); the shop panel shows supply vs kitchen use and how far the farm is. After that it stays a backup to the farm but keeps growing slowly, by small steps (×1.25–×1.5 each, about ×39 in total): second van, mini-market, night deliveries, supermarket, regional depot, Horáková & Sons grocery chain, then an orbital hypermarket and a galactic grocer in space. The shop is renamed as it grows (mini-market → supermarket → wholesale depot → grocery chain → orbital hypermarket → galactic grocer).
- **Size:** the whole stylesheet is in rem, so ☰ Game → Settings → Size scales everything: Fit to window (default, 14–20px text by window width) or Small / Normal / Large / Extra large. Margins show a faint gingham tablecloth.
- **Settings** also has:
  - **Numbers:** Short (1.23M), Named (1.23 million, up to vigintillion, then e-notation) or Scientific. Named only shows in panels and text; places with little room (sidebar, tiles, buy buttons) stay short (`fmtCompact`, `fmtShort`), so nothing gets wider or jumps.
  - **Display speed:** Smooth / Relaxed / Calm redraws the screen 20 / 10 / 4 times a second (`updateRate`). The game itself still runs 20 ticks a second; only drawing is skipped, which saves battery and calms the numbers.
  - **Effects:** Full (floating text, bursts, the big cards), Calm (only the big cards for a new chapter or a sale) or Off (also stops the sizzle and the pulsing button). Reduced motion always turns bursts and floating text off and only fades the cards (`juice.ts`).
  - **Chapter colours** (on by default).
- **Kitchen buffers are automatic:** each step keeps about 3 seconds of what the next step can use (at least 10 cutlets / 10 breaded / 5 hot) and then pauses: cook to order, nothing goes cold, nothing to set up. Each step card has one fixed status line (working / ready, waiting / waiting for an ingredient), so the layout never jumps.
- **Badge jokes:** the bottom of the sidebar shows one earned badge (emoji, name, joke), a different one every 10 seconds or on a click (`BadgeQuote.tsx`). A chronicle line less than 12 seconds old is shown there first, with the family's reply under it; before the first badge it is always the chronicle.
- **Header:** the chapter by name (“Chapter 3 · On the road”), then the run and the farthest place you sell to this run. The four headline numbers in the sidebar use three significant digits (`fmtCompact`: 7.42K, 74.2K, 742K) so they always fit without being cut off. After the chapter, a small pill says what opens the next one (“next: On the road · 3/5 franchises”, or “reach 🌍 the whole planet”; `nextChapterGoal`), hidden in the last chapter and on phones.
- **Chapter skins:** each chapter tints the page (background, panels, borders, tablecloth) in light and dark: wheat on the farm, asphalt grey with lane dashes on the road, deep navy with stars in space, violet sparkles in the Schnitzelverse (`:root[data-chapter]`). The brand band (header, active tab, dialog tops) changes with it: golden fried in the garage, green fields into wheat, asphalt under a street light, the night sky with stars, violet into gold. Chapter colours off keeps chapter 1's look. (A strip of emoji per tab showing the business growing was tried and dropped: it only repeated the numbers in the panels below.)
- **Moments, scaled:** a click floats “+$”; a new place gives a small burst of crumbs (sparks on the road, stars in space) from the header, a new best place a bigger one; selling and a new chapter show one card in the middle of the window for under 3 seconds that never takes clicks (`Moments.tsx`, `juice.ts`).
- **Look**: one style everywhere, taken from the welcome page: the header is a golden brand band with the logo (`Logo.tsx`: a schnitzel in a flaming pan, which becomes the pan circling a planet once the orbit has been reached in any run; the browser-tab icon follows, `useTabIcon.ts`); tabs are pills with the active one in the brand colours; panels have a thin golden band on top; list emoji sit on tinted tiles; primary buttons are golden gradients with a soft glow; every dialog opens with the brand band.
- **Welcome page** on a new game and after a hard reset (☰ Game → How to play reopens it; Esc closes it): a wide page with a hero banner, the garage story (Grandma's “Thin. Golden. Never soggy.”) beside a four-chapter journey, six “how it works” cards, the first six steps as numbered cards (Auntie's shopping list marked ⭐ best first buy) and a big “Fire up the pan!” button. One column on phones.
- **First minutes:** a one-line guide in the sidebar and a pulsing button until the first helper is hired. Floating "+$" on clicks, a sizzling fryer (off with reduced motion or effects off).
- **Game menu:** five plain items with a one-line hint each, no icons: How to play, Settings, Saves, Kitchen tales, About & what's new. Closes on a click outside or Esc. A yellow dot on ☰ Game and a “New” pill mark a version whose news the player hasn't opened yet (`newsSeen`; a new player is marked as caught up when they close the welcome page), or a kitchen tale not read yet.
- **Kitchen tales** (`data/tales.ts`, `TalesDialog.tsx`): one short story per chapter, a 2–3 minute read in the family's voice (the garage and the smoke alarm, Grandpa buys a pig, still crispy at 90 km/h, frying without up, the last plate). Chapters on the left, the story on the right; chapters not reached are locked covers (“Not yet”), so their names stay secret. Opening one marks it read (`talesRead`).
- **Saves dialog:** says the game saves itself, whether the browser promised to keep it (`navigator.storage.persist()`, asked once at start; otherwise a calm note to keep a copy) and when you last kept a copy. Then rows for Save now, Keep a copy (download / copy text), Load a copy (open file / paste text), **Undo a mistake** and Start over.
  - **Restore points** (`storage.ts`): up to 6 full saves in one localStorage key, newest first. Automatic ones every 15 minutes (the newest 4 are kept), and moments (the newest 2): before loading a copy, before starting over, before going back, and at a new chapter. Each is labelled (“12 min ago · Run 21 · 🌕 Moon base · automatic”), only stored if it loads again, and the time is unique (it names the point). A damaged main save falls back to the newest point that loads. The old single backup slot is migrated in as the first point.
  - **The new-chapter card:** at the start of each new chapter, once, one toast with the chapter's kitchen tale (**Read it now**, or it waits in the menu; `taleOffered`) and a suggestion to download a copy (`copyNudgeChapter`; a restore point is taken at the same moment). Each half goes away on its own; **Later** closes both. Never on a timer. Older saves start from their current chapter, so the card doesn't greet them on load.
- **About & what's new:** as wide as the welcome page, with the same hero. What the game is and why on the left, the changelog on the right (first on phones): one card per public release with an emoji, a playful title and a few plain-language lines. The entries live in `src/changelog.ts`; a test checks the newest one matches `GAME_VERSION`.
- Tab markers: ⚠ an ingredient short or a place unreachable, + a new place ready to unlock, perks you can afford, new badges.
- **Status sidebar** (every tab): key numbers; Grandma's first-minutes tips; managers' switches; per-second flow with the bottleneck; ingredients and their source, then star paprika (made of what the fleet burns) from Mars on; the next place's progress and ETA; the latest chronicle line. On narrow screens it becomes a strip with the key numbers.
  - **What holds you back:** the Per second section lists Orders, Ingredients (how many schnitzels a second the farm and shop bring ingredients for), Fry and Deliver; the smallest is the limit and gets 🐢. A two-line link under it says what to do and opens the tab where you do it (`flow()` and `adviceFor()` in `insights.ts`). Held with `useSteady`, so it doesn't flicker.
- **Buy buttons fill up:** a greyed-out buy button that only lacks money (or crumbs) fills from the left as you get closer to its price (`HintButton` `progress`, `affordShare`). The exact wait stays in its pop-up. No layout change.
- **Welcome back:** time away, what was served and earned, and what the family did meanwhile, worked out by comparing the business before and after (`familyDigest`: helpers, farm buildings, vehicles, equipment and what they cost; places Mum opened; Mum's sales and their crumbs). Then the next place with its progress, and how long the family covers for you (12 h, +4 h per Night shift level).

### A layout that stays still

Numbers tick several times a second, so nothing in normal flow may change size because of a live value (it made panels jump, worst on the farm). The rules:
- **Fixed structure, not content-driven wrapping.** Farm chains are a grid with one column per building and fixed-width arrows (`.flow`, columns set inline); narrow cards stack it by container width (`@container chain`), never by what the text says.
- **Live numbers keep their width.** Use `fmtCompact(x, true)` for rates and stock (keeps trailing zeros: 24.0M, not 24M), `tabular-nums`, and `white-space: nowrap` (sidebar rows, stage footers, building rates, arrows). Numbers inside prose sit in `.num` (min 5ch, `.num.time` 6.5ch); chips with counts get a min width.
- **Status lines reserve their room.** A line that can say different things always takes the same height (`min-height: 2lh` or `3lh`, clamped): building status, the sidebar's "About … at this pace", the route summary (which now always says something), manager cards' "doing now".
- **Messages that hover around a threshold are held** with `useSteady(value, ms)` (default 3 s): a shown message changes at most once per hold. Used for farm statuses, coverage notes, the sidebar guide and sell tip, the bottleneck highlight, the frontier-sale note and the next-crumb ETA.
- **No pop-in in flow.** Tab markers keep their spot when quiet (hidden, not removed); a button whose label counts down (Knock) stacks both labels (`LabelStack`), so it keeps the widest size; the Fry button's 💨 is absolutely positioned.
- **One-line text needs a column that can shrink.** `nowrap` + ellipsis inside a grid only works if the column is `minmax(0, 1fr)` and the items have `min-width: 0`; otherwise the longest line widens the column and the box spills into its neighbours (this broke the manager cards once).
- Checked with a `layout-shift` PerformanceObserver over every tab of the Mars save: vertical shifts went from many per second to none.

## Pacing targets

- First Franchise reset: ~30–45 min
- Layer 2: days
- Layer 3: weeks
- Endgame: months

**Selling strategies played to the end** (`tools/playtest-strategies.sim.ts`, one bot each with `PLAYTEST_ONLY`): the main bot force-sells every 2 hours, which late on adds only ~5% a run, so it is about 4× slower than a player who lets Mum sell when the sale triples lifetime crumbs (the finale save in `tools/saves`: the Schnitzelverse at 3d 11h). Before Chapter 6: hybrid (doubles every 2 h until the planet, then triples, no cap) 4d 21h; Mum’s best moment, no cap, 4d 16h; triples from the very first run 6d 5h (stuck 15–24 h at the country and continent); check-in with Mum at 200% 11d 21h. `tools/inspect.sim.ts` loads a save and prints what holds it back, then runs it on.

**Measured** (`PLAYTEST_HOURS=340 PLAYTEST_IDLE_STEP=4`; the SUMMARY and DRY lines at the end of each report):

| | Active player (`playtest-main`: plays 5 min per run, checks every 30 s, sells when crumbs double or after 2 h) | Check-in player (`playtest-checkin`: a 15-minute session every 8 h, sells when crumbs double or after a day) |
|---|---|---|
| Next town / city | 1h 14m / 1h 43m | 1h 1m / 16h 42m |
| Whole planet | 8h 16m | 4d 0h |
| Solar System | 2d 0h | 5d 13h |
| The Schnitzelverse | 14d 3h | 8d 16h |
| Longest wait for a new place or chapter | 2d 10h (Local Group → universe), 46h (universe next door → Schnitzelverse) | 32h (continent → chapter 4), 24h (country → continent) |
| Longest wait for anything new | 40h (before a click badge, after the universe next door) | 31h (a long-run badge, late) |

With the critics and the fleet choices (critic stars, fit-outs, fleet gear, vehicle count goals), the bot fits out 🔥 express for the kind serving the farthest place and 📦 cargo for the rest. Near places sit at ★★★ almost all the time (helpers arrive hot, the kitchen cooks to order); the far hops are where stars are won and lost (the next star and the cluster drop to 10–50% hot on warp freighters until the wormhole arrives). Thresholds were raised from 60/80/95% and the star from +15% to +10% after the first run came in a day fast (13d 1h).

The check-in player now reaches the next town within the hour (the family joins in at the first sale, so Mum opens it while they're away; it used to wait for the next visit, 8 hours later). Places that need another sale (the city: 3 franchises) still wait for a visit, since selling is the player's call (or Mum's, if they switch her on). Late on, their 8–24 hour runs earn more crumbs than the active bot's 2-hour runs. The universe next door splits what used to be the driest stretch (3d 16h from the universe to the Schnitzelverse) into two.

## Roadmap

- [x] **M0 Scaffold**: engine/UI split, game loop, save/export/import, offline progress (8 h cap at first, 12 h now), big numbers, tests
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
- [x] **M9 The Schnitzelverse (Chapter 5)**: seven places to the end of everything, warp freighters and wormhole gates, stasis crates, 56 farm-gear rungs, a fifth kitchen crew, 20 badges, the finale
- [x] **M10 Now, the lemon (Chapter 6)**: orders capped (Word of mouth 35), feed everyone, a sixth kitchen crew, Grandma’s standards, 13 badges, five kitchen tales, the lemon
