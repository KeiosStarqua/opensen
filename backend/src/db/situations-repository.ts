import { and, asc, eq, gt, sql } from 'drizzle-orm'
import type { Database } from './client.js'
import {
  chunks,
  dialogueLines,
  dialogues,
  intents,
  lineChunks,
  patternIntents,
  situations,
} from './schema/index.js'

export type SituationSummary = {
  id: string
  name: string
  description: string
  category: string
  roleSelf: string
  roleOther: string
  goal: string
  tone: string
}

export type SituationDetail = SituationSummary & {
  intents: Array<{ id: string; name: string; description: string }>
  dialogues: Array<{ id: string; title: string; level: string }>
  chunks: Array<{
    id: string
    text: string
    meaning: string
    level: string
    register: string
  }>
}

export type SituationsRepository = {
  list(
    limit: number,
    cursor?: string,
  ): Promise<{ items: SituationSummary[]; nextCursor: string | null }>
  getById(id: string): Promise<SituationDetail | null>
  listIntents(situationId: string): Promise<
    Array<{ id: string; name: string; description: string }>
  >
}

function mapSituation(row: typeof situations.$inferSelect): SituationSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    roleSelf: row.roleSelf,
    roleOther: row.roleOther,
    goal: row.goal,
    tone: row.tone,
  }
}

export function createSituationsRepository(database: Database): SituationsRepository {
  return {
    async list(limit, cursor) {
      const rows = await database
        .select()
        .from(situations)
        .where(
          and(
            eq(situations.visibility, 'public'),
            cursor ? gt(situations.id, cursor) : undefined,
          ),
        )
        .orderBy(asc(situations.id))
        .limit(limit + 1)

      const hasMore = rows.length > limit
      const page = hasMore ? rows.slice(0, limit) : rows
      return {
        items: page.map(mapSituation),
        nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
      }
    },

    async getById(id) {
      const rows = await database
        .select()
        .from(situations)
        .where(eq(situations.id, id))
        .limit(1)
      const situation = rows[0]
      if (!situation) return null

      const intentRows = await database
        .selectDistinct({
          id: intents.id,
          name: intents.name,
          description: intents.description,
        })
        .from(intents)
        .innerJoin(patternIntents, eq(patternIntents.intentId, intents.id))
        .where(eq(patternIntents.situationId, id))
        .orderBy(asc(intents.name))

      const dialogueRows = await database
        .select({
          id: dialogues.id,
          title: dialogues.title,
          level: dialogues.level,
        })
        .from(dialogues)
        .where(eq(dialogues.situationId, id))
        .orderBy(asc(dialogues.title))

      const patternChunkRows = await database
        .selectDistinct({
          id: chunks.id,
          text: chunks.text,
          meaning: chunks.meaning,
          level: chunks.level,
          register: chunks.register,
        })
        .from(chunks)
        .innerJoin(
          patternIntents,
          eq(patternIntents.patternId, chunks.patternId),
        )
        .where(
          and(eq(patternIntents.situationId, id), sql`${chunks.patternId} IS NOT NULL`),
        )

      const dialogueChunkRows = await database
        .selectDistinct({
          id: chunks.id,
          text: chunks.text,
          meaning: chunks.meaning,
          level: chunks.level,
          register: chunks.register,
        })
        .from(chunks)
        .innerJoin(lineChunks, eq(lineChunks.chunkId, chunks.id))
        .innerJoin(dialogueLines, eq(dialogueLines.id, lineChunks.lineId))
        .innerJoin(dialogues, eq(dialogues.id, dialogueLines.dialogueId))
        .where(eq(dialogues.situationId, id))

      const chunkMap = new Map<string, (typeof patternChunkRows)[0]>()
      for (const chunk of [...patternChunkRows, ...dialogueChunkRows]) {
        chunkMap.set(chunk.id, chunk)
      }

      return {
        ...mapSituation(situation),
        intents: intentRows,
        dialogues: dialogueRows,
        chunks: [...chunkMap.values()].sort((a, b) =>
          a.text.localeCompare(b.text),
        ),
      }
    },

    async listIntents(situationId) {
      return database
        .selectDistinct({
          id: intents.id,
          name: intents.name,
          description: intents.description,
        })
        .from(intents)
        .innerJoin(patternIntents, eq(patternIntents.intentId, intents.id))
        .where(eq(patternIntents.situationId, situationId))
        .orderBy(asc(intents.name))
    },
  }
}
