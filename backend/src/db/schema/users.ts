import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  nativeLanguage: text('native_language').notNull(),
  targetLanguage: text('target_language').notNull(),
  level: text('level').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  goal: text('goal').notNull(),
  dailyMinutes: integer('daily_minutes').notNull(),
  learningStyle: text('learning_style').notNull(),
})
