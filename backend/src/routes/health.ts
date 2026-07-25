import { Hono } from 'hono'

export const health = new Hono()

health.get('/health', (c) => {
  return c.json({
    ok: true,
    service: 'opensen-backend',
    timestamp: new Date().toISOString(),
  })
})
