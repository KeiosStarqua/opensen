import { and, count, eq, gte, isNull, lte, or, sql } from 'drizzle-orm'
import type { Database } from './client.js'
import { chunks } from './schema/content.js'
import { reviewHistory, userChunks } from './schema/practice.js'
import {
  applyReview,
  ratingFromReviewRating,
  ratingToInteger,
  type UserChunkSchedulingState,
} from '../practice/fsrs-scheduler.js'
import type {
  ChunkStatus,
  DuePracticeItem,
  PracticePlanStats,
  ReviewRating,
  ReviewResult,
} from '../practice/types.js'

export type PracticeReviewRepository = {
  listDue(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ items: DuePracticeItem[]; nextCursor: string | null }>
  recordReview(
    userId: string,
    chunkId: string,
    rating: ReviewRating,
    practiceAttemptId?: string,
  ): Promise<ReviewResult>
  getPlanStats(userId: string): Promise<PracticePlanStats>
}

const EMPTY_STATUS_COUNTS: Record<ChunkStatus, number> = {
  new: 0,
  learning: 0,
  review: 0,
  relearning: 0,
}

function mapDueRow(row: {
  chunkId: string
  text: string
  meaning: string
  status: ChunkStatus
  nextReview: Date | null
  stability: number
  difficulty: number
  reps: number
  lapses: number
}): DuePracticeItem {
  return {
    chunkId: row.chunkId,
    text: row.text,
    meaning: row.meaning,
    status: row.status,
    dueAt: row.nextReview?.toISOString() ?? null,
    stability: row.stability,
    difficulty: row.difficulty,
    reps: row.reps,
    lapses: row.lapses,
  }
}

function toSchedulingState(row: {
  status: ChunkStatus
  stability: number
  difficulty: number
  reps: number
  lapses: number
  lastReview: Date | null
  nextReview: Date | null
}): UserChunkSchedulingState {
  return {
    status: row.status,
    stability: row.stability,
    difficulty: row.difficulty,
    reps: row.reps,
    lapses: row.lapses,
    lastReview: row.lastReview,
    nextReview: row.nextReview,
  }
}

async function listDueItems(
  database: Database,
  userId: string,
  limit: number,
  cursor?: string,
): Promise<{ items: DuePracticeItem[]; nextCursor: string | null }> {
  const now = new Date()

  const dueCondition = or(
    isNull(userChunks.nextReview),
    lte(userChunks.nextReview, now),
  )

  const rows = await database
    .select({
      chunkId: userChunks.chunkId,
      text: chunks.text,
      meaning: chunks.meaning,
      status: userChunks.status,
      nextReview: userChunks.nextReview,
      stability: userChunks.stability,
      difficulty: userChunks.difficulty,
      reps: userChunks.reps,
      lapses: userChunks.lapses,
    })
    .from(userChunks)
    .innerJoin(chunks, eq(chunks.id, userChunks.chunkId))
    .where(
      and(
        eq(userChunks.userId, userId),
        dueCondition,
        cursor ? sql`${userChunks.chunkId} > ${cursor}` : undefined,
      ),
    )
    .orderBy(userChunks.nextReview, userChunks.chunkId)
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows

  return {
    items: page.map(mapDueRow),
    nextCursor: hasMore ? page[page.length - 1]?.chunkId ?? null : null,
  }
}

async function recordReviewItem(
  database: Database,
  userId: string,
  chunkId: string,
  rating: ReviewRating,
  practiceAttemptId?: string,
): Promise<ReviewResult> {
  const now = new Date()
  const fsrsRating = ratingFromReviewRating(rating)
  const reviewHistoryId = crypto.randomUUID()

  return database.transaction(async (tx) => {
    const chunkRows = await tx
      .select({ id: chunks.id })
      .from(chunks)
      .where(eq(chunks.id, chunkId))
      .limit(1)

    if (chunkRows.length === 0) {
      throw new PracticeReviewError('chunk_not_found', 'Chunk not found')
    }

    const existing = await tx
      .select({
        status: userChunks.status,
        stability: userChunks.stability,
        difficulty: userChunks.difficulty,
        reps: userChunks.reps,
        lapses: userChunks.lapses,
        lastReview: userChunks.lastReview,
        nextReview: userChunks.nextReview,
      })
      .from(userChunks)
      .where(
        and(eq(userChunks.userId, userId), eq(userChunks.chunkId, chunkId)),
      )
      .limit(1)

    const previous = existing[0]
    const stateBefore = previous?.status ?? 'new'
    const schedulingState = previous
      ? toSchedulingState(previous)
      : {
          status: 'new' as const,
          stability: 0,
          difficulty: 0,
          reps: 0,
          lapses: 0,
          lastReview: null,
          nextReview: null,
        }

    const { update } = applyReview(schedulingState, fsrsRating, now)

    await tx
      .insert(userChunks)
      .values({
        userId,
        chunkId,
        status: update.status,
        stability: update.stability,
        difficulty: update.difficulty,
        reps: update.reps,
        lapses: update.lapses,
        lastReview: update.lastReview,
        nextReview: update.nextReview,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [userChunks.userId, userChunks.chunkId],
        set: {
          status: update.status,
          stability: update.stability,
          difficulty: update.difficulty,
          reps: update.reps,
          lapses: update.lapses,
          lastReview: update.lastReview,
          nextReview: update.nextReview,
          updatedAt: now,
        },
      })

    await tx.insert(reviewHistory).values({
      id: reviewHistoryId,
      userId,
      chunkId,
      rating: ratingToInteger(fsrsRating),
      elapsedDays: update.elapsedDays,
      scheduledDays: update.scheduledDays,
      stateBefore,
      practiceAttemptId: practiceAttemptId ?? null,
      reviewTime: now,
    })

    return {
      chunkId,
      status: update.status,
      stability: update.stability,
      difficulty: update.difficulty,
      reps: update.reps,
      lapses: update.lapses,
      lastReview: update.lastReview.toISOString(),
      nextReview: update.nextReview.toISOString(),
      scheduledDays: update.scheduledDays,
      elapsedDays: update.elapsedDays,
      reviewHistoryId,
    }
  })
}

async function fetchPlanStats(
  database: Database,
  userId: string,
): Promise<PracticePlanStats> {
  const now = new Date()
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const startOfToday = new Date(now)
  startOfToday.setUTCHours(0, 0, 0, 0)

  const statusRows = await database
    .select({
      status: userChunks.status,
      total: count(),
    })
    .from(userChunks)
    .where(eq(userChunks.userId, userId))
    .groupBy(userChunks.status)

  const dueNowRows = await database
    .select({ total: count() })
    .from(userChunks)
    .where(
      and(
        eq(userChunks.userId, userId),
        or(isNull(userChunks.nextReview), lte(userChunks.nextReview, now)),
      ),
    )

  const dueSoonRows = await database
    .select({ total: count() })
    .from(userChunks)
    .where(
      and(
        eq(userChunks.userId, userId),
        or(
          isNull(userChunks.nextReview),
          lte(userChunks.nextReview, inSevenDays),
        ),
      ),
    )

  const reviewedTodayRows = await database
    .select({ total: count() })
    .from(reviewHistory)
    .where(
      and(
        eq(reviewHistory.userId, userId),
        gte(reviewHistory.reviewTime, startOfToday),
      ),
    )

  const byStatus = { ...EMPTY_STATUS_COUNTS }
  let total = 0

  for (const row of statusRows) {
    byStatus[row.status] = Number(row.total)
    total += Number(row.total)
  }

  return {
    total,
    byStatus,
    dueNow: Number(dueNowRows[0]?.total ?? 0),
    dueNext7Days: Number(dueSoonRows[0]?.total ?? 0),
    reviewedToday: Number(reviewedTodayRows[0]?.total ?? 0),
  }
}

export class PracticeReviewError extends Error {
  constructor(
    readonly code: 'chunk_not_found',
    message: string,
  ) {
    super(message)
    this.name = 'PracticeReviewError'
  }
}

export function createPracticeReviewRepository(
  database: Database,
  _databaseUrl: string,
): PracticeReviewRepository {
  return {
    listDue: (userId, limit, cursor) =>
      listDueItems(database, userId, limit, cursor),
    recordReview: (userId, chunkId, rating, practiceAttemptId) =>
      recordReviewItem(database, userId, chunkId, rating, practiceAttemptId),
    getPlanStats: (userId) => fetchPlanStats(database, userId),
  }
}
