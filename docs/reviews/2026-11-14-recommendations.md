# Recommendations

Review of cocktail-lab on 2026-11-14. It covers `dev` at `f10e9dc` (the [v1 design](../design/v1.md), ADRs 0001 to 0007, `packages/core`, `apps/api`, `data/`, `scripts/`, CI) and the 3D spike on the local branch `feat/drink-viewer-spike`.

Not reviewed: the recipe specs against their sources, the GitHub settings (branch protection), and the API latency target, which was not measured.

Each item says what was found, where, and what to do. Priorities: **P1** decide before the next plan step, **P2** do in the step that touches it, **P3** when convenient.

## The five that matter most

1. **Build the web shell before growing the content** (1.1). Steps 9 to 11 add 48 recipes and ten fields before the first page exists.
2. **Decide how users reach the app** (1.3, 2.1). Hosting is a non-goal, but it decides CORS, the API URL and whether the web can ship without the API.
3. **Add one field that says where an ingredient line goes** (3.1), before 48 more recipes are written against implicit rules.
4. **Remove the contradictions in the design document** (section 5) before step 9 implements it.
5. **Keep one definition of each rule in `core`** (2.3 to 2.7): the loader, unit compatibility, line costs and the recipe summary each exist twice.

## 1. Plan and scope

**1.1 The web is the largest unknown and nothing user-visible exists yet. P1.**
`apps/web` is a one-line placeholder. The plan runs steps 9 to 11 (new fields, visual data, 48 recipes) before step 12 (the first page). The 200 KB budget, i18n, WCAG 2.2 AA and the API integration are all untested until then.
Recommendation: after the wireframes (step 8), do step 12 and 13 with the 31 recipes that exist, then steps 9 to 11. The recipe pull requests are data only and can run in parallel with web work.

**1.2 The v1 scope has roughly doubled with no intermediate release. P1.**
Since the first design: 31 → 79 recipes, 6 → 12 families, a 3D viewer with preparation vessels, My bar, SVG illustrations, a second recipe source. Everything ships at once in 1.0.0.
Recommendation: release from `dev` to `main` in slices. For example 0.1 browse and cost (current data), 0.2 menus and My bar, 0.3 the 3D viewer, 1.0 all twelve families. The release flow in AGENTS.md already supports it.

**1.3 Hosting is a non-goal, but the problem statement is "a single free place". P1.**
Without hosting, v1 has no users other than people who clone the repository. The choice also fixes technical decisions that are open today (2.1, 2.2).
Recommendation: decide the hosting model now, even if the deployment itself stays for later. Free static hosting only works if the web can run without the API.

**1.4 The design is still "Draft" and the plan has no progress marker. P3.**
Seven of sixteen steps are merged. Progress is tracked in the Status section of AGENTS.md, which is out of date: it says `data/` holds "one sample recipe (Daiquiri)" while it holds 31.
Recommendation: set the design to Accepted, mark done steps in the plan, and correct AGENTS.md.

## 2. Architecture and code

**2.1 The web depends on the API for recipes, and the API has no other consumer. P1.**
The design's own recommendation says option A (static) is cheaper "if the API ends up with no consumer other than our own web", and ADR 0005 lists the same revisit condition. Costing, prices and menus already run in the browser.
Recommendation: the web reads recipes through one small interface with two implementations: `fetch` from the API, and JSON generated at build time from `data/` and searched with `searchRecipes` from `core`. It costs little now and keeps free static hosting possible.

**2.2 CORS is specified but not implemented. P2 (step 12).**
The design says "CORS restricted to the configured web origin". [apps/api/src/app.ts](../../apps/api/src/app.ts) registers no CORS plugin, so a Vite dev server on another port cannot call it.
Recommendation: proxy `/api` in the Vite dev server (same origin, no CORS in development). Add `@fastify/cors` with a `WEB_ORIGIN` variable only when a deployment needs it, and say so in the design.

**2.3 The catalogue loader exists twice. P2.**
[apps/api/src/catalogue.ts](../../apps/api/src/catalogue.ts) and [scripts/validate-data.ts](../../scripts/validate-data.ts) both walk `data/recipes/`, parse each file and format issues, down to the same local `Schema<T>` interface. The API's comment says it follows "the same rules as `npm run validate-data`"; nothing enforces that.
Recommendation: one loader (in the API package, or a Node-only entry of `core`), called by both.

**2.4 Unit and measure compatibility is defined twice. P2.**
`COMPATIBLE_UNITS` in [catalogue.ts](../../packages/core/src/catalogue.ts) and the branches of `amountInMeasure` in [units.ts](../../packages/core/src/units.ts) encode the same table. The API's `fits()` finds out by calling `amountInMeasure` and catching the error.
Recommendation: export one `unitFits(unit, measure)` from `units.ts` and use it in all three places.

**2.5 Line costs are computed in the API, with a different rounding rule. P2 (step 13).**
`toLine` in [apps/api/src/costing.ts](../../apps/api/src/costing.ts) rounds with `toFixed`; totals in `core` round with `roundTo`. They disagree on halves: `(1.005).toFixed(2)` is `1.00`, `roundTo(1.005, 2)` is `1.01`. The recipe page will need line costs too, which would be a third copy. ADR 0005 promises that the API and the web call "the same functions".
Recommendation: a `costLines()` in `core` that returns the lines and the total; the API and the web both call it.

**2.6 `drinkCost` rounds before `priceDrink` divides. P3.**
The design says "compute in plain numbers, round once at output". `drinkCost` returns a rounded cost and `priceDrink` computes `rawNet` from it. The effect is at most a minor unit before the price is rounded up to the step.
Recommendation: carry the unrounded cost between the two, or state the two-stage rounding in the design.

**2.7 `RecipeSummary` is an interface in `core` and a separate Zod schema in the API. P2 (step 9).**
[search.ts](../../packages/core/src/search.ts) and [app.ts](../../apps/api/src/app.ts) must be changed together. The list page needs `color` (SVG card) and `taste` (filter), and neither is in the summary or in the `GET /recipes` filters.
Recommendation: define `RecipeSummarySchema` in `core`, infer the type from it, and add `color`, `taste` and the `taste` filter in step 9.

**2.8 The technique, glass and ice lists are inline in `RecipeSchema`. P2 (step 9).**
`BASES` and `FAMILIES` are exported constants; the other three are not. The API reaches them through `RecipeSchema.shape`, and the spike copied them by hand.
Recommendation: export `TECHNIQUES`, `GLASSES` and `ICES`. The filters and the viewer need them.

**2.9 User data is keyed by ingredient and recipe ids. P2 (step 13).**
Prices and menus in localStorage refer to ids. Renaming or removing an id in a later release silently orphans a user's prices.
Recommendation: state that released ids never change; add an alias map for the day one must; let `validate-data --release` compare ids with the previous tag.

**2.10 The size budgets are written down but nothing enforces them. P2 (step 12).**
Initial JS ≤ 200 KB gzip, viewer ≤ 300 KB gzip. The spike measured 160.7 KB for the viewer with three.js.
Recommendation: a CI check from the first web pull request that reads the Vite build output and fails over budget.

**2.11 Responses for data that never changes carry no cache headers. P3.**
The catalogue is loaded once per process. `GET /recipes`, `/recipes/:id` and `/ingredients` could send an `ETag` computed at startup.

## 3. Data model and viewer fields

**3.1 Where an ingredient line goes is spread over implicit rules. P1.**
Today: the technique picks the vessel, lines are "in the order they go into the vessel", and `iceAfter` is an index. The spike had to add a fourth rule: a `topUp` line skips the vessel. Cases these cannot express:

- A measured line added in the glass after straining. `topUp` is set when the spec gives no amount, so a shaken drink finished with a measured soda would pour the soda into the shaker.
- The Sazerac: its absinthe rinses the serving glass, but as the second line of a stirred drink the spike pours it into the mixing glass.
- Floats (a rum or wine float) and muddling in the glass before a shaken part.

Recommendation: one optional per-line field, for example `into: 'glass'`, default the vessel when the technique has one. It replaces the special rule on `topUp`, and `validate-data` can check it.

**3.2 `iceAfter` is an index into `ingredients`. P2 (step 9).**
Reordering lines changes its meaning without any error. It only applies to drinks built in the glass with ice.
Recommendation: `validate-data` checks `iceAfter ≤ ingredients.length`, `ice ≠ none` and a technique without a vessel.

**3.3 The existing data does not follow the new ordering rule. P2 (step 10).**
The design now requires vessel order. The Mojito lists the rum first but pours it after the ice; the Old Fashioned lists the bourbon before the sugar cube; the Terremoto lists the grenadine before the wine while its steps say the opposite. `validate-data` cannot check this.
Recommendation: fix the order in step 10 and add it to the recipe pull request checklist.

**3.4 `form` cannot say which shape drops. P2 (step 9).**
`form` is `pour`, `drop` or `scoop`. The spike needed five shapes for five ingredients: sugar cube, loose sugar, mint leaves, lime wedges, scoop.
Recommendation: make `form` carry the shape (`pour`, `cube`, `powder`, `leaves`, `wedges`, `scoop`). The alternative, a table of ingredient ids in the viewer, ties code to data ids.

**3.5 Ingredients need `cloudy` as well as `color`. P2 (step 9).**
The spike derives transparency from how pale the colour is, which works for spirits. Eleven ingredients are pale but opaque (juices, coconut cream, evaporated milk, orgeat, puree, yolk); with a colour alone, coconut cream renders like water.
Recommendation: add `cloudy?: true` to the ingredient schema.

**3.6 `foam`, layers and `topColor`. P2 (step 9).**
- `foam?: true` is a flag, but the spike used a colour: the Vaina's head is brown, the pisco sour's white. Either derive it from the drink's colour or allow a colour.
- Layers were dropped ("drawn as one liquid for now"). With per-ingredient colours the layers come for free when the drink is not stirred; the viewer only needs a flag such as `layered?: true`. The Terremoto is the case to keep.
- `topColor` can go: the top tone can come from the top-up ingredient's colour.

**3.7 Four recipes have no `sources`. P2 (step 11).**
`pantera-rosa`, `pisco-sour-chilean`, `terremoto` and `vaina-chilena`. ADR 0007 says every source's URL goes in `sources`, and the schema leaves it optional.
Recommendation: fill them, then require at least one source in the schema.

**3.8 `topUp` is set unevenly across similar drinks. P3.**
Set on the Mojito, Aperol Spritz, French 75 and Terremoto; not set on the John Collins, Cuba Libre, Paloma, Moscow Mule or Mimosa. It follows each spec's wording, but it changes how the same kind of line is displayed.
Recommendation: state in the design that the flag means "the amount is approximate", and use 3.1 for placement.

**3.9 The licence of `data/` is not stated. P3.**
`LICENSE` is MIT. ADR 0007 is careful about copying; the repository should say under which terms its own steps, histories and measures can be reused.

## 4. Product

**4.1 Garnish and ice cost nothing in a pour cost. P2 (step 13).**
The garnish is free text and never priced. A lime wheel, a cherry and a mint sprig are a real part of a drink's cost, and bars add them.
Recommendation: one optional "extras per drink" amount in the user's defaults, not per-garnish prices.

**4.2 Search matches names only. P3.**
Typing "campari" finds nothing unless the user opens the ingredient filter. Let `q` match ingredient names in both languages.

**4.3 Step lists get long. P2 (step 14).**
With one step per ingredient, the Zombie has 14 steps. Add an auto-play, and consider grouping consecutive pours into the same vessel.

## 5. Contradictions in the design document

Fix before step 9. All are in [design/v1.md](../design/v1.md).

| Where | Problem |
| --- | --- |
| Interfaces vs Security | `POST /costing` body is "≤ 16 KB, ≤ 30 lines" in one and "64 KB, ≤ 100 ingredients" in the other. The code has a 64 KB global limit, 16 KB and 30 lines for costing. |
| Data, `Ingredient` | "two optional fields for the viewer" lists three (`color`, `form`, `unitMl`). |
| Requirements, "Recipe fields" and "Ingredient fields" | Still list only colour, garnish kinds, taste and description; the Design section adds `cloudy`, `foam`, `iceAfter`, `color`, `form`, `unitMl`. |
| Interfaces, `GET /recipes` | No `taste` filter and no `color` in `RecipeSummary`; plan step 12 needs both. |
| Requirements, API | "p95 < 50 ms locally on 30 recipes"; the target catalogue is 79. |
| Unit conversion | The design and `core` say a dash is 0.8 ml. The spike used its own table with 0.9; the product viewer must import `toMl` from `core`. |

## 6. From the spike to step 14

**6.1 The spike branch only exists on one machine. P1.**
ADR 0006 and the design cite `feat/drink-viewer-spike` and its `visual-hints.ts` as the starting point of steps 10 and 14. `origin` has no such branch.
Recommendation: push the branch, or tag it, without merging it.

**6.2 Move the step plan into `core`. P2.**
`planSteps` and the technique-to-vessel table in the spike's `src/steps.ts` import nothing from three.js. In `core`, the tests the design asks for (ingredient order, vessel, serving ice skipped) become table tests with no DOM, and the same list gives a text version of the steps.

**6.3 Draw the SVG illustrations from the glass profiles. P2.**
Each glass is a list of profile points. The same points give the SVG silhouette for the cards and the no-WebGL fallback, so shapes are drawn once.

**6.4 The viewer is not keyboard-accessible. P2.**
The canvas is `role="img"` and orbiting needs a pointer. For WCAG 2.2 AA, show the steps as text beside the viewer (6.2) and add rotate buttons.

**6.5 What the spike did not cover. P2.**
The `heat` technique with its pot, and the glasses `mug`, `julep-cup`, `pint` and `shot`: they are in the design but not in the schema yet. The spike's README lists what looked weak (glass material, steel tins hiding the colours, no strainer, a fixed fill line).

**6.6 Viewer tests need a DOM. P3.**
The design says "headless, no WebGL needed". True for the scene graph, but the citrus and shadow textures call the 2D canvas; the code already tolerates a missing context, so jsdom or happy-dom is enough.

**6.7 Do not carry the spike's ESLint ignore into `dev`.** The branch adds `spikes/` to the ignores in `eslint.config.js`; it only makes sense while the folder exists.

## 7. Repository, CI and documentation

**7.1 The README is two lines. P2.** The commands live only in AGENTS.md. The API already runs; say how in the README now, not in step 16.

**7.2 No coverage is measured. P2.** `core` is the money arithmetic and is well tested, but nothing shows what the tests miss. Add `vitest --coverage` with a threshold for `packages/core`.

**7.3 CI is in good shape.** Actions pinned by SHA, `npm ci --ignore-scripts`, audit, gitleaks, CodeQL, Dependabot into `dev`, the release check on pull requests into `main`. The only gap found is the size check (2.10).

**7.4 Not verified.** Branch protection on `dev` and `main`: AGENTS.md says not to commit to them directly, and the repository settings should enforce it.
