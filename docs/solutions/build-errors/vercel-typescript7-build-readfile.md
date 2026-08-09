---
title: Vercel backend deploy fails on recursive vercel build and TypeScript 7 readFile
date: 2026-08-09
category: build-errors
module: backend
problem_type: build_error
component: tooling
symptoms:
  - "Vercel backend deploy fails because npm run build invokes vercel build recursively"
  - "After removing recursive vercel build, deploy fails with TypeError: Cannot read properties of undefined (reading 'readFile') during Vercel Node builder TypeScript compile"
root_cause: config_error
resolution_type: dependency_update
severity: high
tags:
  - vercel
  - typescript
  - build-error
  - hono
related_components:
  - backend
---

# Vercel backend deploy fails on recursive vercel build and TypeScript 7 readFile

## Problem

The OpenSen Hono API (`backend/`) failed to deploy on Vercel. Two separate but related misconfigurations in `backend/package.json` caused the failures:

1. **Recursive build invocation** — The `build` script called `npx vercel build`. Vercel already runs `npm run build` during its own deploy pipeline, so the project invoked `vercel build` inside `vercel build`, which Vercel rejects outright.
2. **TypeScript 7 incompatibility with Vercel's Node builder** — After removing the recursive call, deploy still failed. Vercel's Node builder compiles TypeScript via the JavaScript Compiler API (`ts.sys.readFile`). TypeScript 7 ships a native compiler and no longer exposes `ts.sys`, so the builder crashed when it tried to read files through an undefined API surface.

Both issues blocked production deploys for the backend. Linear issue: [KEI-150](https://linear.app/keios/issue/KEI-150/sua-loi-vercel-build-dje-quy-vercel-build-trong-backend).

## Symptoms

### Symptom 1 — Recursive `vercel build`

During Vercel deploy, the build step failed with:

```
Error: `vercel build` must not recursively invoke itself.
```

Vercel runs `npm run build` automatically; when that script called `npx vercel build`, the platform detected infinite recursion and aborted.

### Symptom 2 — TypeScript 7 `readFile` crash

After the recursive-build fix landed, deploy progressed further but still failed. Vercel logged:

```
Using TypeScript 7.0.2 (local user-provided)
Error: Cannot read properties of undefined (reading 'readFile')
```

The Node builder expected `ts.sys.readFile` from the TypeScript package. With TypeScript 7.0.2 installed, `ts.sys` is undefined, so accessing `.readFile` threw at runtime (see [PR #3](https://github.com/KeiosStarqua/opensen/pull/3)).

## What Didn't Work

**Fixing only the recursive `vercel build` call was not sufficient.**

The first commit on the fix branch (`dbf3447`) changed `build` from `npx vercel build` to `npm run typecheck`, which stopped the recursion error. Deploy could then reach Vercel's TypeScript compilation step — but that step still picked up TypeScript 7.x (resolved from `^7.0.2` in `devDependencies`) and crashed on the missing `ts.sys.readFile`.

Removing `vercel build` from the npm script was necessary but incomplete. A follow-up commit (`a67104d`) pinned TypeScript to the 6.x line so Vercel's builder could use the legacy JavaScript Compiler API. Both commits landed together in [PR #3](https://github.com/KeiosStarqua/opensen/pull/3).

## Solution

### Before (`backend/package.json`)

```json
{
  "scripts": {
    "build": "npx vercel build"
  },
  "devDependencies": {
    "typescript": "^7.0.2"
  }
}
```

(Exact pre-fix caret may have resolved to 7.0.2; the deploy log reported `Using TypeScript 7.0.2 (local user-provided)`.)

### After (`backend/package.json`)

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "build": "npm run typecheck"
  },
  "devDependencies": {
    "typescript": "~6.0.3"
  }
}
```

Current tree: [`backend/package.json`](../../../backend/package.json) — `build` delegates to `typecheck`; `typescript` is pinned to `~6.0.3`.

### Related documentation updates

- [`backend/README.md`](../../../backend/README.md) — Setup section explains the 6.x pin and why; Scripts table documents that `npm run build` is a typecheck only and must not call `vercel build`.
- [`backend/AGENTS.md`](../../../backend/AGENTS.md) — Local Contracts: keep `typescript` pinned to the 6.x line until Vercel's Node builder supports TypeScript 7's native compiler API.

### PRs

| PR | Change |
|----|--------|
| [PR #3](https://github.com/KeiosStarqua/opensen/pull/3) | Two commits: `dbf3447` (build → typecheck) then `a67104d` (pin `typescript` to `~6.0.3` + docs) |
| [PR #5](https://github.com/KeiosStarqua/opensen/pull/5) | Parallel branch with the combined fix in one commit (`e2d9025`); merged after PR #3 |

Hono on Vercel is zero-config: Vercel handles bundling and deployment. The package `build` script only needs to validate the project (typecheck), not re-invoke the Vercel CLI.

## Why This Works

Vercel's Node.js serverless builder compiles TypeScript source using the **TypeScript JavaScript Compiler API** — programmatic access to `typescript` as a library. That API historically exposes `ts.sys`, a host abstraction that includes `readFile` for loading source files from disk.

TypeScript 7 moved to a **native compiler** implementation. The published `typescript` package in the 7.x line no longer provides `ts.sys` in the same way; `ts.sys` is `undefined` when the builder imports it. Hence: `Cannot read properties of undefined (reading 'readFile')`.

Pinning to `~6.0.3` keeps a TypeScript release that still exports `ts.sys.readFile`, which matches what Vercel's builder expects today. Separately, making `build` run `tsc --noEmit` satisfies Vercel's `npm run build` hook without nesting `vercel build` inside itself.

As documented in [`backend/README.md`](../../../backend/README.md):

> Keep `typescript` on the pinned 6.x release: Vercel's Node builder requires the JavaScript compiler API, which the native TypeScript 7 package does not provide.

## Prevention

1. **Never call `vercel build` inside `package.json` scripts** — Vercel invokes `npm run build` during deploy. Use `build` for project validation only (`tsc --noEmit` or equivalent). Reserve `npx vercel deploy` for the explicit `deploy` script ([`backend/package.json`](../../../backend/package.json)).
2. **Pin `typescript` to the 6.x line** until Vercel documents support for TypeScript 7's native compiler. Use a tilde range (`~6.0.3`) rather than a caret that can float to 7.x. Re-check compatibility before bumping major versions.
3. **Document the constraint in DOX** — [`backend/AGENTS.md`](../../../backend/AGENTS.md) and [`backend/README.md`](../../../backend/README.md) already record the pin and the no-recursive-build rule. Any agent or contributor editing `backend/package.json` should read those files first.
4. **Verify locally before deploy** — From `backend/`: `npm ci`, `npm run build`, `npm test`. Confirm the lockfile resolves `typescript@6.0.x` (see `backend/package-lock.json`).

When Vercel adds first-class support for TypeScript 7's native API, revisit the pin in `package.json`, `AGENTS.md`, and `README.md` together and run a full deploy smoke test.

## Related Issues

- [KEI-150](https://linear.app/keios/issue/KEI-150/sua-loi-vercel-build-dje-quy-vercel-build-trong-backend) — original bug report and acceptance criteria
- [PR #3](https://github.com/KeiosStarqua/opensen/pull/3) — sequential build-script fix and TypeScript 6.x pin (merged first)
- [PR #5](https://github.com/KeiosStarqua/opensen/pull/5) — combined fix on a parallel branch (merged after PR #3)
- [`docs/solutions/tooling-decisions/hono-vercel-over-nestjs.md`](../tooling-decisions/hono-vercel-over-nestjs.md) — stack decision that chose Hono on Vercel (complementary; does not cover build-script constraints)
