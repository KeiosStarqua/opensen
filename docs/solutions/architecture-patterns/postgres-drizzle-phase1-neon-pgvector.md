---
title: Establish Phase 1 PostgreSQL Boundary with Drizzle, Neon, and pgvector
date: 2026-08-09
category: architecture-patterns
module: backend
problem_type: architecture_pattern
component: database
severity: high
applies_when:
  - Bootstrapping OpenSen backend Phase 1 Postgres schema with Drizzle ORM
  - Deploying to Neon serverless Postgres with pgvector for embeddings
  - Separating migration DDL connections from runtime HTTP database access
  - Running Vitest integration tests against a disposable pgvector-enabled test database
tags:
  - postgres
  - drizzle
  - neon
  - pgvector
  - migrations
  - backend
  - integration-tests
  - phase1-schema
---

# Establish Phase 1 PostgreSQL Boundary with Drizzle, Neon, and pgvector

## Context

OpenSen's backend (Hono on Vercel) had route stubs and an AI dialogue generator but no database layer. [KEI-141](https://linear.app/keios/issue/KEI-141/backend-thiet-lap-schema-postgresql-phase-1-va-drizzle-orm-migration) and [PR #2](https://github.com/KeiosStarqua/opensen/pull/2) established the Phase 1 PostgreSQL boundary: Drizzle ORM schema, checked-in SQL migrations, lazy runtime client, and a reproducible local/test workflow.

The schema mirrors [`docs/database-architecture.md`](../../database-architecture.md): a content knowledge graph (situations → patterns → chunks → dialogues) plus a learning engine (practice items, FSRS state on `user_chunks`, append-only attempts and reviews) and generation provenance (`ai_generations`, `embeddings`).

**Phase 1 table inventory** (14 core + 4 supporting; `words`/`chunk_words` deferred per plan):

| Layer | Tables |
|-------|--------|
| User | `users`, `user_preferences` |
| Content graph | `situations`, `intents`, `sentence_patterns`, `pattern_intents`, `pattern_slots`, `slot_variants`, `chunks` |
| Generation | `dialogues`, `dialogue_lines`, `line_chunks`, `ai_generations`, `embeddings` |
| Practice / FSRS | `practice_items`, `practice_attempts`, `user_chunks`, `review_history` |

Deferred to later phases: `audio_assets` (Phase 2 FKs commented in schema), `words`/`chunk_words`, `user_language_profile`, commerce tables.

Migrations ship as two ordered files:

1. `backend/drizzle/0000_vector_extension.sql` — `CREATE EXTENSION IF NOT EXISTS vector`
2. `backend/drizzle/0001_phase1_schema.sql` — enums, 18 tables, FKs, and composite unique indexes

Verification in PR #2: `npm test` (11 unit), `npm run test:db` (7 integration) against PostgreSQL 16 + pgvector.

## Guidance

### Extension migration ordering

Drizzle cannot emit `CREATE EXTENSION` from TypeScript schema definitions. Commit a **custom extension migration first**, then generate the schema migration from Drizzle definitions.

```1:1:backend/drizzle/0000_vector_extension.sql
CREATE EXTENSION IF NOT EXISTS vector;
```

The schema migration references `vector(1536)` on `embeddings`; without the extension migration running first, `0001_phase1_schema.sql` fails at apply time:

```126:132:backend/drizzle/0001_phase1_schema.sql
CREATE TABLE "embeddings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"entity_type" "embedding_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"vector" vector(1536) NOT NULL,
	"model" text NOT NULL
);
```

Run preflight before migrating to catch hosts that lack pgvector or CREATE privilege:

```23:28:backend/src/db/preflight.ts
    const extensionRows = await sql<{ extname: string }[]>`
      select extname from pg_extension where extname = 'vector'
    `
    const privilegeRows = await sql<{ has_privilege: boolean }[]>`
      select has_database_privilege(current_user, current_database(), 'CREATE') as has_privilege
    `
```

### Neon-http runtime client vs postgres.js for local

Runtime access is **lazy** — routes that do not call `getDatabase()` never open a connection or require `DATABASE_URL` at import time.

```32:38:backend/src/db/client.ts
export function getDatabase(): Database {
  if (!databaseInstance) {
    const { DATABASE_URL } = loadDatabaseEnv()
    databaseInstance = createDatabase(DATABASE_URL)
  }

  return databaseInstance
}
```

Host detection chooses the driver:

```14:29:backend/src/db/client.ts
function isNeonHostedDatabaseUrl(databaseUrl: string): boolean {
  try {
    return new URL(databaseUrl).hostname.endsWith('.neon.tech')
  } catch {
    return false
  }
}

export function createDatabase(databaseUrl: string): Database {
  if (isNeonHostedDatabaseUrl(databaseUrl)) {
    const client = neon(databaseUrl)
    return drizzleNeon({ client, schema })
  }

  const client = postgres(databaseUrl, { max: 10 })
  return drizzlePostgres(client, { schema })
}
```

- **Neon (`.neon.tech`)** → `@neondatabase/serverless` + `drizzle-orm/neon-http` (HTTP, no TCP pool overhead on Vercel Functions).
- **Local / non-Neon** → `postgres.js` + `drizzle-orm/postgres-js`.

Migrations always use postgres.js (direct TCP), not neon-http:

```7:16:backend/src/db/migrate.ts
export async function runMigrations(): Promise<void> {
  const databaseUrl = resolveMigrationDatabaseUrl()
  const sql = postgres(databaseUrl, { max: 1 })
  const db = drizzle(sql)

  try {
    await migrate(db, { migrationsFolder: './drizzle' })
  } finally {
    await sql.end({ timeout: 5 })
  }
}
```

### Schema module split

Group tables by bounded domain; export one `schema` object for Drizzle Kit and the runtime client:

```1:19:backend/src/db/schema/index.ts
export * from './enums.js'
export * from './users.js'
export * from './content.js'
export * from './generation.js'
export * from './practice.js'

import * as enums from './enums.js'
import * as users from './users.js'
import * as content from './content.js'
import * as generation from './generation.js'
import * as practice from './practice.js'

export const schema = {
  ...enums,
  ...users,
  ...content,
  ...generation,
  ...practice,
}
```

| Module | Responsibility |
|--------|----------------|
| `enums.ts` | PostgreSQL enums (`visibility`, `register`, `chunk_status`, `practice_mode`, etc.) |
| `users.ts` | `users`, `user_preferences` |
| `content.ts` | Situations, intents, patterns, slots, variants, chunks — ownership columns and composite unique indexes on join tables |
| `generation.ts` | Dialogues, lines, line-chunks, `ai_generations`, `embeddings` with native `vector(1536)` |
| `practice.ts` | Practice items/attempts, `user_chunks` (mutable FSRS state), `review_history` (append-only) |

Ownership pattern on ownable entities (`owner_id`, `visibility`, self-referential `source_template_id`):

```13:27:backend/src/db/schema/content.ts
export const situations = pgTable('situations', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  roleSelf: text('role_self').notNull(),
  roleOther: text('role_other').notNull(),
  goal: text('goal').notNull(),
  tone: text('tone').notNull(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  visibility: visibilityEnum('visibility').notNull().default('private'),
  sourceTemplateId: uuid('source_template_id').references(
    (): AnyPgColumn => situations.id,
    { onDelete: 'set null' },
  ),
})
```

Embeddings use Drizzle's native pgvector column at 1,536 dimensions (`text-embedding-3-small` contract):

```86:92:backend/src/db/schema/generation.ts
export const embeddings = pgTable('embeddings', {
  id: uuid('id').primaryKey(),
  entityType: embeddingEntityTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  vector: vector('vector', { dimensions: 1536 }).notNull(),
  model: text('model').notNull(),
})
```

### Environment variables

Three connection URLs, validated by Zod in `backend/src/lib/env.ts`:

| Variable | Role |
|----------|------|
| `DATABASE_URL` | Runtime queries (required when a DB consumer initializes) |
| `MIGRATION_DATABASE_URL` | Optional DDL role; direct Neon connection bypassing poolers |
| `TEST_DATABASE_URL` | Integration tests only; must target `opensen_test` or `*_test` |

```41:48:backend/src/lib/env.ts
const databaseEnvSchema = z.object({
  DATABASE_URL: postgresUrlSchema,
})

const migrationEnvSchema = z.object({
  MIGRATION_DATABASE_URL: postgresUrlSchema.optional(),
  DATABASE_URL: postgresUrlSchema,
})
```

Resolution order for migrations and Drizzle Kit:

```90:95:backend/src/lib/env.ts
export function resolveMigrationDatabaseUrl(
  source: NodeJS.ProcessEnv = process.env,
): string {
  const env = loadMigrationEnv(source)
  return env.MIGRATION_DATABASE_URL ?? env.DATABASE_URL
}
```

```4:7:backend/drizzle.config.ts
const migrationUrl =
  process.env.MIGRATION_DATABASE_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  'postgresql://opensen:opensen@localhost:5433/opensen_test'
```

`TEST_DATABASE_URL` fails closed if it does not name a designated test database:

```81:85:backend/src/lib/env.ts
  if (!isDesignatedTestDatabase(databaseName)) {
    throw new Error(
      'TEST_DATABASE_URL must point to the designated test database (opensen_test)',
    )
  }
```

## Why This Matters

Without a typed schema and executable migrations, the content graph, practice engine, and AI generation provenance cannot persist data consistently. PR #2 unblocks every subsequent persistence issue (CRUD routes, auth, embedding generation, FSRS scheduling) by:

1. **Enforcing the product data model in PostgreSQL** — slots as rows, not parsed template strings; FSRS state separate from append-only review logs; ownership columns for personal vs curated content.
2. **Matching the serverless runtime** — neon-http avoids connection-pool exhaustion on Vercel; lazy init keeps non-persistent routes working without a local database.
3. **Making migrations reproducible** — checked-in SQL, extension-before-schema ordering, and integration tests against an isolated pgvector database catch DDL defects before production.
4. **Fixing embedding dimension as a type choice** — `vector(1536)` is a persistent contract; changing models later requires an explicit versioned migration.

## When to Apply

- **Adding or altering Phase 1 tables** — edit the domain schema module under `backend/src/db/schema/`, run Drizzle Kit generate, review SQL (especially vector syntax and FK order), commit migration + meta.
- **Introducing a new PostgreSQL extension** — add a numbered custom migration *before* any generated migration that depends on it (same pattern as `0000_vector_extension.sql`).
- **Connecting a new route or repository to the database** — call `getDatabase()` at the composition edge; do not construct clients in route handlers.
- **Deploying to Neon** — set `DATABASE_URL` to the pooled/HTTP endpoint for runtime; set `MIGRATION_DATABASE_URL` to a direct connection for `npm run db:migrate`.
- **Running integration tests** — start the Docker Compose pgvector service, set `TEST_DATABASE_URL`, run `npm run test:db`.
- **Before first migrate on a new host** — run `npm run db:preflight` to verify PostgreSQL version, pgvector availability, and CREATE privilege.

Do **not** apply this pattern when adding Phase 2+ tables (`audio_assets`, `words`) until their owning issue explicitly includes them — schema comments mark deferred FKs.

## Examples

### Before / after

**Before (pre-PR #2):** No database package under the backend tree, no migrations, route stubs return empty collections or `501`. AI dialogue generation runs statelessly.

**After (PR #2):** Full Phase 1 schema in Drizzle + SQL; `getDatabase()` available for future repositories; migration runner and preflight scripts wired in `package.json`.

### Workflow commands

```bash
# From backend/

# 1. Preflight — verify pgvector and privileges (no secrets printed)
npm run db:preflight

# 2. Apply checked-in migrations (uses MIGRATION_DATABASE_URL ?? DATABASE_URL)
npm run db:migrate

# 3. Unit tests (no database required)
npm test

# 4. Integration tests (requires TEST_DATABASE_URL → opensen_test)
docker compose -f docker-compose.test.yml up -d
export TEST_DATABASE_URL=postgresql://opensen:opensen@localhost:5433/opensen_test
npm run test:db

# 5. Typecheck
npm run typecheck
```

### Generating a follow-on migration

After editing schema modules:

```bash
# Custom extension DDL (if needed) — create manually, e.g. drizzle/0002_foo.sql
npx drizzle-kit generate   # produces next numbered migration from schema diff
npm run db:migrate         # apply against test DB first
npm run test:db            # verify
```

### Runtime usage (future repositories)

```typescript
import { getDatabase } from '../db/client.js'
import { chunks } from '../db/schema/index.js'
import { eq } from 'drizzle-orm'

const db = getDatabase()
const row = await db.select().from(chunks).where(eq(chunks.id, chunkId))
```

### Env file sketch (no real credentials)

```env
DATABASE_URL=postgresql://app_role:***@ep-xxx-pooler.us-east-2.aws.neon.tech/opensen?sslmode=require
MIGRATION_DATABASE_URL=postgresql://migration_role:***@ep-xxx.us-east-2.aws.neon.tech/opensen?sslmode=require
TEST_DATABASE_URL=postgresql://opensen:opensen@localhost:5433/opensen_test
```

## Related

- [`docs/database-architecture.md`](../../database-architecture.md) — schema authority for Phase 1 tables and ownership semantics
- [`backend/AGENTS.md`](../../../backend/AGENTS.md) — runtime database contracts and verification commands
- [`docs/solutions/tooling-decisions/hono-vercel-over-nestjs.md`](../tooling-decisions/hono-vercel-over-nestjs.md) — API host that consumes this store
- [KEI-141](https://linear.app/keios/issue/KEI-141/backend-thiet-lap-schema-postgresql-phase-1-va-drizzle-orm-migration) · [PR #2](https://github.com/KeiosStarqua/opensen/pull/2)
