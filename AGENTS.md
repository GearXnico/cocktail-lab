# AGENTS.md

Guidance for coding agents working in this repository.

cocktail-lab helps people learn, explore and cost cocktails: bilingual recipes, a pour-cost calculator and a menu builder, with interactive 3D drinks. See [README.md](README.md).

## Status

The repository has no code yet: only `README.md`, `LICENSE` (MIT) and `.gitignore`. When you add the first manifest (`package.json`), scripts or CI, update the Stack, Commands and Checks entries below in the same change.

## Stack

- Planned (from the README, not yet in the code): Node, TypeScript, React and three.js.

## Commands

None yet. Do not invent commands: add each one here once it exists in `package.json` or CI and you have run it.

## Git workflow

- Base branch: dev
- Branch names: feat/<topic>, fix/<topic>, docs/<topic>, chore/<topic>
- Commits: Conventional Commits (`feat: …`, `fix: …`, `docs: …`, `chore: …`)
- Checks: none yet
- Changelog: none
- Update method: rebase
- task-flow mode: safe

`main` receives releases from `dev`; do not open working branches or pull requests against `main`.

## Ask before

- Pushing, force-pushing or opening a pull request (task-flow mode is safe).
- Committing to `main` or `dev` directly.
