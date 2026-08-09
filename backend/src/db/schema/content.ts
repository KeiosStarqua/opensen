import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import {
  boolean,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { registerEnum, visibilityEnum } from './enums.js'
import { users } from './users.js'

export const situations = pgTable('situations', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  roleSelf: text('role_self').notNull(),
  roleOther: text('role_other').notNull(),
  goal: text('goal').notNull(),
  tone: text('tone').notNull(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  visibility: visibilityEnum('visibility').notNull().default('private'),
  sourceTemplateId: uuid('source_template_id').references(
    (): AnyPgColumn => situations.id,
    { onDelete: 'set null' },
  ),
})

export const intents = pgTable('intents', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
})

export const sentencePatterns = pgTable('sentence_patterns', {
  id: uuid('id').primaryKey(),
  template: text('template').notNull(),
  meaning: text('meaning').notNull(),
  difficulty: text('difficulty').notNull(),
  level: text('level').notNull(),
  register: registerEnum('register').notNull(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  visibility: visibilityEnum('visibility').notNull().default('private'),
  sourceTemplateId: uuid('source_template_id').references(
    (): AnyPgColumn => sentencePatterns.id,
    { onDelete: 'set null' },
  ),
})

export const patternIntents = pgTable(
  'pattern_intents',
  {
    patternId: uuid('pattern_id')
      .notNull()
      .references(() => sentencePatterns.id, { onDelete: 'cascade' }),
    intentId: uuid('intent_id')
      .notNull()
      .references(() => intents.id, { onDelete: 'cascade' }),
    situationId: uuid('situation_id').references(() => situations.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    uniqueIndex('pattern_intents_pattern_intent_situation_uidx').on(
      table.patternId,
      table.intentId,
      table.situationId,
    ),
  ],
)

export const patternSlots = pgTable(
  'pattern_slots',
  {
    id: uuid('id').primaryKey(),
    patternId: uuid('pattern_id')
      .notNull()
      .references(() => sentencePatterns.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    position: integer('position').notNull(),
    expectedPos: text('expected_pos').notNull(),
  },
  (table) => [
    uniqueIndex('pattern_slots_pattern_position_uidx').on(
      table.patternId,
      table.position,
    ),
    uniqueIndex('pattern_slots_pattern_name_uidx').on(
      table.patternId,
      table.name,
    ),
  ],
)

export const slotVariants = pgTable('slot_variants', {
  id: uuid('id').primaryKey(),
  slotId: uuid('slot_id')
    .notNull()
    .references(() => patternSlots.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  meaning: text('meaning').notNull(),
  level: text('level').notNull(),
  isValidated: boolean('is_validated').notNull().default(false),
})

/** Phase 2 adds `audio_asset_id` FK when `audio_assets` exists. */
export const chunks = pgTable('chunks', {
  id: uuid('id').primaryKey(),
  text: text('text').notNull(),
  type: text('type').notNull(),
  meaning: text('meaning').notNull(),
  pronunciation: text('pronunciation'),
  patternId: uuid('pattern_id').references(() => sentencePatterns.id, {
    onDelete: 'set null',
  }),
  level: text('level').notNull(),
  register: registerEnum('register').notNull(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  visibility: visibilityEnum('visibility').notNull().default('private'),
  sourceTemplateId: uuid('source_template_id').references(
    (): AnyPgColumn => chunks.id,
    { onDelete: 'set null' },
  ),
})
