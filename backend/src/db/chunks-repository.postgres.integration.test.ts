import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createChunksRepository } from './chunks-repository.js'
import { createDatabase } from './client.js'
import { runMigrations } from './migrate.js'
import { loadTestDatabaseEnv } from '../lib/env.js'

describe('chunks repository', () => {
  let sql: ReturnType<typeof postgres>
  let databaseUrl: string

  beforeAll(async () => {
    const { TEST_DATABASE_URL } = loadTestDatabaseEnv()
    databaseUrl = TEST_DATABASE_URL
    process.env.DATABASE_URL = TEST_DATABASE_URL
    process.env.MIGRATION_DATABASE_URL = TEST_DATABASE_URL

    await runMigrations()
    sql = postgres(TEST_DATABASE_URL, { max: 1 })
  }, 120000)

  afterAll(async () => {
    await sql.end({ timeout: 5 })
  })

  it('creates a chunk for a learner who has no users row yet', async () => {
    const userId = crypto.randomUUID()
    const repository = createChunksRepository(createDatabase(databaseUrl))

    const created = await repository.create(userId, {
      text: 'Could I get a latte?',
      meaning: 'Cho tôi một ly latte',
      register: 'neutral',
      level: 'beginner',
      template: 'Could I get a {drink}?',
      patternMeaning: 'Gọi đồ uống',
      slots: [
        {
          name: 'drink',
          position: 0,
          expectedPos: 'noun',
          variants: [{ text: 'latte', meaning: 'latte' }],
        },
      ],
    })

    expect(created.ownerId).toBe(userId)
    expect(created.editable).toBe(true)
    const [learner] = await sql`select id from users where id = ${userId}`
    expect(learner?.id).toBe(userId)
  })
})
