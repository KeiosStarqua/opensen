import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import type { Database } from '../db/client.js'
import { getDatabase } from '../db/client.js'
import {
  createChunksRepository,
  type ChunksRepository,
} from '../db/chunks-repository.js'
import { loadDatabaseEnv } from '../lib/env.js'
import { optionalUserId, requireUserId } from '../auth/session.js'

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
  q: z.string().trim().optional(),
  register: z.string().trim().optional(),
})

const createBodySchema = z.object({
  text: z.string().trim().min(1),
  meaning: z.string().trim().min(1),
  register: z.enum(['casual', 'neutral', 'polite', 'formal']),
  level: z.string().trim().min(1),
  template: z.string().trim().min(1),
  patternMeaning: z.string().trim().min(1),
  slots: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        position: z.number().int().min(0),
        expectedPos: z.string().trim().default('noun'),
        variants: z
          .array(
            z.object({
              text: z.string().trim().min(1),
              meaning: z.string().trim().min(1),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
})

const patchBodySchema = z
  .object({
    text: z.string().trim().min(1).optional(),
    meaning: z.string().trim().min(1).optional(),
  })
  .refine((value) => value.text !== undefined || value.meaning !== undefined, {
    message: 'At least one of text or meaning is required',
  })

export type ChunksRouteDeps = {
  getDatabase?: () => Database
  createRepository?: (database: Database) => ChunksRepository
  loadDatabaseEnv?: typeof loadDatabaseEnv
}

export function createChunksRouter(deps: ChunksRouteDeps = {}): Hono {
  const resolveGetDatabase = deps.getDatabase ?? getDatabase
  const resolveCreateRepository = deps.createRepository ?? createChunksRepository
  const resolveLoadDatabaseEnv = deps.loadDatabaseEnv ?? loadDatabaseEnv

  const router = new Hono()

  router.get('/', async (c) => {
    const parsed = listQuerySchema.safeParse({
      limit: c.req.query('limit'),
      cursor: c.req.query('cursor'),
      q: c.req.query('q'),
      register: c.req.query('register'),
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
    const userId = optionalUserId(c)
    return c.json(
      await repository.list(userId, {
        limit: parsed.data.limit,
        cursor: parsed.data.cursor,
        q: parsed.data.q,
        register: parsed.data.register,
      }),
    )
  })

  router.get('/patterns/:patternId', async (c) => {
    const { patternId } = c.req.param()
    resolveLoadDatabaseEnv()
    const database = resolveGetDatabase()
    const repository = resolveCreateRepository(database)
    const pattern = await repository.getPatternById(patternId)
    if (!pattern) {
      throw new HTTPException(404, { message: 'Pattern not found' })
    }
    return c.json({ pattern })
  })

  router.get('/:id/patterns', async (c) => {
    const { id } = c.req.param()
    resolveLoadDatabaseEnv()
    const database = resolveGetDatabase()
    const repository = resolveCreateRepository(database)
    const payload = await repository.getPatternsForChunk(id)
    if (!payload) {
      throw new HTTPException(404, { message: 'Pattern not found for chunk' })
    }
    return c.json(payload)
  })

  router.get('/:id', async (c) => {
    const { id } = c.req.param()
    resolveLoadDatabaseEnv()
    const database = resolveGetDatabase()
    const repository = resolveCreateRepository(database)
    const userId = optionalUserId(c)
    const detail = await repository.getById(id, userId)
    if (!detail) {
      throw new HTTPException(404, { message: 'Chunk not found' })
    }
    return c.json(detail)
  })

  router.post('/', async (c) => {
    const userId = requireUserId(c)

    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      throw new HTTPException(400, { message: 'Invalid JSON body' })
    }
    const parsed = createBodySchema.safeParse(body)
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: parsed.error.issues
          .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
          .join('; '),
      })
    }

    resolveLoadDatabaseEnv()
    const database = resolveGetDatabase()
    const repository = resolveCreateRepository(database)
    const created = await repository.create(userId, parsed.data)
    return c.json(created, 201)
  })

  router.patch('/:id', async (c) => {
    const { id } = c.req.param()
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      throw new HTTPException(400, { message: 'Invalid JSON body' })
    }
    const parsed = patchBodySchema.safeParse(body)
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: parsed.error.issues
          .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
          .join('; '),
      })
    }

    resolveLoadDatabaseEnv()
    const database = resolveGetDatabase()
    const repository = resolveCreateRepository(database)
    const userId = requireUserId(c)
    const updated = await repository.update(userId, id, parsed.data)
    if (!updated) {
      throw new HTTPException(404, { message: 'Chunk not found or not editable' })
    }
    return c.json(updated)
  })

  return router
}

export const chunks = createChunksRouter()
