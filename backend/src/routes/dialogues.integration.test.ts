import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadTestDatabaseEnv } from '../lib/env.js'
import { createDatabase, resetDatabaseForTests } from '../db/client.js'
import { createDialoguePackWriter } from '../db/dialogue-pack-writer.js'
import { runMigrations } from '../db/migrate.js'
import { createDialoguesRouter } from './dialogues.js'
import {
  buildSamplePack,
  buildSampleTraces,
  sampleExtractedChunks,
  sampleGeneratedDialogue,
  sampleNormalizedSituation,
} from '../dialogue-packs/fixtures.js'

describe('POST /api/dialogues/generate integration', () => {
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

  it('returns persistence projection that resolves in PostgreSQL', async () => {
    const database = createDatabase(testDatabaseUrl)
    const writer = createDialoguePackWriter(database, testDatabaseUrl)
    const pack = buildSamplePack()
    const traces = buildSampleTraces()

    const app = createDialoguesRouter({
      loadEnv: () => ({
        CORS_ORIGINS: ['http://localhost:3000'],
        AI_PROVIDER: 'openrouter',
        AI_MODEL: 'test-model',
        OPENROUTER_APP_NAME: 'OpenSen',
        DIALOGUE_PERSISTENCE_MODE: 'internal',
      }),
      createProvider: () => ({
        id: 'openrouter',
        model: 'test-model',
        completeJson: async () => ({
          data: {},
          model: 'test',
          provider: 'openrouter',
          rawText: '{}',
        }),
      }),
      generatePack: async () => ({
        situation: sampleNormalizedSituation,
        dialogue: sampleGeneratedDialogue,
        chunks: sampleExtractedChunks,
        meta: { provider: 'openrouter', model: 'test', steps: [] },
        pack,
        traces,
      }),
      getDatabase: () => database,
      createWriter: () => writer,
      loadDatabaseEnv: () => ({ DATABASE_URL: testDatabaseUrl }),
    })

    const response = await app.request('/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ situation: 'Gặp sếp integration' }),
    })

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.persistence.chunkIds).toHaveLength(3)

    const persisted = await sql<{ id: string }[]>`
      select id from chunks where id = any(${body.persistence.chunkIds})
    `
    expect(persisted.length).toBe(3)
  })
})
