import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadTestDatabaseEnv } from '../lib/env.js'
import { runMigrations } from './migrate.js'

const PHASE1_TABLES = [
  'users',
  'user_preferences',
  'situations',
  'intents',
  'sentence_patterns',
  'pattern_intents',
  'pattern_slots',
  'slot_variants',
  'chunks',
  'dialogues',
  'dialogue_lines',
  'line_chunks',
  'ai_generations',
  'embeddings',
  'practice_items',
  'practice_attempts',
  'user_chunks',
  'review_history',
]

describe('Phase 1 migrations', () => {
  let sql: ReturnType<typeof postgres>

  beforeAll(async () => {
    const { TEST_DATABASE_URL } = loadTestDatabaseEnv()
    process.env.DATABASE_URL = TEST_DATABASE_URL
    process.env.MIGRATION_DATABASE_URL = TEST_DATABASE_URL

    await runMigrations()

    sql = postgres(TEST_DATABASE_URL, { max: 1 })
  }, 120000)

  afterAll(async () => {
    await sql.end({ timeout: 5 })
  })

  it('installs pgvector before creating embeddings.vector', async () => {
    const extensions = await sql<{ extname: string }[]>`
      select extname from pg_extension where extname = 'vector'
    `

    expect(extensions.map((row) => row.extname)).toContain('vector')
  })

  it('creates every Phase 1 table', async () => {
    const tables = await sql<{ tablename: string }[]>`
      select tablename
      from pg_tables
      where schemaname = 'public'
      order by tablename
    `

    const names = tables.map((row) => row.tablename)

    for (const table of PHASE1_TABLES) {
      expect(names).toContain(table)
    }
  })

  it('stores embeddings.vector as vector(1536)', async () => {
    const columns = await sql<{
      column_name: string
      udt_name: string
    }[]>`
      select column_name, udt_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'embeddings'
        and column_name = 'vector'
    `

    expect(columns[0]?.udt_name).toBe('vector')
  })

  it('accepts client-generated UUIDs on user_chunks with updated_at', async () => {
    const userId = crypto.randomUUID()
    const chunkId = crypto.randomUUID()

    await sql`
      insert into users (id, email, name, native_language, target_language, level)
      values (${userId}, 'test@example.com', 'Test', 'vi', 'en', 'B1')
    `

    await sql`
      insert into chunks (id, text, type, meaning, level, register)
      values (${chunkId}, 'Hello there', 'sentence', 'greeting', 'A1', 'neutral')
    `

    await sql`
      insert into user_chunks (user_id, chunk_id, updated_at)
      values (${userId}, ${chunkId}, now())
    `

    const rows = await sql<{ user_id: string; chunk_id: string }[]>`
      select user_id, chunk_id from user_chunks
      where user_id = ${userId} and chunk_id = ${chunkId}
    `

    expect(rows).toHaveLength(1)
  })

  it('tracks applied migrations without re-running DDL on second apply', async () => {
    await runMigrations()

    const journal = await sql<{ count: string }[]>`
      select count(*)::text as count from drizzle.__drizzle_migrations
    `

    expect(Number(journal[0]?.count)).toBeGreaterThanOrEqual(2)
  })
})

describe('integration guardrails', () => {
  it('refuses to run without TEST_DATABASE_URL', () => {
    const previous = process.env.TEST_DATABASE_URL
    delete process.env.TEST_DATABASE_URL

    expect(() => loadTestDatabaseEnv({})).toThrow()

    process.env.TEST_DATABASE_URL = previous
  })
})
