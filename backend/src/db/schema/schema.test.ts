import { getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import {
  aiGenerations,
  savedSentences,
  chunks,
  dialogueLines,
  dialogues,
  embeddings,
  intents,
  lineChunks,
  patternIntents,
  patternSlots,
  practiceAttempts,
  practiceItems,
  reviewHistory,
  sentencePatterns,
  situations,
  slotVariants,
  userChunks,
  userPreferences,
  users,
} from './index.js'

const PHASE1_TABLES = [
  users,
  userPreferences,
  situations,
  intents,
  sentencePatterns,
  patternIntents,
  patternSlots,
  slotVariants,
  chunks,
  dialogues,
  dialogueLines,
  lineChunks,
  aiGenerations,
  embeddings,
  practiceItems,
  practiceAttempts,
  userChunks,
  reviewHistory,
] as const

describe('Phase 1 schema inventory', () => {
  it('exports every documented Phase 1 core and supporting table', () => {
    const tableNames = PHASE1_TABLES.map((table) => getTableName(table))

    expect(tableNames).toEqual([
      'users',
      'user_preferences',
      'situations',
      'intents',
      'sentence_patterns',
      'pattern_intents',
      'pattern_slots',
      'slot_variants',
      'chunks',
      'dialogues',
      'dialogue_lines',
      'line_chunks',
      'ai_generations',
      'embeddings',
      'practice_items',
      'practice_attempts',
      'user_chunks',
      'review_history',
    ])
  })

  it('does not include deferred Phase 2 audio_assets or vocabulary tables', () => {
    const tableNames = PHASE1_TABLES.map((table) => getTableName(table))

    expect(tableNames).not.toContain('audio_assets')
    expect(tableNames).not.toContain('words')
    expect(tableNames).not.toContain('chunk_words')
  })
})

describe('ownership columns', () => {
  it('requires visibility on ownable entities', () => {
    expect(situations.visibility).toBeDefined()
    expect(sentencePatterns.visibility).toBeDefined()
    expect(chunks.visibility).toBeDefined()
    expect(dialogues.visibility).toBeDefined()
  })
})

describe('saved sentences', () => {
  it('is a learner-owned table, separate from catalog chunks', () => {
    expect(getTableName(savedSentences)).toBe('saved_sentences')
    expect(savedSentences.ownerId.name).toBe('owner_id')
    expect(savedSentences.text.name).toBe('text')
    expect(savedSentences.createdAt.name).toBe('created_at')
  })
})

describe('embeddings vector column', () => {
  it('defines a native pgvector column on embeddings', () => {
    expect(embeddings.vector).toBeDefined()
    expect(embeddings.vector.columnType).toBe('PgVector')
    expect(embeddings.vector.name).toBe('vector')
  })
})
