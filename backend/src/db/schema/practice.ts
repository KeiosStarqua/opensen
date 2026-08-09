import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { chunkStatusEnum, practiceModeEnum } from './enums.js'
import { chunks, patternSlots } from './content.js'
import { users } from './users.js'

/** Phase 2 adds `audio_asset_id` FK when `audio_assets` exists. */
export const practiceItems = pgTable('practice_items', {
  id: uuid('id').primaryKey(),
  chunkId: uuid('chunk_id')
    .notNull()
    .references(() => chunks.id, { onDelete: 'cascade' }),
  slotId: uuid('slot_id').references(() => patternSlots.id, {
    onDelete: 'set null',
  }),
  mode: practiceModeEnum('mode').notNull(),
  prompt: text('prompt').notNull(),
  expected: text('expected').notNull(),
})

export const practiceAttempts = pgTable('practice_attempts', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  practiceItemId: uuid('practice_item_id')
    .notNull()
    .references(() => practiceItems.id, { onDelete: 'cascade' }),
  transcript: text('transcript').notNull(),
  matchScore: doublePrecision('match_score').notNull(),
  usedHint: boolean('used_hint').notNull().default(false),
  attemptedAt: timestamp('attempted_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const userChunks = pgTable(
  'user_chunks',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    chunkId: uuid('chunk_id')
      .notNull()
      .references(() => chunks.id, { onDelete: 'cascade' }),
    status: chunkStatusEnum('status').notNull().default('new'),
    stability: doublePrecision('stability').notNull().default(0),
    difficulty: doublePrecision('difficulty').notNull().default(0),
    reps: integer('reps').notNull().default(0),
    lapses: integer('lapses').notNull().default(0),
    lastReview: timestamp('last_review', { withTimezone: true }),
    nextReview: timestamp('next_review', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('user_chunks_user_chunk_uidx').on(table.userId, table.chunkId),
  ],
)

export const reviewHistory = pgTable('review_history', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  chunkId: uuid('chunk_id')
    .notNull()
    .references(() => chunks.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  elapsedDays: doublePrecision('elapsed_days').notNull(),
  scheduledDays: doublePrecision('scheduled_days').notNull(),
  stateBefore: chunkStatusEnum('state_before').notNull(),
  practiceAttemptId: uuid('practice_attempt_id').references(
    () => practiceAttempts.id,
    { onDelete: 'set null' },
  ),
  reviewTime: timestamp('review_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
