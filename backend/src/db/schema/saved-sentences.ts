import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users.js'

/**
 * A sentence the learner typed or pasted from outside the app.
 * Owned by one account. Not a catalog chunk and not an FSRS card.
 */
export const savedSentences = pgTable(
  'saved_sentences',
  {
    id: uuid('id').primaryKey(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('saved_sentences_owner_created_idx').on(
      table.ownerId,
      table.createdAt,
    ),
  ],
)
