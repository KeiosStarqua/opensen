import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { loadEnv } from './lib/env.js'
import { errorHandler } from './lib/errors.js'
import { chunks } from './routes/chunks.js'
import { dialogues } from './routes/dialogues.js'
import { exportRoutes } from './routes/export.js'
import { health } from './routes/health.js'
import { practice } from './routes/practice.js'
import { situations } from './routes/situations.js'

const env = loadEnv()

const app = new Hono()

app.use('*', logger())
app.use(
  '/api/*',
  cors({
    origin: env.CORS_ORIGINS,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
  }),
)

app.onError(errorHandler)

app.get('/', (c) => {
  return c.json({
    name: 'OpenSen API',
    docs: '/docs (repository)',
    health: '/health',
    api: {
      situations: '/api/situations',
      chunks: '/api/chunks',
      dialogues: '/api/dialogues',
      practice: '/api/practice',
      export: '/api/export',
    },
  })
})

app.route('/', health)
app.route('/api/situations', situations)
app.route('/api/chunks', chunks)
app.route('/api/dialogues', dialogues)
app.route('/api/practice', practice)
app.route('/api/export', exportRoutes)

export default app
