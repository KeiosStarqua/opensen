import { Hono } from 'hono'
import { sql } from 'drizzle-orm'
import type { Database } from '../db/client.js'
import { getDatabase } from '../db/client.js'
import { loadDatabaseEnv } from '../lib/env.js'

export type HealthRouteDeps = {
  getDatabase?: () => Database
  loadDatabaseEnv?: typeof loadDatabaseEnv
}

export function createHealthRouter(deps: HealthRouteDeps = {}): Hono {
  const resolveGetDatabase = deps.getDatabase ?? getDatabase
  const resolveLoadDatabaseEnv = deps.loadDatabaseEnv ?? loadDatabaseEnv

  const router = new Hono()

  router.get('/health', (c) => {
    return c.json({
      ok: true,
      service: 'opensen-backend',
      timestamp: new Date().toISOString(),
    })
  })

  // Readiness probe: confirms DATABASE_URL is configured and the database
  // actually accepts a query. Every other `/api/*` route depends on this —
  // check this first when routes 500 with a generic "Internal Server Error".
  router.get('/health/db', async (c) => {
    const timestamp = new Date().toISOString()
    try {
      resolveLoadDatabaseEnv()
    } catch (error) {
      return c.json(
        {
          ok: false,
          service: 'opensen-backend',
          timestamp,
          error: 'DATABASE_URL is missing or invalid',
          detail: error instanceof Error ? error.message : String(error),
        },
        503,
      )
    }

    try {
      const database = resolveGetDatabase()
      await database.execute(sql`select 1`)
    } catch (error) {
      return c.json(
        {
          ok: false,
          service: 'opensen-backend',
          timestamp,
          error: 'Database query failed',
          detail: error instanceof Error ? error.message : String(error),
        },
        503,
      )
    }

    return c.json({ ok: true, service: 'opensen-backend', timestamp })
  })

  return router
}

export const health = createHealthRouter()
