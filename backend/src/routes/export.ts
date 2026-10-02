import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { getDatabase } from '../db/client.js'
import { listAnkiNotes } from '../db/export-repository.js'
import { formatAnkiDeck } from '../export/anki-deck-formatter.js'
import { loadDatabaseEnv } from '../lib/env.js'
import { requireUserId } from '../auth/session.js'

export const exportRoutes = new Hono()

const querySchema = z.object({
  scope: z.enum(['enrolled', 'all']).default('enrolled'),
})

exportRoutes.get('/anki', async (c) => {
  const userId = requireUserId(c)
  const parsed = querySchema.safeParse({ scope: c.req.query('scope') })
  if (!parsed.success) {
    throw new HTTPException(400, { message: 'Invalid scope query' })
  }

  loadDatabaseEnv()
  const database = getDatabase()
  const notes = await listAnkiNotes(database, userId, parsed.data.scope)

  if (notes.length === 0) {
    return c.json({ empty: true, noteCount: 0 }, 200)
  }

  const body = formatAnkiDeck(notes)
  c.header('Content-Type', 'text/plain; charset=utf-8')
  c.header(
    'Content-Disposition',
    `attachment; filename="opensen-anki-${parsed.data.scope}.txt"`,
  )
  return c.body(body)
})
