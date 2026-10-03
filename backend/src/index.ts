import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { Scalar } from '@scalar/hono-api-reference'
import { authenticate } from './auth/session.js'
import { createNeonAuthVerifier } from './auth/token-verifier.js'
import { loadEnv } from './lib/env.js'
import { errorHandler } from './lib/errors.js'
import { buildOpenApiDocument } from './openapi.js'
import { chunks } from './routes/chunks.js'
import { dialogues } from './routes/dialogues.js'
import { exportRoutes } from './routes/export.js'
import { health } from './routes/health.js'
import { practice } from './routes/practice.js'
import { savedSentences } from './routes/saved-sentences.js'
import { situations } from './routes/situations.js'

const env = loadEnv()

const app = new Hono()

app.use('*', logger())
// Browser clients (web app, Flutter web preview) call both the API and the
// health probes, so CORS covers `/health*` as well as `/api/*`.
const corsMiddleware = cors({
  origin: env.CORS_ORIGINS,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'sentry-trace', 'baggage'],
  // Chromium caps preflight caching at 2 hours.
  maxAge: 7200,
})
app.use('/api/*', corsMiddleware)
app.use('/health', corsMiddleware)
app.use('/health/*', corsMiddleware)

app.use(
  '/api/*',
  authenticate(
    env.NEON_AUTH_BASE_URL
      ? createNeonAuthVerifier({ baseUrl: env.NEON_AUTH_BASE_URL })
      : null,
  ),
)

app.onError(errorHandler)

app.get('/', (c) => {
  return c.json({
    name: 'OpenSen API',
    docs: '/docs',
    openapi: '/openapi.json',
    health: '/health',
    healthDb: '/health/db',
    api: {
      situations: '/api/situations',
      chunks: '/api/chunks',
      dialogues: '/api/dialogues',
      practice: '/api/practice',
      savedSentences: '/api/saved-sentences',
      export: '/api/export',
    },
  })
})

app.get('/openapi.json', (c) => {
  const url = new URL(c.req.url)
  const baseUrl = `${url.protocol}//${url.host}`
  return c.json(buildOpenApiDocument(baseUrl))
})

app.get(
  '/docs',
  Scalar({
    url: '/openapi.json',
    pageTitle: 'OpenSen API Reference',
  }),
)

app.route('/', health)
app.route('/api/situations', situations)
app.route('/api/chunks', chunks)
app.route('/api/dialogues', dialogues)
app.route('/api/practice', practice)
app.route('/api/saved-sentences', savedSentences)
app.route('/api/export', exportRoutes)

export default app
