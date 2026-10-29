# 0005. Run costing in the browser; the API costing endpoint mirrors the same function

Status: Accepted · Date: 2026-10-29

## Context

Costing turns the user's ingredient prices into a cost per drink (with waste), a suggested menu price
(from a target cost %, optional tax included by default, rounded up to a configurable step) and a margin
(see [the v1 design](../design/v1.md)). The prices live only in the user's browser ([ADR 0003](0003-user-data-in-the-browser-only.md)),
and the agreed scope includes a stateless costing endpoint in the API.

## Options

1. **The web calls `POST /api/v1/costing`:** one place computes costs; every price leaves the device on each calculation, and costing stops when the API is down.
2. **Costing in the browser only, no API endpoint:** prices stay local and costing works offline; does not meet the agreed scope, which includes a costing endpoint.
3. **Both, sharing one function:** the web calls the costing functions in `core` locally, and `POST /api/v1/costing` calls the same functions for other consumers.

## Decision

We will run costing in the browser through the pure functions in `packages/core`, and the API's `POST /api/v1/costing`
will call those same functions without storing or logging the request body, because users' prices then never leave their device,
costing keeps working when the API is down, and the endpoint required by the scope cannot disagree with the web.

## Consequences

- Better: prices stay on the device; costing, prices and menus work without the API; one set of fixture tests covers both paths.
- Worse: `core` must run unchanged in the browser and in Node; the API endpoint has no first-party consumer in v1, so its use must be checked by its own tests.
- Revisit when: the API ends up with no consumer other than our own web, or costing needs data that only the server has.
