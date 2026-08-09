import { describe, expect, it, vi } from 'vitest'
import { createPracticeRouter } from './practice.js'
import type { PracticeReviewRepository } from '../db/practice-review-repository.js'

const userId = '11111111-1111-4111-8111-111111111111'
const chunkId = '22222222-2222-4222-8222-222222222222'

function buildRepository(
  overrides: Partial<PracticeReviewRepository> = {},
): PracticeReviewRepository {
  return {
    listDue: vi.fn(async () => ({ items: [], nextCursor: null })),
    recordReview: vi.fn(),
    getPlanStats: vi.fn(async () => ({
      total: 0,
      byStatus: { new: 0, learning: 0, review: 0, relearning: 0 },
      dueNow: 0,
      dueNext7Days: 0,
      reviewedToday: 0,
    })),
    ...overrides,
  }
}

describe('practice routes', () => {
  it('returns due items for an authenticated learner', async () => {
    const repository = buildRepository({
      listDue: vi.fn(async () => ({
        items: [
          {
            chunkId,
            text: 'Could I get a latte?',
            meaning: 'ordering coffee',
            status: 'learning' as const,
            dueAt: '2026-08-09T10:00:00.000Z',
            stability: 1.2,
            difficulty: 5,
            reps: 1,
            lapses: 0,
          },
        ],
        nextCursor: null,
      })),
    })

    const app = createPracticeRouter({
      getDatabase: () => ({} as never),
      createRepository: () => repository,
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
    })

    const response = await app.request('/due', {
      headers: { 'x-user-id': userId },
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.items).toHaveLength(1)
    expect(repository.listDue).toHaveBeenCalledWith(userId, 20, undefined)
  })

  it('records a review and returns updated scheduling state', async () => {
    const repository = buildRepository({
      recordReview: vi.fn(async () => ({
        chunkId,
        status: 'learning' as const,
        stability: 2.1,
        difficulty: 4.8,
        reps: 1,
        lapses: 0,
        lastReview: '2026-08-09T12:00:00.000Z',
        nextReview: '2026-08-10T12:00:00.000Z',
        scheduledDays: 1,
        elapsedDays: 0,
        reviewHistoryId: '33333333-3333-4333-8333-333333333333',
      })),
    })

    const app = createPracticeRouter({
      getDatabase: () => ({} as never),
      createRepository: () => repository,
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
    })

    const response = await app.request('/reviews', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ chunkId, rating: 'good' }),
    })

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.chunkId).toBe(chunkId)
    expect(repository.recordReview).toHaveBeenCalledWith(
      userId,
      chunkId,
      'good',
      undefined,
    )
  })

  it('returns practice plan stats', async () => {
    const repository = buildRepository({
      getPlanStats: vi.fn(async () => ({
        total: 3,
        byStatus: { new: 1, learning: 1, review: 1, relearning: 0 },
        dueNow: 2,
        dueNext7Days: 3,
        reviewedToday: 1,
      })),
    })

    const app = createPracticeRouter({
      getDatabase: () => ({} as never),
      createRepository: () => repository,
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
    })

    const response = await app.request('/plan', {
      headers: { 'x-user-id': userId },
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.total).toBe(3)
    expect(body.dueNow).toBe(2)
  })

  it('rejects requests without x-user-id', async () => {
    const app = createPracticeRouter()

    const response = await app.request('/due')
    expect(response.status).toBe(401)
  })

  it('rejects invalid review payloads', async () => {
    const repository = buildRepository()
    const app = createPracticeRouter({
      createRepository: () => repository,
    })

    const response = await app.request('/reviews', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ chunkId, rating: 'perfect' }),
    })

    expect(response.status).toBe(400)
    expect(repository.recordReview).not.toHaveBeenCalled()
  })
})
