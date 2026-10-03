import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { requireUserId } from '../auth/session.js'
import type { Database } from '../db/client.js'
import { getDatabase } from '../db/client.js'
import {
  listAnkiNotes,
  type ExportScope,
} from '../db/export-repository.js'
import type { AnkiNote } from '../export/anki-deck-formatter.js'
import {
  ANKI_PACKAGE_MEDIA_TYPE,
  buildAnkiPackage,
} from '../export/anki-package.js'
import { loadDatabaseEnv } from '../lib/env.js'

export type ExportRouteDeps = {
  listNotes?: (
    database: Database,
    userId: string,
    scope: ExportScope,
  ) => Promise<AnkiNote[]>
  getDatabase?: () => Database
  loadDatabaseEnv?: () => unknown
  buildPackage?: (notes: AnkiNote[]) => Promise<Uint8Array>
}

const querySchema = z.object({
  scope: z.enum(['enrolled', 'all']).default('enrolled'),
})

export function createExportRouter(deps: ExportRouteDeps = {}): Hono {
  const resolveListNotes = deps.listNotes ?? listAnkiNotes
  const resolveGetDatabase = deps.getDatabase ?? getDatabase
  const resolveLoadDatabaseEnv = deps.loadDatabaseEnv ?? loadDatabaseEnv
  const resolveBuildPackage = deps.buildPackage ?? buildAnkiPackage

  const router = new Hono()

  router.get('/anki', async (c) => {
    const userId = requireUserId(c)
    const parsed = querySchema.safeParse({ scope: c.req.query('scope') })
    if (!parsed.success) {
      throw new HTTPException(400, { message: 'Invalid scope query' })
    }

    resolveLoadDatabaseEnv()
    const database = resolveGetDatabase()
    const notes = await resolveListNotes(database, userId, parsed.data.scope)

    if (notes.length === 0) {
      return c.json({ empty: true, noteCount: 0 }, 200)
    }

    const bytes = await resolveBuildPackage(notes)
    // Hono accepts ArrayBuffer. ankipack's Uint8Array is ArrayBufferLike.
    const body = new ArrayBuffer(bytes.byteLength)
    new Uint8Array(body).set(bytes)
    c.header('Content-Type', ANKI_PACKAGE_MEDIA_TYPE)
    c.header(
      'Content-Disposition',
      `attachment; filename="opensen-anki-${parsed.data.scope}.apkg"`,
    )
    return c.body(body)
  })

  return router
}

export const exportRoutes = createExportRouter()
