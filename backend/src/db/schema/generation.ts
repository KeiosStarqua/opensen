import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import {
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  vector,
} from 'drizzle-orm/pg-core'
import {
  embeddingEntityTypeEnum,
  validationVerdictEnum,
  visibilityEnum,
} from './enums.js'
import { chunks, situations } from './content.js'
import { users } from './users.js'

/** Phase 2 adds `audio_asset_id` FK when `audio_assets` exists. */
export const dialogues = pgTable('dialogues', {
  id: uuid('id').primaryKey(),
  situationId: uuid('situation_id')
    .notNull()
    .references(() => situations.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  level: text('level').notNull(),
  createdBy: text('created_by').notNull(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  visibility: visibilityEnum('visibility').notNull().default('private'),
  sourceTemplateId: uuid('source_template_id').references(
    (): AnyPgColumn => dialogues.id,
    { onDelete: 'set null' },
  ),
})

/** Phase 2 adds `audio_asset_id` FK when `audio_assets` exists. */
export const dialogueLines = pgTable(
  'dialogue_lines',
  {
    id: uuid('id').primaryKey(),
    dialogueId: uuid('dialogue_id')
      .notNull()
      .references(() => dialogues.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    speaker: text('speaker').notNull(),
    text: text('text').notNull(),
  },
  (table) => [
    uniqueIndex('dialogue_lines_dialogue_position_uidx').on(
      table.dialogueId,
      table.position,
    ),
  ],
)

export const lineChunks = pgTable(
  'line_chunks',
  {
    lineId: uuid('line_id')
      .notNull()
      .references(() => dialogueLines.id, { onDelete: 'cascade' }),
    chunkId: uuid('chunk_id')
      .notNull()
      .references(() => chunks.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('line_chunks_line_chunk_uidx').on(table.lineId, table.chunkId),
  ],
)

export const aiGenerations = pgTable('ai_generations', {
  id: uuid('id').primaryKey(),
  requestId: uuid('request_id').notNull(),
  step: text('step').notNull(),
  model: text('model').notNull(),
  promptVersion: text('prompt_version').notNull(),
  schemaVersion: text('schema_version').notNull(),
  input: jsonb('input').notNull(),
  output: jsonb('output').notNull(),
  validationVerdict: validationVerdictEnum('validation_verdict').notNull(),
  cost: doublePrecision('cost'),
  latencyMs: integer('latency_ms'),
})

export const embeddings = pgTable('embeddings', {
  id: uuid('id').primaryKey(),
  entityType: embeddingEntityTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  vector: vector('vector', { dimensions: 1536 }).notNull(),
  model: text('model').notNull(),
})
