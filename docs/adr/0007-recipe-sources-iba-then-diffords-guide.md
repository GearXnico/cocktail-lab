# 0007. Take recipe specs from the IBA first, then Difford's Guide

Status: Accepted · Date: 2026-11-14 · Amends: [ADR 0004](0004-recipes-as-versioned-json-validated-in-ci.md)

## Context

[ADR 0004](0004-recipes-as-versioned-json-validated-in-ci.md) made the IBA the only source of recipe specs. The catalogue now grows to
about 79 recipes in 12 families (see [the v1 design](../design/v1.md)), and several new families (Hot drinks, Beer, Mocktails) are
mostly drinks the IBA does not list. Some IBA specs also differ from how the drink is made today.
Recipes are public content, so sources must be reliable, and their text must not be copied.

## Options

1. **IBA only:** one official standard; leaves most of the new families without a source and keeps outdated specs.
2. **IBA first, then Difford's Guide:** the IBA when it has a spec; Difford's Guide, a large and regularly reviewed database, when the IBA has none or its spec is outdated; the maintainer decides when they differ.
3. **Any reputable source the author picks:** most flexible; specs and quality vary from recipe to recipe and reviews get harder.

## Decision

We will take specs from the IBA when it has one, and from Difford's Guide when it has none or its spec is outdated,
because the IBA keeps the classics tied to the official standard and Difford's Guide covers the rest with reviewed specs.
Regional classics that neither covers (Chilean drinks) may use another published source the maintainer accepts.
Only measures are taken from a source; steps and history are written for cocktail-lab. Difford's Guide forbids copying parts
of its site, so recipes are looked up one at a time and never scraped. Every source's URL goes in `sources`,
and when the sources disagree the maintainer decides in the recipe pull request.

## Consequences

- Better: every new family has a reliable source; outdated IBA specs can be corrected with a cited reference.
- Worse: reviews must compare two sources when they differ; each recipe needs its own lookup, with no bulk import.
- Revisit when: Difford's Guide changes its terms, or a source with an open licence covers the catalogue.
