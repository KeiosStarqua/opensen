import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadTestDatabaseEnv } from '../lib/env.js'
import { createDatabase, resetDatabaseForTests } from './client.js'
import { createDialoguePackWriter } from './dialogue-pack-writer.js'
import { runMigrations } from './migrate.js'
import {
  buildSamplePack,
  buildSampleTraces,
} from '../dialogue-packs/fixtures.js'

describe('dialogue pack writer (postgres.js)', () => {
  let sql: ReturnType<typeof postgres>
  let testDatabaseUrl: string

  beforeAll(async () => {
    const { TEST_DATABASE_URL } = loadTestDatabaseEnv()
    testDatabaseUrl = TEST_DATABASE_URL
    process.env.DATABASE_URL = TEST_DATABASE_URL
    process.env.MIGRATION_DATABASE_URL = TEST_DATABASE_URL

    await runMigrations()
    sql = postgres(TEST_DATABASE_URL, { max: 1 })
  }, 120000)

  afterAll(async () => {
    resetDatabaseForTests()
    await sql.end({ timeout: 5 })
  })

  it('writes the complete content graph and provenance rows', async () => {
    const database = createDatabase(testDatabaseUrl)
    const writer = createDialoguePackWriter(database, testDatabaseUrl)
    const pack = buildSamplePack()
    const traces = buildSampleTraces()
    const requestId = crypto.randomUUID()

    const ids = await writer.persist(pack, traces, requestId)

    const situation = await sql`
      select id, name, category from situations where id = ${ids.situationId}
    `
    expect(situation[0]?.name).toBe(pack.situation.name)

    const dialogue = await sql`
      select id, request_id, situation_id from dialogues where id = ${ids.dialogueId}
    `
    expect(dialogue[0]?.request_id).toBe(requestId)
    expect(dialogue[0]?.situation_id).toBe(ids.situationId)

    const lines = await sql<{ position: number }[]>`
      select position from dialogue_lines
      where dialogue_id = ${ids.dialogueId}
      order by position
    `
    expect(lines.map((row) => row.position)).toEqual([0, 1, 2, 3])

    const chunks = await sql<{ id: string }[]>`
      select id from chunks where id = any(${ids.chunkIds})
    `
    expect(chunks.length).toBe(ids.chunkIds.length)

    const generations = await sql<{ step: string }[]>`
      select step from ai_generations where request_id = ${requestId} order by step
    `
    expect(generations.map((row) => row.step)).toEqual([
      'chunk_extraction',
      'dialogue_generation',
      'situation_normalization',
    ])
  })

  it('rolls back all rows when a child insert fails', async () => {
    const database = createDatabase(testDatabaseUrl)
    const writer = createDialoguePackWriter(database, testDatabaseUrl)
    const pack = buildSamplePack()
    const traces = buildSampleTraces()
    const requestId = crypto.randomUUID()

    const brokenPack = {
      ...pack,
      situation: { ...pack.situation, name: `rollback-${requestId}` },
      chunks: [
        ...pack.chunks.slice(0, 2),
        {
          ...pack.chunks[2],
          pattern: {
            ...pack.chunks[2].pattern,
            register: 'invalid' as 'neutral',
          },
        },
      ],
    }

    await expect(
      writer.persist(brokenPack, traces, requestId),
    ).rejects.toThrow()

    const situationCount = await sql<{ count: string }[]>`
      select count(*)::text as count from situations where name = ${brokenPack.situation.name}
    `
    const generationCount = await sql<{ count: string }[]>`
      select count(*)::text as count from ai_generations where request_id = ${requestId}
    `

    expect(Number(situationCount[0]?.count)).toBe(0)
    expect(Number(generationCount[0]?.count)).toBe(0)
  })
})
