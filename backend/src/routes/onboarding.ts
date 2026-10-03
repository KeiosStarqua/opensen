import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { requireUserId } from '../auth/session.js'
import type { Database } from '../db/client.js'
import { getDatabase } from '../db/client.js'
import {
  createOnboardingRepository,
  type OnboardingRepository,
} from '../db/onboarding-repository.js'
import { loadDatabaseEnv } from '../lib/env.js'

const bodySchema = z.object({
  complete: z.boolean(),
})

export type OnboardingRouteDeps = {
  getDatabase?: () => Database
  createRepository?: (database: Database) => OnboardingRepository
  loadDatabaseEnv?: typeof loadDatabaseEnv
}

export function createOnboardingRouter(deps: OnboardingRouteDeps = {}): Hono {
  const resolveGetDatabase = deps.getDatabase ?? getDatabase
  const resolveCreateRepository =
    deps.createRepository ?? createOnboardingRepository
  const resolveLoadDatabaseEnv = deps.loadDatabaseEnv ?? loadDatabaseEnv

  const router = new Hono()

  function repository() {
    resolveLoadDatabaseEnv()
    return resolveCreateRepository(resolveGetDatabase())
  }

  router.get('/', async (c) => {
    const userId = requireUserId(c)
    return c.json(await repository().get(userId))
  })

  router.put('/', async (c) => {
    const userId = requireUserId(c)
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      throw new HTTPException(400, { message: 'Invalid JSON body' })
    }
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: parsed.error.issues
          .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
          .join('; '),
      })
    }

    const status = await repository().set(userId, parsed.data.complete)
    return c.json(status)
  })

  return router
}

export const onboarding = createOnboardingRouter()
