import type { Database } from './client.js'
import { userChunks } from './schema/practice.js'
import { users } from './schema/users.js'

/** Ensures learner row exists and chunks are in the practice plan (user_chunks). */
export async function enrollChunksForLearner(
  database: Database,
  userId: string,
  chunkIds: string[],
): Promise<void> {
  if (chunkIds.length === 0) return

  await database
    .insert(users)
    .values({
      id: userId,
      email: `${userId}@opensen.local`,
      name: 'Learner',
      nativeLanguage: 'vi',
      targetLanguage: 'en',
      level: 'beginner',
    })
    .onConflictDoNothing()

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
