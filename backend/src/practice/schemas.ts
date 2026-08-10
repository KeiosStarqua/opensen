import { z } from 'zod'
import { REVIEW_RATINGS } from './types.js'

export const reviewRequestSchema = z.object({
  chunkId: z.string().uuid(),
  rating: z.enum(REVIEW_RATINGS),
  practiceAttemptId: z.string().uuid().optional(),
})

export const dueQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
})
