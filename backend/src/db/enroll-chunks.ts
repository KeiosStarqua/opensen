import type { Database } from './client.js'
import { ensureLearner } from './ensure-learner.js'
import { userChunks } from './schema/practice.js'

/** Ensures learner row exists and chunks are in the practice plan (user_chunks). */
export async function enrollChunksForLearner(
  database: Database,
  userId: string,
  chunkIds: string[],
): Promise<void> {
  if (chunkIds.length === 0) return

  await ensureLearner(database, userId)

  for (const chunkId of chunkIds) {
    await database
      .insert(userChunks)
      .values({
        userId,
        chunkId,
        status: 'new',
        stability: 0,
        difficulty: 0,
        reps: 0,
        lapses: 0,
        lastReview: null,
        nextReview: null,
      })
      .onConflictDoNothing()
  }
}
