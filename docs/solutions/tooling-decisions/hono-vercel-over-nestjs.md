---
title: Choose Hono on Vercel for the OpenSen API (not NestJS)
date: 2026-07-25
category: tooling-decisions
module: backend
problem_type: tooling_decision
component: tooling
severity: medium
applies_when:
  - "Selecting an HTTP framework for the OpenSen API"
  - "Target deploy platform is Vercel Functions"
  - "Avoiding NestJS-style long-running Node servers on serverless"
tags:
  - hono
  - vercel
  - nestjs
  - backend
  - serverless
resolution_type: tooling_addition
---

# Choose Hono on Vercel for the OpenSen API (not NestJS)

## Context

OpenSen needed a backend for the Flutter client (content graph, practice/SRS, dialog generation, Anki export). NestJS was considered for its module structure, but the preferred host was **Vercel**. NestJS is built as a long-running Node process; adapting it to Vercel Functions is awkward (cold starts, limited fit for queues/cron/WebSockets). The durable data store was already decided as PostgreSQL + pgvector in [`docs/database-architecture.md`](../../database-architecture.md) — the open choice was the API runtime.

## Guidance

Use **[Hono on Vercel](https://hono.dev/docs/getting-started/vercel)**: a thin Web Standards HTTP app that default-exports from `backend/src/index.ts` and deploys as Vercel Functions.

Keep the stack split:

| Layer | Choice |
|-------|--------|
| API | Hono (`backend/`) |
| Host | Vercel Functions |
| Store | Postgres + pgvector (see database architecture) |

Prefer Web Standards `Request`/`Response` over Node-only APIs so the same app stays portable on Vercel. Route prefixes should match product surfaces (`/api/situations`, `/api/chunks`, `/api/dialogues`, `/api/practice`, `/api/export`) as contracted in [`backend/AGENTS.md`](../../../backend/AGENTS.md).

If NestJS is strongly preferred later, host it on Fly/Railway (or similar long-running Node), not Vercel — do not force Nest onto Vercel for this product.

## Why This Matters

- Vercel-native deploy path matches the chosen host without serverless adapters or Nest bootstrap hacks.
- Small cold-start surface compared to a full Nest DI container (per this session’s comparison; not a benchmark claim).
- Domain modules can still be ordinary TypeScript route modules under `backend/src/routes/` without Nest’s ceremony for an early MVP.
- Mischoosing Nest-on-Vercel would fight the platform for every async/AI/SRS job shape.

## When to Apply

- Greenfield or early MVP API work targeting Vercel
- Flutter (or any) client calling a JSON REST API from this repo’s `backend/`
- Re-evaluating whether to introduce NestJS — only if leaving Vercel for a long-running host

## Examples

**Do (current tree):** default-export a Hono app from `backend/src/index.ts` and mount product routes:

```typescript
const app = new Hono()
app.route('/api/situations', situations)
app.route('/api/chunks', chunks)
// ...
export default app
```

**Don’t:** scaffold NestJS as the Vercel entrypoint expecting a traditional `NestFactory.create` server lifecycle on Functions.

Local workflow (from `backend/AGENTS.md`): `npm run dev` → `npx vercel dev`; verify with `npm run typecheck`.

## Related

- [`docs/database-architecture.md`](../../database-architecture.md) — Postgres + pgvector MVP store
- [`backend/AGENTS.md`](../../../backend/AGENTS.md) — Hono/Vercel local contracts
- [Hono — Getting Started on Vercel](https://hono.dev/docs/getting-started/vercel)
