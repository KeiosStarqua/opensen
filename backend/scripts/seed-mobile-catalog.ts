#!/usr/bin/env tsx
/**
 * Idempotent import of mobile/assets/seed/content.json into Postgres.
 * Requires DATABASE_URL and applied drizzle migrations (owner runs manually).
 */
import 'dotenv/config'
import { getDatabase } from '../src/db/client.js'
import { loadDatabaseEnv } from '../src/lib/env.js'
import {
  countPublicSituations,
  importMobileCatalog,
} from '../src/seed/import-mobile-catalog.js'

async function main() {
  loadDatabaseEnv()
  const database = getDatabase()
  const before = await countPublicSituations(database)
  const result = await importMobileCatalog(database)
  const after = await countPublicSituations(database)
  console.log(JSON.stringify({ before, after, imported: result }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
