import { pgEnum } from 'drizzle-orm/pg-core'

export const visibilityEnum = pgEnum('visibility', [
  'private',
  'unlisted',
  'public',
])

export const registerEnum = pgEnum('register', [
  'casual',
  'neutral',
  'polite',
  'formal',
])

export const chunkStatusEnum = pgEnum('chunk_status', [
  'new',
  'learning',
  'review',
  'relearning',
])

export const practiceModeEnum = pgEnum('practice_mode', [
  'listen_repeat',
  'l1_to_l2',
  'cloze',
  'slot_swap',
])

export const validationVerdictEnum = pgEnum('validation_verdict', [
  'pass',
  'fail',
  'retried',
])

export const embeddingEntityTypeEnum = pgEnum('embedding_entity_type', [
  'chunk',
  'pattern',
  'situation',
])
