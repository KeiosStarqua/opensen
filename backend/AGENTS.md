# backend/

## Purpose

Hono **HTTP API** for OpenSen, deployed on **Vercel** Functions. Serves the Flutter client for content graph, practice (SRS), dialog generation, and Anki export as those features are implemented.

## Ownership

- TypeScript source under `src/`
- Vercel deploy config and local `vercel` CLI workflows for this package
- Product behavior and schema contracts live in [`docs/`](../docs/); this tree owns API implementation
- Database choice (Postgres + pgvector) is defined in [`docs/database-architecture.md`](../docs/database-architecture.md)
- Drizzle schema, migrations (`drizzle/`), and database tooling under `src/db/`

## Local Contracts

- Framework: [Hono on Vercel](https://hono.dev/docs/getting-started/vercel) — default-export the app from `src/index.ts`
- Run from this directory: `npm install`, `npm run dev` (`npx vercel dev`), `npm run typecheck`, `npm run test`, `npm run deploy`
- Package name: `opensen-backend` (see `package.json`)
- Keep `typescript` pinned to the 6.x line until Vercel's Node builder supports TypeScript 7's native compiler API.
- Route prefixes match product surfaces: `/api/situations`, `/api/chunks`, `/api/dialogues`, `/api/practice`, `/api/export`
- Prefer Web Standards APIs (Request/Response); avoid Node-only APIs that break Vercel Functions unless required
- List/detail stubs may return empty collections or `501` until persistence lands; `POST /api/dialogues/generate` is live via the AI layer and can persist when `DIALOGUE_PERSISTENCE_MODE` is `internal` or `ephemeral`
- Practice review routes (`GET /api/practice/due`, `POST /api/practice/reviews`, `GET /api/practice/plan`) require `DATABASE_URL` and an `X-User-Id` header until authenticated ownership ships
- AI calls go through `src/ai/` only — never hardcode a vendor HTTP client in a route
- Runtime database access: lazy `getDatabase()` in `src/db/client.ts` — Neon hosts use `drizzle-orm/neon-http`; local `postgresql://` URLs use postgres.js. Routes that do not persist data must not require `DATABASE_URL` at startup.
- Migrations: checked-in SQL under `drizzle/`; apply with `npm run db:migrate` using `MIGRATION_DATABASE_URL` or `DATABASE_URL`

## Work Guidance

- Map new endpoints to tables/layers in `docs/database-architecture.md`
- Env vars: document in `.env.example`; never commit secrets
- CORS origins via `CORS_ORIGINS` (comma-separated)
- `DIALOGUE_PERSISTENCE_MODE` — `disabled` (default), `internal`, or `ephemeral`; persistence runs only in the latter two until authenticated ownership ships
- AI: `AI_PROVIDER` + `AI_MODEL`; OpenRouter needs `OPENROUTER_API_KEY`
- Database env: `DATABASE_URL` (runtime), optional `MIGRATION_DATABASE_URL` (DDL), `TEST_DATABASE_URL` (integration tests only — must target `opensen_test` or `*_test`)

## Verification

- `npm run typecheck` from `backend/`
- `npm run test` — unit tests (no database)
- `npm run test:db` — requires `TEST_DATABASE_URL` and a pgvector-enabled disposable database (see `docker-compose.test.yml`)

## Child DOX Index

| Path | Scope |
|------|-------|
| [`src/ai/AGENTS.md`](src/ai/AGENTS.md) | AI providers + dialogue generate pipeline |
