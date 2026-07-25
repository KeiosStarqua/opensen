import { Hono } from 'hono'
import { notImplemented } from '../lib/errors.js'

/**
 * Practice Plan — spaced repetition (FSRS) on chunks.
 * Schema: user_chunks, review_history
 */
export const practice = new Hono()

practice.get('/due', (c) => {
  return c.json({ items: [], nextCursor: null })
})

practice.post('/reviews', (c) => {
  notImplemented('POST /api/practice/reviews')
})

practice.get('/plan', (c) => {
  notImplemented('GET /api/practice/plan')
})
