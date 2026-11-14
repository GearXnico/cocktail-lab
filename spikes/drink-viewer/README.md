# Drink viewer spike

Throwaway prototype for [ADR 0006](../../docs/adr/0006-procedural-3d-drink-viewer-in-v1.md): every drink is built in code with three.js from `data/recipes/**`. Not product code, outside the npm workspaces, no tests.

## Run

```
cd spikes/drink-viewer
npm ci
npm run dev      # http://127.0.0.1:5199/
npm run build    # tsc --noEmit + vite build
```

URL parameters: `?recipe=terremoto&step=2&glass=tiki-mug&ice=large-cube`, and `?nowebgl` to see the fallback message. The Glass and Ice selects override the recipe, because no recipe uses `nick-and-nora`, `tiki-mug` or `large-cube` yet. Steps mode follows the recipe: glass, one step per ingredient line in the recipe's order (ice where `iceAfter` puts it), technique, garnish. Each step is labelled with what is added. Animations are scripted, and instant under `prefers-reduced-motion`.

## Hint fields it needed

All in [src/visual-hints.ts](src/visual-hints.ts). Keyed by recipe id, the candidate recipe-schema additions:

- `color` (`#rrggbb`): all 31 recipes.
- `garnish`: `{lime,lemon,orange}-{wheel,wedge,twist}`, `cherry`, `olive`, `mint`, `pineapple`, `salt-rim`, `bitters-drops`, `spice-dusting`. Compared with the ADR list it adds `lime-twist` (Mai Tai); `lemon-wedge` and `orange-wedge` come free with the pattern.
- `cloudy` (boolean): shaken, juice or cream drinks are opaque, stirred ones are see-through. 18 recipes.
- `topColor`: second tone for the `topUp` line. 3 recipes. `foam` (colour): egg-white head. 2 recipes.
- `layers` (`{ color, share }[]`, bottom to top) and `scoop` (colour of the floating ice cream): Terremoto.
- `iceAfter` (number of ingredient lines added before the ice, default 0): 5 recipes. The written steps say when the ice goes in, but only as prose.
- Keyed by ingredient id, the candidate catalogue additions: `solid` (`scoop`, `sugar-cube`, `sugar`, `mint-leaves`, `lime-wedges`; 5 ingredients drop in instead of pouring) and `ml` (volume of one unit; egg white and yolk).

## Build size (production, gzip)

three.js 0.187 is 150.3 KB and the viewer code 8.2 KB: 158.5 KB, both loaded on demand. The page itself, with the 31 recipes and the ingredient catalogue as JSON, is 14.0 KB. The viewer only fits v1's 200 KB budget as a dynamic `import()`, which is how this page loads it.

## What looked weak

- Glass is a blending trick, not refraction: thick bases glow white and the liquid does not bend behind the wall.
- Ice is drawn over the liquid, so it looks pale and flat in dark drinks and disappears inside cloudy ones; so do the mint leaves, lime wedges and sugar once a cloudy drink covers them.
- Every pour has the drink's final colour (gin pours red in a Negroni): true colours need a colour per catalogue ingredient. The stream starts in mid-air, with no bottle or jigger.
- Every glass fills to the same line and the level rises by share of ml in height, not by volume; ice and solids displace nothing.
- The ingredient order is the data's, which is not always the written steps' (Mojito, Old Fashioned, Terremoto's grenadine). Shaken drinks are poured into the serving glass and the glass wobbles, which is not what a shake is. A layered drink has an empty technique step.
- The tiki mug is a wavy brown vase; the mint sprig and the pineapple wedge are crude. No bubbles, half salt rim or half wheel; garnish positions are fixed slots and can collide. The hidden-tab pause is coded but was not observed.
