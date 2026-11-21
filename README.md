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

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine tests (vitest)
npm run build      # static site in dist/, host anywhere
npm run smoke      # browser smoke test (Playwright; PW_CHANNEL=chrome uses your Chrome)
npm run playtest   # balance bot, writes playtest-report.*.txt (PLAYTEST_HOURS=150 for a long main run)
```

## Project layout

```
src/
  engine/          pure TypeScript game rules: no browser, no React
    content.ts     ALL game content as data (ingredients, staff, upgrades, regions, story)
    state.ts       the saved game shape + new game
    rules.ts       derived values: modifiers, costs, capacities
    tick.ts        the simulation step (also used for offline progress)
    actions.ts     everything the player can do
    automation.ts  managers: perks that buy things for you
    badges.ts      badges; badgeBonus.ts: which ones add income
    save.ts        save/load/export with version merge
    format.ts      number formatting (K, M, B … then 1.23e45)
  game/
    store.ts       real-time loop, autosave, offline catch-up, React hook
    storage.ts     save backend + backup copy (localStorage)
  ui/              React panels
e2e/               browser smoke test (runs in CI)
tools/             balance playtest bot (bot.ts + *.sim.ts play styles, run in parallel)
docs/DESIGN.md     the game design and roadmap
```

Rules of thumb:

- New content goes into `content.ts`. The engine should not need to change for it.
- Anything that can grow without limit is a `Decimal` (break_eternity.js).
- Every button that can be greyed out is a `HintButton` with a `whyNot` reason (helpers in `src/ui/reasons.ts`): hovering it says why, and what unlocks it.
- The engine never touches `window`/`document`, so it runs the same in the game, in tests and in offline catch-up.
