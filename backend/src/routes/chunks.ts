import { Hono } from 'hono'
import { notImplemented } from '../lib/errors.js'

/**
 * Chunk Library — memorization units and swap patterns.
 * Schema: chunks, sentence_patterns, pattern_chunks, words
 */
export const chunks = new Hono()

chunks.get('/', (c) => {
  return c.json({ items: [], nextCursor: null })
})

chunks.get('/:id', (c) => {
  const { id } = c.req.param()
  notImplemented(`GET /api/chunks/${id}`)
})

chunks.get('/:id/patterns', (c) => {
  const { id } = c.req.param()
  notImplemented(`GET /api/chunks/${id}/patterns`)
})
