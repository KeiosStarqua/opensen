import { eq } from 'drizzle-orm'
import type { Database } from './client.js'
import { chunks, patternIntents, sentencePatterns, situations, userChunks } from './schema/index.js'
import { noteForChunk } from '../export/anki-deck-formatter.js'
import type { AnkiNote } from '../export/anki-deck-formatter.js'

export type ExportScope = 'enrolled' | 'all'

export async function listAnkiNotes(
  database: Database,
  userId: string,
  scope: ExportScope,
): Promise<AnkiNote[]> {
  const rows =
    scope === 'enrolled'
      ? await database
          .select({
            id: chunks.id,
            text: chunks.text,
            meaning: chunks.meaning,
            register: chunks.register,
            level: chunks.level,
            patternId: chunks.patternId,
            ownerId: chunks.ownerId,
          })
          .from(userChunks)
          .innerJoin(chunks, eq(userChunks.chunkId, chunks.id))
          .where(eq(userChunks.userId, userId))
      : await database
          .select({
            id: chunks.id,
            text: chunks.text,
            meaning: chunks.meaning,
            register: chunks.register,
            level: chunks.level,
            patternId: chunks.patternId,
            ownerId: chunks.ownerId,
          })
          .from(chunks)
          .where(eq(chunks.ownerId, userId))

  const notes: AnkiNote[] = []
  for (const row of rows) {
    let template: string | undefined
    let situationName: string | undefined
    if (row.patternId) {
      const patterns = await database
        .select({ template: sentencePatterns.template })
        .from(sentencePatterns)
        .where(eq(sentencePatterns.id, row.patternId))
        .limit(1)
      template = patterns[0]?.template
      const sit = await database
        .select({ name: situations.name })
        .from(patternIntents)
        .innerJoin(situations, eq(patternIntents.situationId, situations.id))
        .where(eq(patternIntents.patternId, row.patternId))
        .limit(1)
      situationName = sit[0]?.name
    }
    notes.push(
      noteForChunk({
        text: row.text,
        meaning: row.meaning,
        register: row.register,
        level: row.level,
        template,
        situationName,
      }),
    )
  }
  return notes
}
