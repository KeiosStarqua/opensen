import type { Database } from './client.js'
import { users } from './schema/users.js'

/** Creates the learner row that user-owned rows reference, if it is missing. */
export async function ensureLearner(
  database: Database,
  userId: string,
): Promise<void> {
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
}
