import { sql } from 'drizzle-orm'
import postgres from 'postgres'
import { describe, expect, it } from 'vitest'
import { createDatabase, resetDatabaseForTests } from './client.js'
import { loadTestDatabaseEnv } from '../lib/env.js'
import { runMigrations } from './migrate.js'

describe('database client smoke', () => {
  it('executes a query against the migrated test database', async () => {
    const { TEST_DATABASE_URL } = loadTestDatabaseEnv()
    process.env.DATABASE_URL = TEST_DATABASE_URL
    process.env.MIGRATION_DATABASE_URL = TEST_DATABASE_URL

    await runMigrations()

    resetDatabaseForTests()

    const db = createDatabase(TEST_DATABASE_URL)
    const result = await db.execute(sql`select 1 as ok`)
    const rows =
      'rows' in result
        ? result.rows
        : (result as unknown as Array<{ ok: number }>)

    expect(rows[0]?.ok).toBe(1)

    const pg = postgres(TEST_DATABASE_URL, { max: 1 })
    const version = await pg<{ version: string }[]>`select version()`
    await pg.end({ timeout: 5 })

    expect(version[0]?.version).toContain('PostgreSQL')
  })
})
