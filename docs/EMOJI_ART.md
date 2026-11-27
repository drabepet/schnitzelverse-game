# Our own emoji: art spec

The game draws every icon with emoji. They come from Google's Noto Emoji (bundled font, Apache 2.0, built by `tools/emoji-font.ts`). Where an emoji only stands in for something (🫙 for flour, 🍘 for a breaded cutlet), we draw our own picture and it replaces Noto's for that emoji, everywhere in the game. Anything not redrawn stays Noto.

## How a picture gets into the game

1. Draw it as an **SVG, `viewBox="0 0 128 128"`**, and save it in `art/emoji/` named like Noto's file: `emoji_u` + the code point(s) + `.svg`, e.g. `emoji_u1f373.svg` for 🍳, `emoji_u1f9d1_200d_1f373.svg` for 🧑‍🍳 (no `fe0f`).
2. Run `node tools/emoji-font.ts` (see its header for the Python tools it needs). It prints "Our own pictures: …" with every emoji it took from `art/emoji/`.
3. Check every place the emoji is used: one picture serves all of them (🫙 is flour and also Grandma's lard). The emoji brief lists them.

SVG rules, so the font builder (nanoemoji / picosvg) accepts it: plain shapes, fills, strokes and linear or radial gradients; clip paths are fine. No `<use>`, no filters, no blur, no images, no text.

## Drawn so far

| Emoji | Stands for | Picture |
|---|---|---|
| 🍳 | Fry, the kitchen, pans | Grandma's pan with a golden schnitzel and a lemon wedge |
| 🫓 | Pounded cutlets | thin raw pork cutlet with mallet marks |
| 🍘 | Breaded cutlets | the cutlet in breadcrumbs, ready to fry |
| 🫙 | Flour, Grandma's lard | glass jar full of something white |
| 🫗 | Frying oil | bottle of sunflower oil |
| 🌾 | Wheat | two ears of wheat |
| 🍖 | Hot schnitzel (only used for that) | golden schnitzel with steam and a lemon wedge |
| 🍗 | Cold schnitzel (only used for that) | the same schnitzel gone pale, with a snowflake |

## Style: match Noto

- Soft flat shapes with gentle gradients, a lighter highlight top-left and a darker edge or "thickness" shape underneath. **No dark outlines** (Noto has none).
- Front or slight three-quarter view, light from the top left.
- Real food colours; the golden crust is `#F8C863` → `#E9A437` → `#CC831E`.
- **It must read at 16–24 px**, the size the game shows it at: bold silhouette, few details. Check it on the game's dark brown panels and on light cream.

## The emoji brief

`node tools/emoji-brief.ts` builds `emoji-brief/` (git-ignored), with this spec as README.md:

- `index.html`: every emoji on screen, what the game uses it for, its picture in the game now and on this computer. The **Start here** group is ingredients, kitchen steps, family, places, vehicles and the farm.
- `emoji.csv`: the same list as a spreadsheet.
- `png/game/<code>.png` and `png/system/<code>.png`: the current pictures, 512×512.

Describe a subject from what the game uses the icon for (the list on each card), not from the emoji's Unicode name: 🫙 is *flour* in the game, not "a jar".

A picture made elsewhere (an image AI, an illustrator) has to end up as an SVG following the rules above; a PNG can't go into the font as it is.
