import { describe, expect, it } from 'vitest'
import { Rating } from 'ts-fsrs'
import { applyReview, ratingFromReviewRating } from './fsrs-scheduler.js'

describe('fsrs-scheduler', () => {
  it('maps review rating strings to FSRS grades', () => {
    expect(ratingFromReviewRating('forgot')).toBe(Rating.Again)
    expect(ratingFromReviewRating('hard')).toBe(Rating.Hard)
    expect(ratingFromReviewRating('good')).toBe(Rating.Good)
    expect(ratingFromReviewRating('easy')).toBe(Rating.Easy)
  })

  it('schedules a first review from a new chunk', () => {
    const now = new Date('2026-08-09T12:00:00.000Z')
    const { update } = applyReview(
      {
        status: 'new',
        stability: 0,
        difficulty: 0,
        reps: 0,
        lapses: 0,
        lastReview: null,
        nextReview: null,
      },
      Rating.Good,
      now,
    )

    expect(update.reps).toBeGreaterThan(0)
    expect(update.nextReview.getTime()).toBeGreaterThan(now.getTime())
    expect(['learning', 'review']).toContain(update.status)
  })

  it('moves a reviewed chunk into relearning after a forgot rating', () => {
    const now = new Date('2026-08-09T12:00:00.000Z')
    const learned = applyReview(
      {
        status: 'new',
        stability: 0,
        difficulty: 0,
        reps: 0,
        lapses: 0,
        lastReview: null,
        nextReview: null,
      },
      Rating.Good,
      now,
    )

    const forgot = applyReview(
      {
        status: learned.update.status,
        stability: learned.update.stability,
        difficulty: learned.update.difficulty,
        reps: learned.update.reps,
        lapses: learned.update.lapses,
        lastReview: learned.update.lastReview,
        nextReview: learned.update.nextReview,
      },
      Rating.Again,
      new Date('2026-08-10T12:00:00.000Z'),
    )

    expect(['learning', 'relearning']).toContain(forgot.update.status)
    expect(forgot.update.nextReview.getTime()).toBeGreaterThanOrEqual(
      new Date('2026-08-10T12:00:00.000Z').getTime(),
    )
  })
})
