import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { requireUserId } from '../auth/session.js'
import type { Database } from '../db/client.js'
import { getDatabase } from '../db/client.js'
import {
  createSavedSentencesRepository,
  type SavedSentencesRepository,
} from '../db/saved-sentences-repository.js'
import { loadDatabaseEnv } from '../lib/env.js'

/** One spoken or read sentence, not a paragraph. */
export const SAVED_SENTENCE_MAX_LENGTH = 500

const createBodySchema = z.object({
  text: z.string().trim().min(1).max(SAVED_SENTENCE_MAX_LENGTH),
})

export type SavedSentencesRouteDeps = {
  getDatabase?: () => Database
  createRepository?: (database: Database) => SavedSentencesRepository
  loadDatabaseEnv?: typeof loadDatabaseEnv
}

export function createSavedSentencesRouter(
  deps: SavedSentencesRouteDeps = {},
): Hono {
  const resolveGetDatabase = deps.getDatabase ?? getDatabase
  const resolveCreateRepository =
    deps.createRepository ?? createSavedSentencesRepository
  const resolveLoadDatabaseEnv = deps.loadDatabaseEnv ?? loadDatabaseEnv

  const router = new Hono()

  function repository() {
    resolveLoadDatabaseEnv()
    return resolveCreateRepository(resolveGetDatabase())
  }

  router.get('/', async (c) => {
    const ownerId = requireUserId(c)
    const items = await repository().list(ownerId)
    return c.json({ items })
  })

  router.get('/:id', async (c) => {
    const ownerId = requireUserId(c)
    const sentence = await repository().getById(ownerId, c.req.param('id'))
    if (!sentence) {
      throw new HTTPException(404, { message: 'Saved sentence not found' })
    }
    return c.json(sentence)
  })

  router.post('/', async (c) => {
    const ownerId = requireUserId(c)
    const text = await readSentenceText(() => c.req.json())
    const sentence = await repository().create(ownerId, text)
    return c.json(sentence, 201)
  })

  router.delete('/:id', async (c) => {
    const ownerId = requireUserId(c)
    const removed = await repository().delete(ownerId, c.req.param('id'))
    if (!removed) {
      throw new HTTPException(404, { message: 'Saved sentence not found' })
    }
    return c.body(null, 204)
  })

  router.patch('/:id', async (c) => {
    const ownerId = requireUserId(c)
    const text = await readSentenceText(() => c.req.json())
    const sentence = await repository().update(ownerId, c.req.param('id'), text)
    if (!sentence) {
      throw new HTTPException(404, { message: 'Saved sentence not found' })
    }
    return c.json(sentence)
  })

  return router
}

async function readSentenceText(readJson: () => Promise<unknown>): Promise<string> {
  let body: unknown
  try {
    body = await readJson()
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
  return parsed.data.text
}

export const savedSentences = createSavedSentencesRouter()
