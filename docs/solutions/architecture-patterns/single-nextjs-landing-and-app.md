---
title: One Next.js app for landing and web app (not two projects)
date: 2026-07-28
category: architecture-patterns
module: web
problem_type: architecture_pattern
component: tooling
severity: medium
applies_when:
  - "Adding a marketing landing page and a logged-in web product in the same monorepo"
  - "Deciding whether to split Next.js into separate deployables early"
  - "Scaffolding opensen-web under web/"
tags:
  - nextjs
  - landing
  - web-app
  - route-groups
  - monorepo
resolution_type: tooling_addition
---

# One Next.js app for landing and web app (not two projects)

## Context

OpenSen already had `mobile/` (Flutter) and `backend/` (Hono on Vercel) and needed a web surface: a public landing page plus an authenticated web application. The open question was whether to create **two** Next.js projects (one marketing host, one app host) or **one** App Router project that owns both.

## Guidance

Use a **single** Next.js App Router package at `web/` (`opensen-web`). Split marketing vs product UI with App Router **route groups** under `web/app/` when surfaces diverge — not with a second `create-next-app` tree.

Keep the monorepo layout:

| Path | Role |
|------|------|
| `web/` | Landing + web app (this package) |
| `backend/` | Hono API |
| `mobile/` | Flutter client |

Call the API in `backend/`; do not reimplement server business logic in Next route handlers unless there is a clear BFF need later.

Scaffold with the official CLI defaults (TypeScript, Tailwind, ESLint, App Router), then treat `web/AGENTS.md` as the local contract (including the Next.js agent note to read bundled guides under `web/node_modules/next/dist/docs/` before writing framework code).

Split into two Next.js projects only when there is a measured reason: separate teams/release cadence, a different marketing stack, or proven bundle/perf pain from co-locating marketing and app.

## Why This Matters

- Early-stage OpenSen does not pay for two deploys, two env/auth/design sync surfaces, and two dependency graphs.
- Brand, shared UI, and auth cookies stay coherent on one origin (subdomains can still rewrite later if needed).
- Premature split hardens the wrong boundary; route groups leave an escape hatch without freezing two repos.

## When to Apply

- Greenfield or early web work where landing and app are both owned by this monorepo
- Re-evaluating a “marketing site vs app” split before product and marketing have diverged operationally
- Adding `web/` beside existing `mobile/` and `backend/` packages

## Examples

**Do:** one package at `web/` with App Router files under `web/app/`. Marketing and trial entry now use route groups: `(marketing)/page.tsx` for `/` and `(app)/onboarding/page.tsx` for `/onboarding` — see [`nextjs-marketing-landing-route-groups.md`](./nextjs-marketing-landing-route-groups.md) for the concrete KEI-146 layout. Package name in `web/package.json` is `opensen-web`.

Local workflow (from `web/AGENTS.md`): `npm run dev`; verify with `npm run lint` and `npm run build`.

**Don’t:** run `create-next-app` twice as sibling monorepo packages solely because both a homepage and a logged-in UI exist.

## Related

- [`web/AGENTS.md`](../../../web/AGENTS.md) — Next.js local contracts
- [`docs/solutions/tooling-decisions/hono-vercel-over-nestjs.md`](../tooling-decisions/hono-vercel-over-nestjs.md) — API host choice (Hono on Vercel)
- [Next.js — Installation](https://nextjs.org/docs/app/getting-started/installation)
