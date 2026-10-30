# AGENTS.md

Guidance for coding agents working in this repository.

cocktail-lab helps people learn, explore and cost cocktails: bilingual recipes, a pour-cost calculator and a menu builder, with interactive 3D drinks. See [README.md](README.md).

## Status

`packages/core` holds the Zod schemas for ingredients and recipes, `validateCatalogue`, unit conversion (including ml → oz for display) and costing; `data/` holds the ingredient catalogue and one sample recipe (Daiquiri). `packages/core` also has the recipe search (`searchRecipes`). `apps/api` serves recipes, ingredients and stateless costing (`POST /costing`) under `/api/v1`; `apps/web` is still a placeholder. The v1 plan is in [docs/design/v1.md](docs/design/v1.md), and the decisions behind it are in [docs/adr/](docs/adr/).

## Stack

- Node 26 LTS (`.nvmrc`), npm workspaces: `packages/*`, `apps/*`.
- TypeScript 6.0 strict (`tsconfig.base.json`); TypeScript 7 waits for typescript-eslint support.
- ESLint 10 with typescript-eslint `strictTypeChecked` (`eslint.config.js`).
- Vitest 5, one project per workspace (`vitest.config.ts`).
- Zod 4.6.7 in `packages/core` (schemas); recipe data is JSON in `data/`, checked by `scripts/validate-data.ts`.
- Fastify 5 with `fastify-type-provider-zod` in `apps/api`; the API loads and validates `data/` at startup and does not start if it is invalid.
- Planned, added by the step of the plan that needs them: React + Vite, react-i18next; three.js in v2.

## Commands

Run from the repository root:

- `npm ci`: install dependencies.
- `npm run lint`: ESLint on the whole repository.
- `npm run typecheck`: `tsc --noEmit` in every workspace.
- `npm test`: Vitest, all workspaces.
- `npm run build`: `tsc` into each workspace's `dist/`.
- `npm run validate-data`: checks `data/` (needs `npm run build` first); add `-- --release` to also require 5 recipes per family.
- `npm run build && npm start -w @cocktail-lab/api`: starts the API on `127.0.0.1:3000`; `PORT`, `HOST` and `DATA_DIR` override the defaults.
- `npm audit --audit-level=high`: dependency audit, as in CI.

Do not invent commands: add each one here once it exists in `package.json` or CI and you have run it.

## Git workflow

- Base branch: dev
- Branch names: feat/<topic>, fix/<topic>, docs/<topic>, chore/<topic>
- Commits: Conventional Commits (`feat: …`, `fix: …`, `docs: …`, `chore: …`)
- Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run validate-data`, `npm audit --audit-level=high`; CI (`.github/workflows/ci.yml`) also runs gitleaks
- Changelog: none
- Update method: rebase
- task-flow mode: safe
- Tracker: GitHub Issues; `Closes #n` in the pull request description
- Docs: docs/, ADRs in docs/adr/
- Release: SemVer; pull request from dev to main, then tag vX.Y.Z on main; no release/ branches

`main` receives releases from `dev`; do not open working branches or pull requests against `main`.

## Ask before

- Pushing, force-pushing or opening a pull request (task-flow mode is safe).
- Committing to `main` or `dev` directly.
