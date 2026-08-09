# OpenSen backend

Hono API for OpenSen, deployed on [Vercel](https://hono.dev/docs/getting-started/vercel).

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Uses [Vercel CLI](https://vercel.com/docs/cli) via `npx` (or install globally).

## Develop

```bash
npm run dev
```

Open `http://localhost:3000` — root returns the API index; `GET /health` is the liveness check (not a database readiness probe).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | `vercel dev` local server |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Unit tests (no database) |
| `npm run test:db` | Database integration tests (`TEST_DATABASE_URL` required) |
| `npm run build` | `vercel build` |
| `npm run deploy` | `vercel deploy` |
| `npm run db:preflight` | Report PostgreSQL version and pgvector readiness (no secrets printed) |
| `npm run db:generate` | Generate SQL migration from Drizzle schema |
| `npm run db:generate:custom` | Create an empty custom migration (e.g. extensions) |
| `npm run db:migrate` | Apply checked-in migrations |
| `npm run db:studio` | Drizzle Studio (requires `DATABASE_URL`) |

## PostgreSQL (Neon + local pgvector)

Phase 1 stores the content graph, practice engine, and embedding dedup metadata in PostgreSQL with the `pgvector` extension.

### Prerequisites

- PostgreSQL 16+ with `pgvector` available
- Before first migration on a new host, confirm the database owner can run `CREATE EXTENSION vector`
- Phase 1 fixes embeddings to **one model**: OpenAI `text-embedding-3-small` at **1536 dimensions**. Changing model or dimension later requires a versioned embedding migration and backfill — do not mix dimensions in `embeddings.vector`.

### Environment variables

| Variable | Role |
|----------|------|
| `DATABASE_URL` | Runtime connection string. On Vercel, use the Neon pooled HTTP/WebSocket endpoint. For local PostgreSQL, a standard `postgresql://` URL uses the postgres.js driver fallback. |
| `MIGRATION_DATABASE_URL` | Optional direct Neon connection for DDL migrations (bypasses transaction poolers). Local development can omit this and use `DATABASE_URL` for both runtime and migrations. |
| `TEST_DATABASE_URL` | Disposable integration-test database only (e.g. `opensen_test`). Never point this at production. |

Never commit credentials. Copy from `.env.example` into local `.env`.

### Roles (production)

- **Migration role** — owns DDL, creates extensions, runs `npm run db:migrate` with `MIGRATION_DATABASE_URL`
- **Application role** — least-privilege DML on Phase 1 tables; used as `DATABASE_URL` on Vercel

Local development may use a single superuser for both roles. Production must separate them.

### Personal data note

This schema stores categories that will require a retention/deletion policy before production writers ship: AI generation inputs/outputs, learner-created content, practice transcripts, and review history. This issue adds schema only — no production write path.

### Local pgvector with Docker Compose

```bash
docker compose -f docker-compose.test.yml up -d
export DATABASE_URL=postgresql://opensen:opensen@localhost:5433/opensen_test
export MIGRATION_DATABASE_URL="$DATABASE_URL"
export TEST_DATABASE_URL="$DATABASE_URL"
npm run db:preflight
npm run db:migrate
npm run test:db
```

### Migration workflow

```bash
# 1. Custom extension migration (already checked in as drizzle/0000_vector_extension.sql)
npm run db:generate:custom -- --name=your_custom_step

# 2. After schema edits
npm run db:generate

# 3. Apply to the target database
npm run db:migrate
```

If a migration fails mid-apply, inspect the `drizzle.__drizzle_migrations` journal on the target database, fix the root cause, restore from a clean disposable database or branch, and re-run — do not assume partial DDL is safe to continue.

## AI (OpenRouter first)

Multi-provider surface under `src/ai/`. Set in `.env`:

```bash
AI_PROVIDER=openrouter
AI_MODEL=openai/gpt-4o-mini
OPENROUTER_API_KEY=sk-or-...
```

Generate a pack (Chinese crash defaults: `vi` → `zh`):

```bash
curl -s http://localhost:3000/api/dialogues/generate \
  -H 'content-type: application/json' \
  -d '{"situation":"Gặp sếp lần đầu ở Thâm Quyến","nativeLanguage":"vi","targetLanguage":"zh","level":"beginner"}'
```

## Routes

| Prefix | Feature |
|--------|---------|
| `/health` | Liveness |
| `/api/situations` | Situation Coverage (stub) |
| `/api/chunks` | Chunk Library (stub) |
| `/api/dialogues` | Dialog Builder — `POST /generate` live |
| `/api/practice` | Practice Plan (SRS, stub) |
| `/api/export` | Anki export (stub) |

Schema contract: [`docs/database-architecture.md`](../docs/database-architecture.md).
