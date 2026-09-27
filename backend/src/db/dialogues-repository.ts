import { asc, eq, inArray } from 'drizzle-orm'
import type { Database } from './client.js'
import {
  chunks,
  dialogueLines,
  dialogues,
  lineChunks,
} from './schema/index.js'

export type DialogueSummary = {
  id: string
  situationId: string
  title: string
  level: string
}

export type DialogueDetail = DialogueSummary & {
  lines: Array<{ position: number; speaker: string; text: string; chunkIds: string[] }>
  chunks: Array<{ id: string; text: string; meaning: string }>
}

export type DialoguesRepository = {
  list(): Promise<{ items: DialogueSummary[]; nextCursor: null }>
  getById(id: string): Promise<DialogueDetail | null>
}

export function createDialoguesRepository(database: Database): DialoguesRepository {
  return {
    async list() {
      const rows = await database
        .select({
          id: dialogues.id,
          situationId: dialogues.situationId,
          title: dialogues.title,
          level: dialogues.level,
        })
        .from(dialogues)
        .orderBy(asc(dialogues.title))
        .limit(100)
      return { items: rows, nextCursor: null }
    },

    async getById(id) {
      const header = await database
        .select({
          id: dialogues.id,
          situationId: dialogues.situationId,
          title: dialogues.title,
          level: dialogues.level,
        })
        .from(dialogues)
        .where(eq(dialogues.id, id))
        .limit(1)
      const dialogue = header[0]
      if (!dialogue) return null

      const lines = await database
        .select({
          position: dialogueLines.position,
          speaker: dialogueLines.speaker,
          text: dialogueLines.text,
          lineId: dialogueLines.id,
        })
        .from(dialogueLines)
        .where(eq(dialogueLines.dialogueId, id))
        .orderBy(asc(dialogueLines.position))

      const lineIds = lines.map((line) => line.lineId)
      const chunkLinks =
        lineIds.length === 0
          ? []
          : await database
              .select({
                lineId: lineChunks.lineId,
                chunkId: lineChunks.chunkId,
              })
              .from(lineChunks)
              .where(inArray(lineChunks.lineId, lineIds))

      const chunkIdSet = new Set(chunkLinks.map((link) => link.chunkId))

      const filteredChunks =
        chunkIdSet.size === 0
          ? []
          : await database
              .select({
                id: chunks.id,
                text: chunks.text,
                meaning: chunks.meaning,
              })
              .from(chunks)
              .where(inArray(chunks.id, [...chunkIdSet]))

      return {
        ...dialogue,
        lines: lines.map((line) => ({
          position: line.position,
          speaker: line.speaker,
          text: line.text,
          chunkIds: chunkLinks
            .filter((link) => link.lineId === line.lineId)
            .map((link) => link.chunkId),
        })),
        chunks: filteredChunks,
      }
    },
  }
}
