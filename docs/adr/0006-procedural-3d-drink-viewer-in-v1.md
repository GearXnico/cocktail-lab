# 0006. Build the 3D drink viewer in code with three.js, in v1

Status: Accepted · Date: 2026-11-13

## Context

The [v1 design](../design/v1.md) first left the 3D drink viewer for v2. The maintainer moved it into v1: each recipe
shows an interactive model of the drink and a step-by-step mode that follows the recipe's ingredients.
Recipes already describe `glass`, `ice`, `technique` and a free-text `garnish`; there are 31 recipes and 10 glass types.
The web has a budget of 200 KB gzip of initial JS, the project costs $0 and has no hosting for large assets,
and recipe images must not raise copyright questions.

## Options

1. **Models built in code from recipe data:** one lathe profile per glass type, the liquid in the drink's colour, ice by type and simple garnish shapes, all in three.js; needs a few optional fields in the recipe schema; looks stylised, not photographic.
2. **Imported models (glTF) per glass and garnish:** more realistic; needs modelling tools or third-party assets with their licences, adds files to the repo and to every page load, and still needs the data fields to pick and colour them.
3. **Keep 3D in v2, SVG illustrations only in v1:** no new dependency now; leaves out the feature the maintainer wants in v1.

## Decision

We will build every drink model in code with three.js from the recipe data, because it costs nothing, adds no binary
assets or licences, follows the data when a recipe changes, and stays small. three.js and the viewer load only on the
recipe page, outside the initial JS budget, with their own budget of 300 KB gzip (the spike used 157 KB). Motion is scripted
(ice drops, pours rise, a scoop lands on the bottom and floats up as the glass fills), without a physics library. The recipe schema gains optional `color`, `cloudy`, `foam`,
`garnishKinds` and `taste`, and ingredients gain optional `description`, `color` and `scoop`; the spike on the `feat/drink-viewer-spike` branch set these lists.

## Consequences

- Better: one viewer covers every recipe, including new ones, with no assets to maintain; the step mode reuses the same model; an SVG illustration built from the same fields covers cards and browsers without WebGL.
- Worse: drinks look stylised and colours are approximate; every recipe needs its visual fields filled and reviewed; the web gains three.js as a dependency and the viewer needs its own tests.
- Revisit when: stylised models are not good enough for users, or a recipe needs a glass or garnish that a lathe profile and simple shapes cannot draw.
