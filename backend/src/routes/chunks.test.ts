import { describe, expect, it, vi } from 'vitest'
import { createChunksRouter } from './chunks.js'

describe('GET /api/chunks', () => {
  it('returns listed items from repository', async () => {
    const list = vi.fn(async () => ({
      items: [{ id: 'c1', text: 'Hi', meaning: 'Chào', level: 'a1', register: 'neutral', type: 'phrase', ownerId: null, editable: false }],
      nextCursor: null,
    }))
    const app = createChunksRouter({
      getDatabase: () => ({} as never),
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
      createRepository: () => ({ list, getById: vi.fn(), getPatternsForChunk: vi.fn(), create: vi.fn(), update: vi.fn() }),
    })

    const response = await app.request('/')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      items: [{ id: 'c1', text: 'Hi', meaning: 'Chào', level: 'a1', register: 'neutral', type: 'phrase', ownerId: null, editable: false }],
      nextCursor: null,
    })
  })
})

describe('GET /api/chunks/:id', () => {
  it('returns 404 when missing', async () => {
    const app = createChunksRouter({
      getDatabase: () => ({} as never),
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
      createRepository: () => ({
        list: vi.fn(),
        getById: vi.fn(async () => null),
        getPatternsForChunk: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      }),
    })
    const response = await app.request('/missing')
    expect(response.status).toBe(404)
  })
})

describe('POST /api/chunks', () => {
  it('requires X-User-Id', async () => {
    const app = createChunksRouter({
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
    })
    const response = await app.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello',
        meaning: 'Chào',
        register: 'neutral',
        level: 'beginner',
        template: 'Hello {name}',
        patternMeaning: 'Chào',
        slots: [
          {
            name: 'name',
            position: 0,
            expectedPos: 'noun',
            variants: [{ text: 'world', meaning: 'thế giới' }],
          },
        ],
      }),
    })
    expect(response.status).toBe(401)
  })
})
