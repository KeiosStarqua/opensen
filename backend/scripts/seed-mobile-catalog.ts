#!/usr/bin/env tsx
/**
 * Idempotent import of mobile/assets/seed/content.json into Postgres.
 * Requires DATABASE_URL and applied drizzle migrations (owner runs manually).
 *
 * The import runs in a transaction, which the `neon-http` runtime driver does
 * not support, so this script always connects over TCP with postgres.js
 * (prefers MIGRATION_DATABASE_URL, the direct non-pooled connection).
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import type { Database } from '../src/db/client.js'
import { schema } from '../src/db/schema/index.js'
import { loadDatabaseEnv } from '../src/lib/env.js'
import {
  countPublicSituations,
  importMobileCatalog,
} from '../src/seed/import-mobile-catalog.js'

async function main() {
  const { DATABASE_URL } = loadDatabaseEnv()
  const client = postgres(process.env.MIGRATION_DATABASE_URL ?? DATABASE_URL, {
    max: 1,
  })
  const database: Database = drizzle(client, { schema })

  try {
    const before = await countPublicSituations(database)
    const result = await importMobileCatalog(database)
    const after = await countPublicSituations(database)
    console.log(JSON.stringify({ before, after, imported: result }, null, 2))
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
