# 0002. Use Fastify over Express for the API

Status: Accepted · Date: 2026-10-29

## Context

The v1 API serves recipes (list, search, detail), the ingredient catalogue and a stateless costing calculation
(see [the v1 design](../design/v1.md)). It is written in Node + TypeScript, validates input with Zod and is tested with Vitest.
The framework was left open between Fastify and Express.

## Options

1. **Fastify:** Zod schemas become route schemas through `fastify-type-provider-zod`, so validation, handler types and 400 errors come from one definition; `app.inject()` tests routes without opening a port. Less familiar to some contributors than Express.
2. **Express:** the most familiar framework; Zod validation needs hand-written middleware, types come partly from `@types/express` and are kept in sync by hand, and tests need `supertest`.
3. **No API (static web app only):** lowest effort and fully offline; does not meet the agreed scope, which includes an API.

## Decision

We will build the API with Fastify, because it lets one Zod schema validate the request, type the handler and shape the error,
and its `inject()` keeps API tests fast and free of network setup.

## Consequences

- Better: less glue code between Zod, TypeScript and the routes; request validation cannot silently diverge from the types.
- Worse: contributors who only know Express have something new to learn; we depend on the Zod type provider plugin.
- Revisit when: most contributors only know Express, or the API ends up with no consumer other than our own web (then a static web app is cheaper).
