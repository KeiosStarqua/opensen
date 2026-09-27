import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import type { Database } from '../db/client.js'
import { getDatabase } from '../db/client.js'
import {
  createSituationsRepository,
  type SituationsRepository,
} from '../db/situations-repository.js'
import { loadDatabaseEnv } from '../lib/env.js'

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
})

export type SituationsRouteDeps = {
  getDatabase?: () => Database
  createRepository?: (database: Database) => SituationsRepository
  loadDatabaseEnv?: typeof loadDatabaseEnv
}

export function createSituationsRouter(deps: SituationsRouteDeps = {}): Hono {
  const resolveGetDatabase = deps.getDatabase ?? getDatabase
  const resolveCreateRepository =
    deps.createRepository ?? createSituationsRepository
  const resolveLoadDatabaseEnv = deps.loadDatabaseEnv ?? loadDatabaseEnv

  const router = new Hono()

  router.get('/', async (c) => {
    const parsed = listQuerySchema.safeParse({
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

    resolveLoadDatabaseEnv()
    const database = resolveGetDatabase()
    const repository = resolveCreateRepository(database)
    const result = await repository.list(parsed.data.limit, parsed.data.cursor)
    return c.json(result)
  })

  router.get('/:id/intents', async (c) => {
    const { id } = c.req.param()
    resolveLoadDatabaseEnv()
    const database = resolveGetDatabase()
    const repository = resolveCreateRepository(database)
    const exists = await repository.getById(id)
    if (!exists) {
      throw new HTTPException(404, { message: 'Situation not found' })
    }
    const items = await repository.listIntents(id)
    return c.json({ items })
  })

  router.get('/:id', async (c) => {
    const { id } = c.req.param()
    resolveLoadDatabaseEnv()
    const database = resolveGetDatabase()
    const repository = resolveCreateRepository(database)
    const detail = await repository.getById(id)
    if (!detail) {
      throw new HTTPException(404, { message: 'Situation not found' })
    }
    return c.json(detail)
  })

  return router
}

export const situations = createSituationsRouter()
