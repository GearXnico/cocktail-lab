# Drink viewer spike

Throwaway prototype for [ADR 0006](../../docs/adr/0006-procedural-3d-drink-viewer-in-v1.md): every drink is built in code with three.js from `data/recipes/**`. Not product code, outside the npm workspaces, no tests.

## Run

```
cd spikes/drink-viewer
npm ci
npm run dev      # http://127.0.0.1:5199/
npm run build    # tsc --noEmit + vite build
```

URL parameters: `?recipe=manhattan&step=0&glass=tiki-mug&ice=large-cube&technique=throw`, and `?nowebgl` to see the fallback message. The Glass, Ice and Technique selects override the recipe, because no recipe uses `nick-and-nora`, `tiki-mug`, `large-cube`, `dry-shake`, `throw` or `swizzle` yet. Steps mode follows the recipe. The technique picks the vessel, with no data field: shaker tin (shake, dry-shake), mixing glass (stir), blender jar (blend), two tins (throw), the serving glass (build, swizzle). With a vessel the steps are: glass, each ingredient into the vessel, ice into the vessel, technique, serving ice, strain or pour, top-ups, garnish. Each ingredient pours in its own colour and the liquid reaches the drink's colour during the technique. Animations are scripted, and instant under `prefers-reduced-motion`.

## Hint fields it needed

All in [src/visual-hints.ts](src/visual-hints.ts). The first four are keyed by recipe id (candidate recipe fields), the last four by ingredient id (candidate catalogue fields):

- `color` (`#rrggbb`): all 31 recipes. `cloudy` (opaque liquid): 18. `topColor` (second tone of the `topUp` line): 3. `foam` (colour of the egg-white head): 2.
- `garnish`: `{lime,lemon,orange}-{wheel,wedge,twist}`, `cherry`, `olive`, `mint`, `pineapple`, `salt-rim`, `bitters-drops`, `spice-dusting`.
- `layers` (`{ color, share }[]`) and `scoop` (colour of the floating ice cream): Terremoto. A layered drink is not stirred.
- `iceAfter` (ingredient lines added before the serving ice, default 0): 5 recipes, all built in the glass.
- Ingredient `color` (provisional, 55 ingredients): the colour it pours in. A clear liquid is as see-through as its colour is pale, so the design's `color` is enough for spirits.
- Ingredient `cloudy` (11 ingredients: juices, cream, milk, puree, orgeat, yolk): opaque whatever the colour. The v1 design does not have it.
- Ingredient `solid` (`scoop`, `sugar-cube`, `sugar`, `mint-leaves`, `lime-wedges`; 5 ingredients): the design's `form` says pour, drop or scoop, but not which shape drops.
- Ingredient `unitMl` (egg white and yolk): the volume of one unit of a liquid counted in units.

## Build size (production, gzip)

three.js 0.187 is 150.3 KB and the viewer code 10.4 KB: 160.7 KB, both loaded on demand (budget 300 KB). The page itself, with the 31 recipes and the ingredient catalogue as JSON, is 15.2 KB.

## What looked weak

- Glass is a blending trick, not refraction: thick bases glow white. Ice is drawn over the liquid, so it looks pale in dark drinks and vanishes in cloudy ones, as do mint, lime and sugar.
- Steel tins hide what is in them: in a shaker the ingredient colours only show in the stream and on the surface seen from above. The mixing glass and the blender show them as bands. No strainer, jigger or bottle: streams start in mid-air and the vessel's ice stays in by itself. The shaker's lid appears only for the shake.
- Every container fills to a fixed line and the level rises by share of ml in height, not by volume; ice and solids displace nothing.
- A top-up skips the vessel and is poured over the strained drink; that rule comes from `topUp`, not from the written steps. The ingredient order is the data's, which is not always the written steps' (Mojito, Old Fashioned, Terremoto's grenadine).
- Not done: `heat` with its pot and the four new glasses of the v1 design (not in the schema yet), bubbles, half salt rim. The tiki mug, mint sprig and pineapple wedge are crude. The hidden-tab pause is coded but was not observed.
