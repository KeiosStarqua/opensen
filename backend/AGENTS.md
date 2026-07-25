# backend/

## Purpose

Hono **HTTP API** for OpenSen, deployed on **Vercel** Functions. Serves the Flutter client for content graph, practice (SRS), dialog generation, and Anki export as those features are implemented.

## Ownership

- TypeScript source under `src/`
- Vercel deploy config and local `vercel` CLI workflows for this package
- Product behavior and schema contracts live in [`docs/`](../docs/); this tree owns API implementation
- Database choice (Postgres + pgvector) is defined in [`docs/database-architecture.md`](../docs/database-architecture.md)

## Local Contracts

- Framework: [Hono on Vercel](https://hono.dev/docs/getting-started/vercel) — default-export the app from `src/index.ts`
- Run from this directory: `npm install`, `npm run dev` (`npx vercel dev`), `npm run typecheck`, `npm run deploy`
- Package name: `opensen-backend` (see `package.json`)
- Route prefixes match product surfaces: `/api/situations`, `/api/chunks`, `/api/dialogues`, `/api/practice`, `/api/export`
- Prefer Web Standards APIs (Request/Response); avoid Node-only APIs that break Vercel Functions unless required
- Keep stubs returning empty lists or `501` until persistence/AI layers land — do not fake domain data as if production-ready

## Work Guidance

- Map new endpoints to tables/layers in `docs/database-architecture.md`
- Env vars: document in `.env.example`; never commit secrets
- CORS origins via `CORS_ORIGINS` (comma-separated)

## Verification

- `npm run typecheck` from `backend/`

## Child DOX Index

No nested AGENTS.md yet. Add under `src/` when a module boundary gains its own rules (e.g. db/, ai/, auth/).
