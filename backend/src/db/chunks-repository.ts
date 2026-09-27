import { and, asc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import type { Database } from './client.js'
import {
  chunks,
  patternIntents,
  patternSlots,
  sentencePatterns,
  situations,
  slotVariants,
} from './schema/index.js'

export type ChunkSummary = {
  id: string
  text: string
  meaning: string
  level: string
  register: string
  type: string
  ownerId: string | null
  editable: boolean
}

export type ChunkDetail = ChunkSummary & {
  patternId: string | null
  pronunciation: string | null
  situation: { id: string; name: string } | null
}

export type ChunkPatternPayload = {
  pattern: {
    id: string
    template: string
    meaning: string
    register: string
    level: string
    slots: Array<{
      id: string
      name: string
      position: number
      expectedPos: string
      variants: Array<{ id: string; text: string; meaning: string }>
    }>
  }
  siblingChunks: Array<{ id: string; text: string; meaning: string }>
}

export type CreateChunkInput = {
  text: string
  meaning: string
  register: string
  level: string
  template: string
  patternMeaning: string
  slots: Array<{
    name: string
    position: number
    expectedPos: string
    variants: Array<{ text: string; meaning: string }>
  }>
}

export type ChunksRepository = {
  list(
    userId: string | null,
    options: { limit: number; cursor?: string; q?: string; register?: string },
  ): Promise<{ items: ChunkSummary[]; nextCursor: string | null }>
  getById(id: string, userId: string | null): Promise<ChunkDetail | null>
  getPatternsForChunk(id: string): Promise<ChunkPatternPayload | null>
  getPatternById(patternId: string): Promise<ChunkPatternPayload['pattern'] | null>
  create(userId: string, input: CreateChunkInput): Promise<ChunkDetail>
  update(
    userId: string,
    id: string,
    patch: { text?: string; meaning?: string },
  ): Promise<ChunkDetail | null>
}

function mapSummary(
  row: typeof chunks.$inferSelect,
  userId: string | null,
): ChunkSummary {
  return {
    id: row.id,
    text: row.text,
    meaning: row.meaning,
    level: row.level,
    register: row.register,
    type: row.type,
    ownerId: row.ownerId,
    editable: userId !== null && row.ownerId === userId,
  }
}

export function createChunksRepository(database: Database): ChunksRepository {
  return {
    async list(userId, options) {
      const { limit, cursor, q, register } = options
      const visibilityFilter = userId
        ? or(eq(chunks.visibility, 'public'), eq(chunks.ownerId, userId))
        : eq(chunks.visibility, 'public')

      const rows = await database
        .select()
        .from(chunks)
        .where(
          and(
            visibilityFilter,
            register ? eq(chunks.register, register as never) : undefined,
            q
              ? or(
                  ilike(chunks.text, `%${q}%`),
                  ilike(chunks.meaning, `%${q}%`),
                )
              : undefined,
            cursor ? sql`${chunks.id} > ${cursor}` : undefined,
          ),
        )
        .orderBy(asc(chunks.id))
        .limit(limit + 1)

      const hasMore = rows.length > limit
      const page = hasMore ? rows.slice(0, limit) : rows
      return {
        items: page.map((row) => mapSummary(row, userId)),
        nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
      }
    },

    async getById(id, userId) {
      const rows = await database
        .select()
        .from(chunks)
        .where(eq(chunks.id, id))
        .limit(1)
      const row = rows[0]
      if (!row) return null
      if (row.visibility !== 'public' && row.ownerId !== userId) {
        return null
      }

      let situation: { id: string; name: string } | null = null
      if (row.patternId) {
        const links = await database
          .select({
            situationId: patternIntents.situationId,
            name: situations.name,
          })
          .from(patternIntents)
          .innerJoin(situations, eq(patternIntents.situationId, situations.id))
          .where(eq(patternIntents.patternId, row.patternId))
          .limit(1)
        if (links[0]?.situationId) {
          situation = { id: links[0].situationId, name: links[0].name }
        }
      }

      return {
        ...mapSummary(row, userId),
        patternId: row.patternId,
        pronunciation: row.pronunciation,
        situation,
      }
    },

    async getPatternById(patternId) {
      const patternRows = await database
        .select()
        .from(sentencePatterns)
        .where(eq(sentencePatterns.id, patternId))
        .limit(1)
      const pattern = patternRows[0]
      if (!pattern) return null

      const slots = await database
        .select()
        .from(patternSlots)
        .where(eq(patternSlots.patternId, patternId))
        .orderBy(asc(patternSlots.position))

      const slotIds = slots.map((slot) => slot.id)
      const variants =
        slotIds.length === 0
          ? []
          : await database
              .select()
              .from(slotVariants)
              .where(inArray(slotVariants.slotId, slotIds))

      return {
        id: pattern.id,
        template: pattern.template,
        meaning: pattern.meaning,
        register: pattern.register,
        level: pattern.level,
        slots: slots.map((slot) => ({
          id: slot.id,
          name: slot.name,
          position: slot.position,
          expectedPos: slot.expectedPos,
          variants: variants
            .filter((variant) => variant.slotId === slot.id)
            .map((variant) => ({
              id: variant.id,
              text: variant.text,
              meaning: variant.meaning,
            })),
        })),
      }
    },

    async getPatternsForChunk(id) {
      const chunkRows = await database
        .select({ patternId: chunks.patternId })
        .from(chunks)
        .where(eq(chunks.id, id))
        .limit(1)
      const patternId = chunkRows[0]?.patternId
      if (!patternId) return null

      const patternRows = await database
        .select()
        .from(sentencePatterns)
        .where(eq(sentencePatterns.id, patternId))
        .limit(1)
      const pattern = patternRows[0]
      if (!pattern) return null

      const slots = await database
        .select()
        .from(patternSlots)
        .where(eq(patternSlots.patternId, patternId))
        .orderBy(asc(patternSlots.position))

      const slotIds = slots.map((slot) => slot.id)
      const variants =
        slotIds.length === 0
          ? []
          : await database
              .select()
              .from(slotVariants)
              .where(inArray(slotVariants.slotId, slotIds))

      const siblings = await database
        .select({
          id: chunks.id,
          text: chunks.text,
          meaning: chunks.meaning,
        })
        .from(chunks)
        .where(eq(chunks.patternId, patternId))
        .limit(20)

      return {
        pattern: {
          id: pattern.id,
          template: pattern.template,
          meaning: pattern.meaning,
          register: pattern.register,
          level: pattern.level,
          slots: slots.map((slot) => ({
            id: slot.id,
            name: slot.name,
            position: slot.position,
            expectedPos: slot.expectedPos,
            variants: variants
              .filter((variant) => variant.slotId === slot.id)
              .map((variant) => ({
                id: variant.id,
                text: variant.text,
                meaning: variant.meaning,
              })),
          })),
        },
        siblingChunks: siblings.filter((s) => s.id !== id),
      }
    },

    async create(userId, input) {
      const patternId = crypto.randomUUID()
      const chunkId = crypto.randomUUID()

      await database.insert(sentencePatterns).values({
        id: patternId,
        template: input.template,
        meaning: input.patternMeaning,
        difficulty: 'medium',
        level: input.level,
        register: input.register as never,
        ownerId: userId,
        visibility: 'private',
      })

      for (const slot of input.slots) {
        const slotId = crypto.randomUUID()
        await database.insert(patternSlots).values({
          id: slotId,
          patternId,
          name: slot.name,
          position: slot.position,
          expectedPos: slot.expectedPos,
        })
        for (const variant of slot.variants) {
          await database.insert(slotVariants).values({
            id: crypto.randomUUID(),
            slotId,
            text: variant.text,
            meaning: variant.meaning,
            level: input.level,
            isValidated: true,
          })
        }
      }

      await database.insert(chunks).values({
        id: chunkId,
        text: input.text,
        type: 'phrase',
        meaning: input.meaning,
        pronunciation: null,
        patternId,
        level: input.level,
        register: input.register as never,
        ownerId: userId,
        visibility: 'private',
      })

      const created = await this.getById(chunkId, userId)
      if (!created) {
        throw new Error('Failed to load created chunk')
      }
      return created
    },

    async update(userId, id, patch) {
      const existing = await this.getById(id, userId)
      if (!existing?.editable) return null

      await database
        .update(chunks)
        .set({
          ...(patch.text !== undefined ? { text: patch.text } : {}),
          ...(patch.meaning !== undefined ? { meaning: patch.meaning } : {}),
        })
        .where(and(eq(chunks.id, id), eq(chunks.ownerId, userId)))

      return this.getById(id, userId)
    },
  }
}
