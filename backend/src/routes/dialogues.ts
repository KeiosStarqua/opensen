import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { createAiProvider } from '../ai/create-provider.js'
import { generateDialoguePack } from '../ai/pipeline/generate-dialogue.js'
import { generateDialogueRequestSchema } from '../ai/pipeline/schemas.js'
import { loadEnv } from '../lib/env.js'
import { notImplemented } from '../lib/errors.js'

/**
 * Dialog Builder — AI-generated memorization-ready dialogs.
 * Schema: dialogues, dialogue_lines, line_chunks, ai_generations
 */
export const dialogues = new Hono()

dialogues.get('/', (c) => {
  return c.json({ items: [], nextCursor: null })
})

dialogues.get('/:id', (c) => {
  const { id } = c.req.param()
  notImplemented(`GET /api/dialogues/${id}`)
})

dialogues.post('/generate', async (c) => {
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

  const env = loadEnv()
  const provider = createAiProvider(env)
  const result = await generateDialoguePack(provider, parsed.data)
  return c.json(result, 201)
})
