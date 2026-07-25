import { Hono } from 'hono'
import { notImplemented } from '../lib/errors.js'

/**
 * Anki Export — portable chunk decks outside the app.
 */
export const exportRoutes = new Hono()

exportRoutes.get('/anki', (c) => {
  notImplemented('GET /api/export/anki')
})
