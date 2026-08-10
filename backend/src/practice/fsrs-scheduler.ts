import {
  createEmptyCard,
  fsrs,
  Rating,
  State,
  type Card,
  type Grade,
  type ReviewLog,
} from 'ts-fsrs'
import type { ChunkStatus } from './types.js'

const scheduler = fsrs()

const STATUS_TO_STATE: Record<ChunkStatus, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
}

const STATE_TO_STATUS: Record<State, ChunkStatus> = {
  [State.New]: 'new',
  [State.Learning]: 'learning',
  [State.Review]: 'review',
  [State.Relearning]: 'relearning',
}

export type UserChunkSchedulingState = {
  status: ChunkStatus
  stability: number
  difficulty: number
  reps: number
  lapses: number
  lastReview: Date | null
  nextReview: Date | null
}

export type SchedulingUpdate = {
  status: ChunkStatus
  stability: number
  difficulty: number
  reps: number
  lapses: number
  lastReview: Date
  nextReview: Date
  scheduledDays: number
  elapsedDays: number
}

export function toFsrsCard(state: UserChunkSchedulingState, now: Date): Card {
  if (state.status === 'new' && state.reps === 0 && !state.lastReview) {
    return createEmptyCard(now)
  }

  return {
    due: state.nextReview ?? now,
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: state.reps,
    lapses: state.lapses,
    state: STATUS_TO_STATE[state.status],
    last_review: state.lastReview ?? undefined,
  }
}

export function applyReview(
  state: UserChunkSchedulingState,
  rating: Grade,
  now: Date,
): { update: SchedulingUpdate; log: ReviewLog } {
  const card = toFsrsCard(state, now)
  const result = scheduler.next(card, now, rating)
  const nextCard = result.card
  const log = result.log

  return {
    update: {
      status: STATE_TO_STATUS[nextCard.state],
      stability: nextCard.stability,
      difficulty: nextCard.difficulty,
      reps: nextCard.reps,
      lapses: nextCard.lapses,
      lastReview: now,
      nextReview: nextCard.due,
      scheduledDays: log.scheduled_days,
      elapsedDays: log.elapsed_days,
    },
    log,
  }
}

export function ratingFromReviewRating(reviewRating: string): Grade {
  switch (reviewRating.toLowerCase()) {
    case 'forgot':
    case 'again':
      return Rating.Again
    case 'hard':
      return Rating.Hard
    case 'good':
      return Rating.Good
    case 'easy':
      return Rating.Easy
    default:
      throw new Error(`Unsupported review rating: ${reviewRating}`)
  }
}

export function ratingToInteger(rating: Grade): number {
  return rating
}
