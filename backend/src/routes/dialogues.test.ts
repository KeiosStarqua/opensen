import { describe, expect, it, vi } from 'vitest'
import { createDialoguesRouter } from './dialogues.js'
import {
  buildSamplePack,
  buildSampleTraces,
  sampleExtractedChunks,
  sampleGeneratedDialogue,
  sampleNormalizedSituation,
} from '../dialogue-packs/fixtures.js'

const baseEnv = {
  CORS_ORIGINS: ['http://localhost:3000'],
  AI_PROVIDER: 'openrouter' as const,
  AI_MODEL: 'test-model',
  OPENROUTER_APP_NAME: 'OpenSen',
  DIALOGUE_PERSISTENCE_MODE: 'disabled' as const,
}

describe('POST /generate', () => {
  it('returns generated data without persistence when mode is disabled', async () => {
    const generatePack = vi.fn(async () => ({
      situation: sampleNormalizedSituation,
      dialogue: sampleGeneratedDialogue,
      chunks: sampleExtractedChunks,
      meta: { provider: 'openrouter', model: 'test', steps: [] },
      pack: buildSamplePack(),
      traces: buildSampleTraces(),
    }))
    const writer = { persist: vi.fn() }
    const getDatabase = vi.fn()

    const app = createDialoguesRouter({
      loadEnv: () => ({ ...baseEnv, DIALOGUE_PERSISTENCE_MODE: 'disabled' }),
      createProvider: () => ({ id: 'openrouter', model: 'test', completeJson: vi.fn() }),
      generatePack,
      getDatabase,
      createWriter: () => writer,
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
    })

    const response = await app.request('/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ situation: 'Gặp sếp' }),
    })

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.situation).toEqual(sampleNormalizedSituation)
    expect(body.persistence).toBeUndefined()
    expect(writer.persist).not.toHaveBeenCalled()
    expect(getDatabase).not.toHaveBeenCalled()
  })

  it('persists and returns IDs when internal mode is enabled', async () => {
    const pack = buildSamplePack()
    const traces = buildSampleTraces()
    const generatePack = vi.fn(async () => ({
      situation: sampleNormalizedSituation,
      dialogue: sampleGeneratedDialogue,
      chunks: sampleExtractedChunks,
      meta: { provider: 'openrouter', model: 'test', steps: [] },
      pack,
      traces,
    }))
    const writer = {
      persist: vi.fn(async () => ({
        requestId: 'req-1',
        situationId: 'sit-1',
        dialogueId: 'dia-1',
        chunkIds: ['c1', 'c2', 'c3'],
      })),
    }

    const app = createDialoguesRouter({
      loadEnv: () => ({ ...baseEnv, DIALOGUE_PERSISTENCE_MODE: 'internal' }),
      createProvider: () => ({ id: 'openrouter', model: 'test', completeJson: vi.fn() }),
      generatePack,
      getDatabase: () => ({} as never),
      createWriter: () => writer,
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
    })

    const response = await app.request('/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ situation: 'Gặp sếp' }),
    })

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.persistence).toEqual({
      requestId: 'req-1',
      situationId: 'sit-1',
      dialogueId: 'dia-1',
      chunkIds: ['c1', 'c2', 'c3'],
    })
    expect(writer.persist).toHaveBeenCalledWith(pack, traces)
  })

  it('does not call provider or writer for invalid JSON', async () => {
    const generatePack = vi.fn()
    const writer = { persist: vi.fn() }
    const createProvider = vi.fn()

    const app = createDialoguesRouter({
      loadEnv: () => baseEnv,
      createProvider,
      generatePack,
      createWriter: () => writer,
    })

    const response = await app.request('/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    })

    expect(response.status).toBe(400)
    expect(createProvider).not.toHaveBeenCalled()
    expect(generatePack).not.toHaveBeenCalled()
    expect(writer.persist).not.toHaveBeenCalled()
  })

  it('does not persist when generation fails', async () => {
    const writer = { persist: vi.fn() }
    const app = createDialoguesRouter({
      loadEnv: () => ({ ...baseEnv, DIALOGUE_PERSISTENCE_MODE: 'internal' }),
      createProvider: () => ({ id: 'openrouter', model: 'test', completeJson: vi.fn() }),
      generatePack: vi.fn(async () => {
        throw new Error('provider failed')
      }),
      getDatabase: () => ({} as never),
      createWriter: () => writer,
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
    })

    const response = await app.request('/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ situation: 'Gặp sếp' }),
    })

    expect(response.status).toBe(500)
    expect(writer.persist).not.toHaveBeenCalled()
  })
})
