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
- List/detail stubs may return empty collections or `501` until persistence lands; `POST /api/dialogues/generate` is live via the AI layer
- AI calls go through `src/ai/` only — never hardcode a vendor HTTP client in a route

## Work Guidance

- Map new endpoints to tables/layers in `docs/database-architecture.md`
- Env vars: document in `.env.example`; never commit secrets
- CORS origins via `CORS_ORIGINS` (comma-separated)
- AI: `AI_PROVIDER` + `AI_MODEL`; OpenRouter needs `OPENROUTER_API_KEY`

## Verification

- `npm run typecheck` from `backend/`

## Child DOX Index

| Path | Scope |
|------|-------|
| [`src/ai/AGENTS.md`](src/ai/AGENTS.md) | AI providers + dialogue generate pipeline |
