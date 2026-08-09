import 'dotenv/config'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { resolveMigrationDatabaseUrl } from '../lib/env.js'

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

if (process.argv[1]?.includes('migrate.ts')) {
  runMigrations()
    .then(() => {
      console.log('Migrations applied successfully.')
    })
    .catch((error: unknown) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}
