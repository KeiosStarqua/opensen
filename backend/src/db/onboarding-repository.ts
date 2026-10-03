import { eq } from 'drizzle-orm'
import type { Database } from './client.js'
import { ensureLearner } from './ensure-learner.js'
import { users } from './schema/users.js'

/** Whether this account has finished onboarding. Follows the learner across devices. */
export type OnboardingStatus = {
  complete: boolean
}

export type OnboardingRepository = {
  get(userId: string): Promise<OnboardingStatus>
  set(userId: string, complete: boolean): Promise<OnboardingStatus>
}

export function createOnboardingRepository(
  database: Database,
): OnboardingRepository {
  return {
    async get(userId) {
      const [row] = await database
        .select({ completedAt: users.onboardingCompletedAt })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
      return { complete: row?.completedAt != null }
    },

    async set(userId, complete) {
      await ensureLearner(database, userId)
      await database
        .update(users)
        .set({ onboardingCompletedAt: complete ? new Date() : null })
        .where(eq(users.id, userId))
      return { complete }
    },
  }
}
