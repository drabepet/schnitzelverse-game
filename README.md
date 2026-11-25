# Schnitzelverse 🍽️

An idle automation game about bringing schnitzel to everyone: from a frying pan in the
garage to the neighbours, the town, the planet and eventually the stars.

Runs in any web browser, tested on Chrome.

**Play it:** https://drabepet.github.io/schnitzelverse-game/ (the latest public release)

## Versions and releases

Development happens in the private repo (`drabepet/schnitzelverse`): commit and push any time.
The public repo (`drabepet/schnitzelverse-game`) only changes on a release:

1. Bump `GAME_VERSION` in `src/version.ts` and add a short entry at the top of `src/changelog.ts`
   (both shown in ☰ Game → About & what's new; a test checks they match).
2. Commit and push to the private `main`.
3. Run `tools/release.sh`. It copies the committed files (not the history) into the public repo
   as one commit "Release v<version>", tags it, and pushes; GitHub Pages then publishes the game.
4. Small fixes to the version that's already out (no new version number): commit and push, then
   `tools/release.sh --update`. It adds one commit "Update v<version>" without a new tag.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine tests (vitest)
npm run build      # static site in dist/, host anywhere
npm run smoke      # browser smoke test (Playwright; PW_CHANNEL=chrome uses your Chrome)
npm run playtest   # balance bot, writes playtest-report.*.txt (PLAYTEST_HOURS=150 for a long main run)
                   # each report ends with SUMMARY (first arrival at each place) and DRY lines (longest waits for
                   # anything new); playtest-checkin is the same bot checking in only every 8 hours
npx vitest run --config vitest.playtest.config.ts tools/bench.sim.ts   # engine speed + CPU profile → bench-report.txt
node tools/perf.mjs http://localhost:5173/ perf-report.txt prod        # page CPU per tab (dev server running, after npm run build)
```

## Project layout

```
src/
  engine/          pure TypeScript game rules: no browser, no React
    data/          ALL game content as data, one file per topic (items, kitchen, staff,
                   upgrades, regions, farm, fleet, franchise, story…); content.ts re-exports it
    state.ts       the saved game shape + new game
    rules.ts       derived values: modifiers, costs, capacities
    tick.ts        the simulation step (also used for offline progress)
    ops.ts         the basic moves (cook, deliver, buy packs) shared by tick and actions
    actions.ts     everything the player can do
    automation.ts  managers: perks that buy things for you
    badges.ts      badges; badgeBonus.ts: which ones add income
    save.ts        save/load/export with version merge
    format.ts      number formatting (K, M, B … or named, then 1.23e45)
  game/
    store.ts       real-time loop, autosave, offline catch-up, React hook
    storage.ts     save backend + restore points (localStorage)
  ui/              React panels (lazyParts.ts: the Records tab and menu dialogs, loaded on their own)
e2e/               browser smoke test (runs in CI)
tools/             balance playtest bot (bot.ts + *.sim.ts play styles, run in parallel)
docs/DESIGN.md     the game design and roadmap
```

Rules of thumb:

- New content goes into `src/engine/data/` (import it from `content.ts`). The engine should not need to change for it.
- Anything that can grow without limit is a `Decimal` (break_eternity.js).
- Every button that can be greyed out is a `HintButton` with a `whyNot` reason (helpers in `src/ui/reasons.ts`): hovering it says why, and what unlocks it.
- The build splits React and break_eternity into their own files (`vite.config.ts`), so browsers keep them cached across releases; rarely opened screens go through `src/ui/lazyParts.ts`.
- The engine never touches `window`/`document`, so it runs the same in the game, in tests and in offline catch-up.
