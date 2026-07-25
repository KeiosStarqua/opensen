import { Hono } from 'hono'
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

dialogues.post('/generate', (c) => {
  notImplemented('POST /api/dialogues/generate')
})
