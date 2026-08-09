import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Database } from '../db/client.js'
import { getDatabase } from '../db/client.js'
import {
  createPracticeReviewRepository,
  PracticeReviewError,
  type PracticeReviewRepository,
} from '../db/practice-review-repository.js'
import { loadDatabaseEnv } from '../lib/env.js'
import { resolveUserId } from '../lib/user-context.js'
import { dueQuerySchema, reviewRequestSchema } from '../practice/schemas.js'

export type PracticeRouteDeps = {
  getDatabase?: () => Database
  createRepository?: (
    database: Database,
    databaseUrl: string,
  ) => PracticeReviewRepository
  loadDatabaseEnv?: typeof loadDatabaseEnv
}

/**
 * Practice Plan — spaced repetition (FSRS) on chunks.
 * Schema: user_chunks, review_history
 */
export function createPracticeRouter(deps: PracticeRouteDeps = {}): Hono {
  const resolveGetDatabase = deps.getDatabase ?? getDatabase
  const resolveCreateRepository =
    deps.createRepository ?? createPracticeReviewRepository
  const resolveLoadDatabaseEnv = deps.loadDatabaseEnv ?? loadDatabaseEnv

  const router = new Hono()

  router.get('/due', async (c) => {
    const userId = resolveUserId(c)
    const parsed = dueQuerySchema.safeParse({
      limit: c.req.query('limit'),
      cursor: c.req.query('cursor'),
    })

    if (!parsed.success) {
      throw new HTTPException(400, {
        message: parsed.error.issues
          .map((issue) => `${issue.path.join('.') || 'query'}: ${issue.message}`)
          .join('; '),
      })
    }

    const { DATABASE_URL } = resolveLoadDatabaseEnv()
    const database = resolveGetDatabase()
    const repository = resolveCreateRepository(database, DATABASE_URL)
    const result = await repository.listDue(
      userId,
      parsed.data.limit,
      parsed.data.cursor,
    )

    return c.json(result)
  })

  router.post('/reviews', async (c) => {
    const userId = resolveUserId(c)

    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      throw new HTTPException(400, { message: 'Invalid JSON body' })
    }

    const parsed = reviewRequestSchema.safeParse(body)
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: parsed.error.issues
          .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
          .join('; '),
      })
    }

    const { DATABASE_URL } = resolveLoadDatabaseEnv()
    const database = resolveGetDatabase()
    const repository = resolveCreateRepository(database, DATABASE_URL)

    try {
      const result = await repository.recordReview(
        userId,
        parsed.data.chunkId,
        parsed.data.rating,
        parsed.data.practiceAttemptId,
      )
      return c.json(result, 201)
    } catch (error) {
      if (error instanceof PracticeReviewError) {
        throw new HTTPException(404, { message: error.message })
      }
      throw error
    }
  })

  router.get('/plan', async (c) => {
    const userId = resolveUserId(c)
    const { DATABASE_URL } = resolveLoadDatabaseEnv()
    const database = resolveGetDatabase()
    const repository = resolveCreateRepository(database, DATABASE_URL)
    const stats = await repository.getPlanStats(userId)

    return c.json(stats)
  })

  return router
}

export const practice = createPracticeRouter()
