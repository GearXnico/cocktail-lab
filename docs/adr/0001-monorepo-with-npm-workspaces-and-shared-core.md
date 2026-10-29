# 0001. Use a monorepo with npm workspaces and a shared core package

Status: Accepted · Date: 2026-10-29

## Context

cocktail-lab v1 has a Node + TypeScript API and a React + Vite web app (see [the v1 design](../design/v1.md)).
Both need the same recipe and ingredient schemas, the same costing rules and the same search normalisation.
If each app had its own copy, the cost shown in the web and the cost returned by the API could drift apart.
The repository has no code and no package manager yet.

## Options

1. **Monorepo with npm workspaces and a shared `core` package:** one definition of schemas, costing and search used by both apps; npm ships with Node, so there is nothing extra to install.
2. **Monorepo with pnpm workspaces:** stricter dependency isolation and faster installs; one more tool for every contributor and in CI.
3. **Do nothing (each app keeps its own schemas and costing):** no shared package to set up; costing and validation can drift between the API and the web.

## Decision

We will use a single repository with npm workspaces: `packages/core` (Zod schemas, unit conversion, costing, search, no I/O),
`apps/api`, `apps/web`, plus `data/` and `scripts/`, because both apps must compute the same results from one definition,
and npm workspaces cover that for now without adding a tool.

## Consequences

- Better: one source of truth for schemas and costing; a change to a rule is tested once and reaches both apps in the same pull request.
- Worse: CI builds and tests every workspace on each change; `core` must stay free of browser and Node-only APIs.
- Revisit when: npm workspaces become limiting (install time, dependency hoisting problems), which would reopen pnpm.
