import { describe, expect, it } from 'vitest'
import { isNeonHostedDatabaseUrl } from './client.js'
import { createDialoguePackWriter } from './dialogue-pack-writer.js'
import { buildSamplePack, buildSampleTraces } from '../dialogue-packs/fixtures.js'

describe('dialogue pack writer (neon-http)', () => {
  const neonUrl = process.env.NEON_TEST_DATABASE_URL

  it.skipIf(!neonUrl || !isNeonHostedDatabaseUrl(neonUrl ?? ''))(
    'persists through the neon batch path',
    async () => {
      const { createDatabase } = await import('./client.js')
      const { runMigrations } = await import('./migrate.js')

      process.env.DATABASE_URL = neonUrl
      process.env.MIGRATION_DATABASE_URL = neonUrl
      await runMigrations()

      const database = createDatabase(neonUrl!)
      const writer = createDialoguePackWriter(database, neonUrl!)
      const ids = await writer.persist(buildSamplePack(), buildSampleTraces())

      expect(ids.chunkIds.length).toBe(3)
    },
    120000,
  )
})
