import { and, desc, eq } from 'drizzle-orm'
import type { Database } from './client.js'
import { ensureLearner } from './ensure-learner.js'
import { savedSentences } from './schema/index.js'

/** A sentence one learner kept, exactly as they entered it. */
export type SavedSentence = {
  id: string
  text: string
  createdAt: string
}

export type SavedSentencesRepository = {
  create(ownerId: string, text: string): Promise<SavedSentence>
  list(ownerId: string): Promise<SavedSentence[]>
  getById(ownerId: string, id: string): Promise<SavedSentence | null>
  /** Null when this owner has no row with that id. Does not reveal another learner’s row. */
  update(ownerId: string, id: string, text: string): Promise<SavedSentence | null>
}

const LIST_LIMIT = 100

function toSentence(row: typeof savedSentences.$inferSelect): SavedSentence {
  return {
    id: row.id,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
  }
}

export function createSavedSentencesRepository(
  database: Database,
): SavedSentencesRepository {
  return {
    async create(ownerId, text) {
      await ensureLearner(database, ownerId)
      const [row] = await database
        .insert(savedSentences)
        .values({
          id: crypto.randomUUID(),
          ownerId,
          text,
        })
        .returning()
      if (!row) {
        throw new Error('Insert did not return a saved sentence')
      }
      return toSentence(row)
    },

    async list(ownerId) {
      const rows = await database
        .select()
        .from(savedSentences)
        .where(eq(savedSentences.ownerId, ownerId))
        .orderBy(desc(savedSentences.createdAt), desc(savedSentences.id))
        .limit(LIST_LIMIT)
      return rows.map(toSentence)
    },

    async getById(ownerId, id) {
      const [row] = await database
        .select()
        .from(savedSentences)
        .where(
          and(eq(savedSentences.id, id), eq(savedSentences.ownerId, ownerId)),
        )
        .limit(1)
      return row ? toSentence(row) : null
    },

    async update(ownerId, id, text) {
      const [row] = await database
        .update(savedSentences)
        .set({ text })
        .where(
          and(eq(savedSentences.id, id), eq(savedSentences.ownerId, ownerId)),
        )
        .returning()
      return row ? toSentence(row) : null
    },
  }
}
