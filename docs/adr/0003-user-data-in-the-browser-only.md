# 0003. Keep user data in the browser only, with file export and no accounts

Status: Accepted · Date: 2026-10-29

## Context

cocktail-lab is an open app with no login. Each user keeps their own ingredient prices, costing defaults
(currency, waste %, target cost %, tax, rounding step) and menus (see [the v1 design](../design/v1.md)).
The expected size is small (up to about 1 MB: roughly 200 prices and 20 menus), and v1 has no deployment budget.

## Options

1. **localStorage with export and import as a JSON file:** no server state, no personal data to protect, works without the API; data is tied to one browser and lost if the user clears it without exporting.
2. **Accounts with a server database:** sync between devices and backups; needs authentication, a database, hosting and handling of personal data, all out of scope for v1.
3. **Do nothing (no persistence):** simplest; users retype every price on each visit, which defeats menu costing.

## Decision

We will store user data only in the browser, under one versioned localStorage key (`cocktail-lab:v1`),
validated with the same Zod schema used for export and import, because the agreed scope is an open app with no accounts
and no database, and this keeps users' prices on their own device.

## Consequences

- Better: no accounts, no personal data on the server, nothing to host for user data; prices never leave the device.
- Worse: no sync between devices; clearing browser data loses everything not exported. The app must handle localStorage being unavailable or full (run in memory and warn) and stored data failing validation (keep a copy under `cocktail-lab:v1:corrupt` and start empty).
- Worse: every change to the stored shape needs a migration in the `version` chain.
- Revisit when: users need the same data on several devices or shared within a bar team.
