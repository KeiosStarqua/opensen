export type ChunkStatus = 'new' | 'learning' | 'review' | 'relearning'

export const REVIEW_RATINGS = ['forgot', 'hard', 'good', 'easy'] as const
export type ReviewRating = (typeof REVIEW_RATINGS)[number]

export type DuePracticeItem = {
  chunkId: string
  text: string
  meaning: string
  status: ChunkStatus
  dueAt: string | null
  stability: number
  difficulty: number
  reps: number
  lapses: number
}

export type ReviewResult = {
  chunkId: string
  status: ChunkStatus
  stability: number
  difficulty: number
  reps: number
  lapses: number
  lastReview: string
  nextReview: string
  scheduledDays: number
  elapsedDays: number
  reviewHistoryId: string
}

export type PracticePlanStats = {
  total: number
  byStatus: Record<ChunkStatus, number>
  dueNow: number
  dueNext7Days: number
  reviewedToday: number
}
