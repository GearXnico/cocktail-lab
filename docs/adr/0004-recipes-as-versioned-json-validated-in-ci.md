# 0004. Store recipes as versioned JSON in the repo, validated with Zod in CI, following IBA specs

Status: Accepted · Date: 2026-10-29

## Context

v1 ships a curated, public recipe library: six families (Sours, Spirit-forward, Highballs & Collins, Sparkling & spritz,
Tiki & tropical, Latin American) with at least 5 recipes each, every text in Spanish and English
(see [the v1 design](../design/v1.md)). Recipes are not user-submitted, the agreed scope has no database,
and the specs must be reliable.

## Options

1. **JSON files in the repo (`data/ingredients.json`, `data/recipes/<family>/<slug>.json`), validated with Zod in CI:** changes are reviewed in pull requests and versioned with the code; no database; adding a recipe needs a pull request.
2. **A database with an admin interface:** recipes editable without a pull request; adds a database, hosting and authentication, all out of scope for v1.
3. **Do nothing (JSON without validation):** least setup; a missing translation, unknown ingredient or bad amount reaches users or breaks the API at runtime.

## Decision

We will keep recipes and the ingredient catalogue as JSON in the repository, checked in CI by `validate-data` against the Zod schemas in `core`
(schema, unique ids, every `ingredientId` exists, both languages non-empty, at least 5 recipes per family), and the API validates them again at startup and refuses to start on error.
Specs follow the IBA when the cocktail has an IBA spec, with its URL in `sources`, and the maintainer reviews every recipe pull request,
because recipes are curated content that must be correct in both languages and change only through review.

## Consequences

- Better: every recipe change is reviewed, versioned and validated before it merges; the same schemas type the API and the web.
- Worse: only people who can open a pull request can add recipes; the maintainer's review is a bottleneck for content.
- Worse: a schema change needs `schemaVersion` handling for existing files.
- Revisit when: recipes need to be edited by people outside the repository, or the library grows beyond what pull-request review can handle.
