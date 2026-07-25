import { Hono } from 'hono'
import { notImplemented } from '../lib/errors.js'

/**
 * Situation Coverage — real-world scenarios that anchor content.
 * Schema: situations, intents (see docs/database-architecture.md)
 */
export const situations = new Hono()

situations.get('/', (c) => {
  return c.json({ items: [], nextCursor: null })
})

situations.get('/:id', (c) => {
  const { id } = c.req.param()
  notImplemented(`GET /api/situations/${id}`)
})

situations.get('/:id/intents', (c) => {
  const { id } = c.req.param()
  notImplemented(`GET /api/situations/${id}/intents`)
})
