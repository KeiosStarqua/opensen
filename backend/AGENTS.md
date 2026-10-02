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
- Production host: `https://api.opensen.taquangkhoi.com/`
- Keep `typescript` pinned to the 6.x line until Vercel's Node builder supports TypeScript 7's native compiler API.
- Route prefixes match product surfaces: `/api/situations`, `/api/chunks`, `/api/dialogues`, `/api/practice`, `/api/export`
- Interactive API docs: `GET /docs` renders a [Scalar](https://github.com/scalar/scalar) reference from `GET /openapi.json`. The spec is a hand-authored OpenAPI 3.1 module in `src/openapi.ts` mirroring the route Zod schemas; docs stay an edge concern (wired in `src/index.ts`), so route handlers carry no doc plumbing. When a route's request/response contract changes, update `src/openapi.ts` in the same change. The `servers[0]` base URL is derived from the request host at runtime.
- Prefer Web Standards APIs (Request/Response); avoid Node-only APIs that break Vercel Functions unless required
- List/detail stubs may return empty collections or `501` until persistence lands; `POST /api/dialogues/generate` is live via the AI layer and can persist when `DIALOGUE_PERSISTENCE_MODE` is `internal` or `ephemeral`
- Auth: callers send `Authorization: Bearer <Neon Auth session JWT>`. `authenticate` in `src/auth/session.ts` runs on `/api/*` and verifies tokens through the `TokenVerifier` seam (`src/auth/token-verifier.ts`). The verifier uses `jose`: EdDSA keys from `${NEON_AUTH_BASE_URL}/.well-known/jwks.json`, `iss`/`aud` must equal the Neon Auth origin, and `sub` must be a UUID learner id. Handlers read the caller only via `requireUserId(c)` (401 when anonymous) or `optionalUserId(c)`. Never trust a client-supplied user id header.
- Token outcomes: no header means anonymous. A malformed, invalid, or expired token gets 401 on every `/api` route, including routes that also allow anonymous calls. A token sent while `NEON_AUTH_BASE_URL` is unset gets 503. A JWKS outage gets 500.
- Signed-in routes: practice (`GET /api/practice/due`, `POST /api/practice/reviews`, `GET /api/practice/plan`), `GET /api/export/anki`, `POST /api/chunks`, `PATCH /api/chunks/:id`. Chunk list/detail and `POST /api/dialogues/generate` accept anonymous calls and add per-learner state (editability, enrollment) when signed in. Rows owned by a learner reference `users.id` = JWT `sub`; call `ensureLearner` (`src/db/ensure-learner.ts`) before the first owned insert.
- Route tests that need a learner wrap the router with `signedInAs(router, userId)` from `src/auth/test-support.ts`
- AI calls go through `src/ai/` only — never hardcode a vendor HTTP client in a route
- Runtime database access: lazy `getDatabase()` in `src/db/client.ts` — Neon hosts use `drizzle-orm/neon-http`; local `postgresql://` URLs use postgres.js. Routes that do not persist data must not require `DATABASE_URL` at startup.
- Migrations: checked-in SQL under `drizzle/`; apply with `npm run db:migrate` using `MIGRATION_DATABASE_URL` or `DATABASE_URL`
- Neon project policy lives in `neon.ts` (`@neon/config`). Preview with `neon config plan`, apply with `neon config apply`. `neon link` writes connection strings to `.env.local` (gitignored); never commit them.

## Work Guidance

- Map new endpoints to tables/layers in `docs/database-architecture.md`
- Env vars: document in `.env.example`; never commit secrets
- CORS origins via `CORS_ORIGINS` (comma-separated; default `http://localhost:3000,https://opensen.taquangkhoi.com`, so the production web app works without the env var); CORS applies to `/api/*`, `/health` and `/health/*`. Browser clients (web app, Flutter web preview) only work from origins listed here. Allowed request headers are `Content-Type`, `Authorization`, `sentry-trace`, and `baggage` (Sentry traces continue from the web app into the API). Preflights are cached for 2 hours (`maxAge: 7200`).
- `DIALOGUE_PERSISTENCE_MODE` — `disabled` (default), `internal`, or `ephemeral`; persistence runs only in the latter two
- AI: `AI_PROVIDER` + `AI_MODEL`; OpenRouter needs `OPENROUTER_API_KEY`
- Auth env: `NEON_AUTH_BASE_URL`, the same Managed Better Auth URL as web's `NEON_AUTH_BASE_URL`. It is optional at startup so anonymous routes keep working without it, but it is required in every deployed environment.
- Database env: `DATABASE_URL` (runtime), optional `MIGRATION_DATABASE_URL` (DDL), `TEST_DATABASE_URL` (integration tests only — must target `opensen_test` or `*_test`)

## Verification

- `npm run typecheck` from `backend/`
- `npm run test` — unit tests (no database)
- `npm run test:db` — requires `TEST_DATABASE_URL` and a pgvector-enabled disposable database (see `docker-compose.test.yml`)

## Child DOX Index

| Path | Scope |
|------|-------|
| [`src/ai/AGENTS.md`](src/ai/AGENTS.md) | AI providers + dialogue generate pipeline |
