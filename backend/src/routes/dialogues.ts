import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AiProvider } from '../ai/types.js'
import { createAiProvider } from '../ai/create-provider.js'
import type { GenerateDialogueResult } from '../ai/pipeline/generate-dialogue.js'
import { generateDialoguePack } from '../ai/pipeline/generate-dialogue.js'
import { generateDialogueRequestSchema } from '../ai/pipeline/schemas.js'
import type { Database } from '../db/client.js'
import { createDatabase, getDatabase } from '../db/client.js'
import type { DialoguePackWriter } from '../db/dialogue-pack-writer.js'
import { createDialoguePackWriter } from '../db/dialogue-pack-writer.js'
import type { PersistenceProjection } from '../dialogue-packs/generated-pack.js'
import {
  type Env,
  isDialoguePersistenceAllowed,
  loadDatabaseEnv,
  loadEnv,
} from '../lib/env.js'
import { createDialoguesRepository } from '../db/dialogues-repository.js'
import { resolveUserId } from '../lib/user-context.js'

export type DialoguesRouteDeps = {
  loadEnv?: typeof loadEnv
  createProvider?: (env: Env) => AiProvider
  generatePack?: (
    provider: AiProvider,
    input: Parameters<typeof generateDialoguePack>[1],
  ) => Promise<GenerateDialogueResult>
  getDatabase?: () => Database
  createWriter?: (database: Database, databaseUrl: string) => DialoguePackWriter
  loadDatabaseEnv?: typeof loadDatabaseEnv
}

/**
 * Dialog Builder — AI-generated memorization-ready dialogs.
 * Schema: dialogues, dialogue_lines, line_chunks, ai_generations
 */
export function createDialoguesRouter(deps: DialoguesRouteDeps = {}): Hono {
  const resolveEnv = deps.loadEnv ?? loadEnv
  const resolveProvider = deps.createProvider ?? createAiProvider
  const resolveGeneratePack = deps.generatePack ?? generateDialoguePack
  const resolveGetDatabase = deps.getDatabase ?? getDatabase
  const resolveCreateWriter = deps.createWriter ?? createDialoguePackWriter
  const resolveLoadDatabaseEnv = deps.loadDatabaseEnv ?? loadDatabaseEnv

  const router = new Hono()

  router.get('/', async (c) => {
    if (!isDialoguePersistenceAllowed(resolveEnv())) {
      return c.json({ items: [], nextCursor: null })
    }
    const { DATABASE_URL } = resolveLoadDatabaseEnv()
    const database = resolveGetDatabase()
    const repository = createDialoguesRepository(database)
    void DATABASE_URL
    return c.json(await repository.list())
  })

  router.get('/:id', async (c) => {
    const { id } = c.req.param()
    if (!isDialoguePersistenceAllowed(resolveEnv())) {
      throw new HTTPException(501, {
        message: 'Dialogue persistence is disabled',
      })
    }
    resolveLoadDatabaseEnv()
    const database = resolveGetDatabase()
    const repository = createDialoguesRepository(database)
    const detail = await repository.getById(id)
    if (!detail) {
      throw new HTTPException(404, { message: 'Dialogue not found' })
    }
    return c.json(detail)
  })

  router.post('/generate', async (c) => {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      throw new HTTPException(400, { message: 'Invalid JSON body' })
    }

    const parsed = generateDialogueRequestSchema.safeParse(body)
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: parsed.error.issues
          .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
          .join('; '),
      })
    }

    const env = resolveEnv()
    const provider = resolveProvider(env)
    const result = await resolveGeneratePack(provider, parsed.data)

    let persistence: PersistenceProjection | undefined
    if (isDialoguePersistenceAllowed(env)) {
      const { DATABASE_URL } = resolveLoadDatabaseEnv()
      const database = resolveGetDatabase()
      const writer = resolveCreateWriter(database, DATABASE_URL)
      persistence = await writer.persist(result.pack, result.traces)
      try {
        const userId = resolveUserId(c)
        const { enrollChunksForLearner } = await import(
          '../db/enroll-chunks.js'
        )
        await enrollChunksForLearner(database, userId, persistence.chunkIds)
      } catch (error) {
        if (!(error instanceof HTTPException)) {
          throw error
        }
      }
    }

    return c.json(
      {
        situation: result.situation,
        dialogue: result.dialogue,
        chunks: result.chunks,
        meta: result.meta,
        ...(persistence ? { persistence } : {}),
      },
      201,
    )
  })

  return router
}

export const dialogues = createDialoguesRouter()
