# Drink viewer spike

Throwaway prototype for [ADR 0006](../../docs/adr/0006-procedural-3d-drink-viewer-in-v1.md): every drink is built in code with three.js from `data/recipes/**`. Not product code, outside the npm workspaces, no tests.

## Run

```
cd spikes/drink-viewer
npm ci
npm run dev      # http://127.0.0.1:5199/
npm run build    # tsc --noEmit + vite build
```

URL parameters: `?recipe=negroni&step=2&glass=tiki-mug&ice=large-cube`, and `?nowebgl` to see the fallback message. The Glass and Ice selects override the recipe, because no recipe uses `nick-and-nora`, `tiki-mug` or `large-cube` yet.

## Hint fields it needed

All in [src/visual-hints.ts](src/visual-hints.ts), keyed by recipe id. These are the candidate schema additions:

- `color` (`#rrggbb`): all 31 recipes.
- `garnish`: `{lime,lemon,orange}-{wheel,wedge,twist}`, `cherry`, `olive`, `mint`, `pineapple`, `salt-rim`, `bitters-drops`, `spice-dusting`. Compared with the ADR list it adds `lime-twist` (Mai Tai); `lemon-wedge` and `orange-wedge` come free with the pattern.
- `cloudy` (boolean): shaken, juice or cream drinks are opaque, stirred ones are see-through. 18 recipes.
- `topColor`: second tone for the `topUp` line; its share comes from the ml amounts. 3 recipes.
- `foam` (colour): egg-white head. 2 recipes.
- `layers` (`{ color, share }[]`, bottom to top): Terremoto's grenadine.
- `scoop` (colour): Terremoto's ice cream. It is an ingredient, not a garnish, so `garnish` cannot carry it.

## Build size (production, gzip)

three.js 0.187 is 150.3 KB and the viewer code 6.8 KB: 157.1 KB, both loaded on demand. The page itself, with the 31 recipes as JSON, is 12.3 KB. The viewer only fits v1's 200 KB budget as a dynamic `import()`, which is how this page loads it.

## What looked weak

- Glass is a blending trick, not refraction: thick bases glow white and the liquid does not bend behind the wall.
- Ice is drawn over the liquid, so it looks pale and flat in dark drinks and disappears inside cloudy ones.
- The tiki mug is a wavy brown vase (no face); the mint sprig and the pineapple wedge are crude.
- Nothing shows muddled fruit (Caipirinha, Mojito), bubbles, the sugar cube, a half salt rim or a half wheel.
- The fill level is fixed per glass, not computed from the recipe's ml; garnish positions are fixed slots and can collide.
- The shake wobbles the serving glass, which is not what a shake is; the hidden-tab pause is coded but was not observed.
