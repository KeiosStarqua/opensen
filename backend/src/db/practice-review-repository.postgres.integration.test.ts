import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createDatabase } from './client.js'
import { createPracticeReviewRepository } from './practice-review-repository.js'
import { loadTestDatabaseEnv } from '../lib/env.js'
import { runMigrations } from './migrate.js'

describe('practice review repository', () => {
  let sql: ReturnType<typeof postgres>
  let databaseUrl: string
  let userId: string
  let chunkId: string

  beforeAll(async () => {
    const { TEST_DATABASE_URL } = loadTestDatabaseEnv()
    databaseUrl = TEST_DATABASE_URL
    process.env.DATABASE_URL = TEST_DATABASE_URL
    process.env.MIGRATION_DATABASE_URL = TEST_DATABASE_URL

    await runMigrations()
    sql = postgres(TEST_DATABASE_URL, { max: 1 })

    userId = crypto.randomUUID()
    chunkId = crypto.randomUUID()

    await sql`
      insert into users (id, email, name, native_language, target_language, level)
      values (${userId}, ${`practice-${userId}@example.com`}, 'Practice', 'vi', 'en', 'B1')
    `

    await sql`
      insert into chunks (id, text, type, meaning, level, register)
      values (${chunkId}, 'Could I get a latte?', 'sentence', 'ordering coffee', 'A1', 'neutral')
    `
  }, 120000)

  afterAll(async () => {
    await sql.end({ timeout: 5 })
  })

  it('records a review, updates user_chunks, and appends review_history', async () => {
    const database = createDatabase(databaseUrl)
    const repository = createPracticeReviewRepository(database, databaseUrl)

    const result = await repository.recordReview(userId, chunkId, 'good')

    expect(result.chunkId).toBe(chunkId)
    expect(result.reps).toBeGreaterThan(0)
    expect(new Date(result.nextReview).getTime()).toBeGreaterThan(0)

    const userChunkRows = await sql<{
      status: string
      reps: number
      stability: number
    }[]>`
      select status, reps, stability
      from user_chunks
      where user_id = ${userId} and chunk_id = ${chunkId}
    `

    expect(userChunkRows).toHaveLength(1)
    expect(userChunkRows[0]?.reps).toBe(result.reps)

    const historyRows = await sql<{ rating: number; state_before: string }[]>`
      select rating, state_before
      from review_history
      where user_id = ${userId} and chunk_id = ${chunkId}
    `

    expect(historyRows).toHaveLength(1)
    expect(historyRows[0]?.rating).toBe(3)
    expect(historyRows[0]?.state_before).toBe('new')
  })

  it('lists due chunks and returns plan stats', async () => {
    const database = createDatabase(databaseUrl)
    const repository = createPracticeReviewRepository(database, databaseUrl)

    const dueChunkId = crypto.randomUUID()
    await sql`
      insert into chunks (id, text, type, meaning, level, register)
      values (${dueChunkId}, 'Small coffee, please.', 'sentence', 'ordering coffee', 'A1', 'neutral')
    `
    await sql`
      insert into user_chunks (user_id, chunk_id, status, next_review, updated_at)
      values (${userId}, ${dueChunkId}, 'review', now() - interval '1 day', now())
    `

    const due = await repository.listDue(userId, 10)
    expect(due.items.some((item) => item.chunkId === dueChunkId)).toBe(true)

    const stats = await repository.getPlanStats(userId)
    expect(stats.total).toBeGreaterThanOrEqual(2)
    expect(stats.dueNow).toBeGreaterThanOrEqual(1)
    expect(stats.reviewedToday).toBeGreaterThanOrEqual(1)
  })
})
