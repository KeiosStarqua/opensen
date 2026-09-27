import { describe, expect, it, vi } from 'vitest'
import { createSituationsRouter } from './situations.js'
import type { SituationsRepository } from '../db/situations-repository.js'

const situationId = '11111111-1111-4111-8111-111111111111'

function buildRepository(
  overrides: Partial<SituationsRepository> = {},
): SituationsRepository {
  return {
    list: vi.fn(async () => ({
      items: [
        {
          id: situationId,
          name: 'Small talk',
          description: 'desc',
          category: 'work',
          roleSelf: 'You',
          roleOther: 'Colleague',
          goal: 'Chat',
          tone: 'casual',
        },
      ],
      nextCursor: null,
    })),
    getById: vi.fn(async () => null),
    listIntents: vi.fn(async () => []),
    ...overrides,
  }
}

describe('situations routes', () => {
  it('lists situations', async () => {
    const repository = buildRepository()
    const app = createSituationsRouter({
      getDatabase: () => ({} as never),
      createRepository: () => repository,
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
    })

    const response = await app.request('/')
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.items).toHaveLength(1)
    expect(repository.list).toHaveBeenCalled()
  })

  it('returns 404 for unknown situation', async () => {
    const app = createSituationsRouter({
      getDatabase: () => ({} as never),
      createRepository: () => buildRepository(),
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
    })

    const response = await app.request(`/${situationId}`)
    expect(response.status).toBe(404)
  })

  it('returns detail when found', async () => {
    const app = createSituationsRouter({
      getDatabase: () => ({} as never),
      createRepository: () =>
        buildRepository({
          getById: vi.fn(async () => ({
            id: situationId,
            name: 'Small talk',
            description: 'desc',
            category: 'work',
            roleSelf: 'You',
            roleOther: 'Colleague',
            goal: 'Chat',
            tone: 'casual',
            intents: [],
            dialogues: [],
            chunks: [],
          })),
        }),
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
    })

    const response = await app.request(`/${situationId}`)
    expect(response.status).toBe(200)
  })
})
