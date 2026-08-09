---
title: Persist Generated Dialogue Pack to PostgreSQL After AI Generation
date: 2026-08-09
category: architecture-patterns
module: backend
problem_type: architecture_pattern
component: database
severity: high
applies_when:
  - Persisting AI-generated content graphs atomically after a successful generation endpoint call
  - Bridging AI pipeline output to PostgreSQL without coupling routes to provider or ORM internals
  - Writing multi-table relational graphs (situation, dialogue, patterns, slots, chunks, provenance) in one request
  - Supporting both postgres.js transactions and Neon HTTP batch for all-or-nothing writes
  - Gating persistence behind environment flags until authenticated ownership is available
tags:
  - dialogue-pack
  - persistence
  - postgresql
  - ai-provenance
  - drizzle
  - content-graph
  - backend
  - atomic-writes
---

# Persist Generated Dialogue Pack to PostgreSQL After AI Generation

## Context

Before [KEI-138](https://linear.app/keios/issue/KEI-138/backend-luu-tru-du-lieu-dialogue-pack-sau-khi-goi-ai-generator-post), `POST /api/dialogues/generate` ran the AI pipeline and returned JSON directly. Generated situations, dialogues, chunks, and pattern graphs existed only in the HTTP response — no durable record in PostgreSQL and no audit trail of which model, prompt version, and schema version produced each step.

[KEI-141](https://linear.app/keios/issue/KEI-141/backend-thiet-lap-schema-postgresql-phase-1-va-drizzle-orm-migration) established the Phase 1 schema boundary ([`postgres-drizzle-phase1-neon-pgvector.md`](postgres-drizzle-phase1-neon-pgvector.md)); KEI-138 shipped the first writer that populates it from AI output ([PR #10](https://github.com/KeiosStarqua/opensen/pull/10)).

The fix introduces three layers:

1. **Neutral DTO** (`GeneratedPack`) — persistence-ready shape decoupled from AI pipeline schemas and Drizzle row types.
2. **Pipeline provenance** (`PipelineTrace`) — minimized, allowlisted input/output per step with stable version constants.
3. **Atomic writer** (`DialoguePackWriter`) — maps the DTO to content-graph rows and inserts them in one transaction or Neon HTTP batch.

```text
POST /api/dialogues/generate
  → generateDialoguePack()          // AI pipeline → pack + traces
  → isDialoguePersistenceAllowed(env)?
       yes → DialoguePackWriter.persist(pack, traces)
       no  → skip
  → 201 JSON { situation, dialogue, chunks, meta, persistence? }
```

## Guidance

### Keep AI output and DB writes decoupled via `GeneratedPack`

The `GeneratedPack` type is a Zod-validated DTO mirroring the content graph without importing Drizzle or AI provider types:

```88:94:backend/src/dialogue-packs/generated-pack.ts
export const generatedPackSchema = z.object({
  situation: generatedPackSituationSchema,
  dialogue: generatedPackDialogueSchema,
  chunks: z.array(generatedPackChunkSchema).min(3),
})

export type GeneratedPack = z.infer<typeof generatedPackSchema>
```

`buildGeneratedPack()` maps AI pipeline outputs into this neutral shape once; routes and writers never import AI schemas:

```224:243:backend/src/dialogue-packs/generated-pack.ts
export function buildGeneratedPack(
  request: GenerateDialogueRequest,
  normalized: z.infer<typeof normalizedSituationSchema>,
  dialogue: z.infer<typeof generatedDialogueSchema>,
  extractedChunks: Array<z.infer<typeof extractedChunkSchema>>,
): GeneratedPack {
  const level = request.level
  const pack = generatedPackSchema.parse({
    situation: mapSituation(normalized),
    dialogue: {
      title: dialogue.title,
      level: normalized.level,
      createdBy: 'ai_generator',
      lines: mapDialogueLines(dialogue.lines),
    },
    chunks: extractedChunks.map((chunk) => mapChunk(chunk, level)),
  })

  return pack
}
```

### Capture provenance with allowlisted `PipelineTrace` rows

Stable prompt and schema version identifiers live beside the DTO:

```11:23:backend/src/dialogue-packs/generated-pack.ts
/** Stable prompt revision identifiers — maintained beside pipeline contracts. */
export const PROMPT_VERSIONS = {
  situation_normalization: 'situation_normalization/v1',
  dialogue_generation: 'dialogue_generation/v1',
  chunk_extraction: 'chunk_extraction/v1',
} as const

/** Stable schema revision identifiers for provenance rows. */
export const SCHEMA_VERSIONS = {
  situation_normalization: 'normalized_situation/v1',
  dialogue_generation: 'generated_dialogue/v1',
  chunk_extraction: 'extracted_chunks/v1',
} as const
```

`buildPipelineTraces()` constructs one trace per step using allowlist helpers — only safe fields are stored, not full raw prompts. The pipeline wires pack and traces at the end of generation:

```151:176:backend/src/ai/pipeline/generate-dialogue.ts
  const pack = buildGeneratedPack(
    input,
    normalized.data,
    dialogue.data,
    chunks.data.chunks,
  )
  const traces = buildPipelineTraces(
    input,
    normalized.data,
    dialogue.data,
    chunks.data.chunks,
    models,
  )

  return {
    situation: normalized.data,
    dialogue: dialogue.data,
    chunks: chunks.data.chunks,
    meta: {
      provider: provider.id,
      model: provider.model,
      steps,
    },
    pack,
    traces,
  }
```

### Persist atomically with `DialoguePackWriter`

The writer allocates UUIDs up front, maps the DTO to rows across `situations`, `sentence_patterns`, `pattern_slots`, `slot_variants`, `chunks`, `dialogues`, `dialogue_lines`, and `ai_generations`, then inserts in FK-safe order.

**postgres.js (local):** Drizzle `transaction`.

```176:189:backend/src/db/dialogue-pack-writer.ts
  await database.transaction(async (tx) => {
    await tx.insert(situations).values(rows.situationRow)
    await tx.insert(sentencePatterns).values(rows.patternRows)
    if (rows.slotRows.length > 0) {
      await tx.insert(patternSlots).values(rows.slotRows)
    }
    if (rows.variantRows.length > 0) {
      await tx.insert(slotVariants).values(rows.variantRows)
    }
    await tx.insert(chunks).values(rows.chunkRows)
    await tx.insert(dialogues).values(rows.dialogueRow)
    await tx.insert(dialogueLines).values(rows.lineRows)
    await tx.insert(aiGenerations).values(rows.generationRows)
  })
```

**Neon HTTP (hosted):** Drizzle `batch` — same insert order, driver-specific atomic boundary per the [implementation plan](../../plans/2026-08-09-002-feat-persist-generated-dialogue-pack-plan.md) (KTD4).

```240:251:backend/src/db/dialogue-pack-writer.ts
export function createDialoguePackWriter(
  database: Database,
  databaseUrl: string,
): DialoguePackWriter {
  const useBatch = isNeonHostedDatabaseUrl(databaseUrl)

  return {
    persist: (pack, traces, requestId) =>
      useBatch
        ? persistWithBatch(database, pack, traces, requestId)
        : persistWithTransaction(database, pack, traces, requestId),
  }
}
```

The writer returns a `PersistenceProjection` with `requestId`, `situationId`, `dialogueId`, and source-order-aligned `chunkIds`.

### Compose the route with injectable deps and env-gated persistence

`createDialoguesRouter(deps)` accepts overrides for env loading, provider creation, pack generation, database access, and writer creation — enabling unit tests without a live DB.

Persistence runs only after successful AI generation and only when `isDialoguePersistenceAllowed(env)` is true:

```73:94:backend/src/routes/dialogues.ts
    const env = resolveEnv()
    const provider = resolveProvider(env)
    const result = await resolveGeneratePack(provider, parsed.data)

    let persistence: PersistenceProjection | undefined
    if (isDialoguePersistenceAllowed(env)) {
      const { DATABASE_URL } = resolveLoadDatabaseEnv()
      const database = resolveGetDatabase()
      const writer = resolveCreateWriter(database, DATABASE_URL)
      persistence = await writer.persist(result.pack, result.traces)
    }

    return c.json(
      {
        situation: result.situation,
        dialogue: result.dialogue,
        chunks: result.chunks,
        meta: result.meta,
        ...(persistence ? { persistence } : {}),
      },
      201,
    )
```

### Gate persistence with `DIALOGUE_PERSISTENCE_MODE`

Default is `disabled`; only `internal` and `ephemeral` enable writes. When disabled, the route never calls `loadDatabaseEnv()` or `getDatabase()`, so AI-only deployments do not require `DATABASE_URL` at request time.

```109:114:backend/src/lib/env.ts
export function isDialoguePersistenceAllowed(env: Env): boolean {
  return (
    env.DIALOGUE_PERSISTENCE_MODE === 'internal' ||
    env.DIALOGUE_PERSISTENCE_MODE === 'ephemeral'
  )
}
```

Production enablement still requires trusted ownership, approved minimization, retention/deletion policy, and request-bundle erasure — see the plan's rollout gates.

## Why This Matters

1. **Durability** — Generated content becomes queryable via the content graph instead of being discarded after each request.
2. **Provenance** — Each AI step is recorded in `ai_generations` with model id, prompt/schema versions, and allowlisted I/O; the dialogue row and all provenance rows for one request share a `requestId`.
3. **Testability** — The DTO boundary lets you unit-test pack mapping, trace construction, and the writer without calling OpenRouter.
4. **Atomicity** — Partial inserts would corrupt the graph; transaction/batch ensures all-or-nothing persistence.
5. **Safe rollout** — Default `disabled` preserves pre-KEI-138 stateless behavior until operators explicitly opt in.

## When to Apply

Use this pattern when:

- An AI pipeline produces structured domain data that must land in PostgreSQL.
- You need provenance rows separate from the content graph.
- The same generation result must be returned to the client and stored durably.
- Deployment environments differ: some need DB writes (`internal`/`ephemeral`), others stay stateless (`disabled`).

Do **not** bypass the DTO and write AI schemas directly to Drizzle from the route — that couples pipeline evolution to migration churn and breaks the allowlisted provenance contract.

Extend by:

- Adding pipeline steps → update `PIPELINE_STEPS`, version constants, and `buildPipelineTraces`.
- Adding content-graph tables → extend `buildRows` and insert order (respect FK order).
- Adding authenticated ownership → set `createdBy` from the session instead of the hardcoded `'ai_generator'`.

## Examples

### Before (stateless)

```typescript
// Pre-KEI-138: no DB call — response is the only copy
const { situation, dialogue, chunks, meta } = await generateDialoguePack(provider, parsed.data)
return c.json({ situation, dialogue, chunks, meta }, 201)
```

### After (KEI-138)

With `DIALOGUE_PERSISTENCE_MODE=internal`, the response adds an optional `persistence` object:

```json
{
  "situation": { "...": "normalized AI shape" },
  "dialogue": { "...": "generated dialogue" },
  "chunks": [ "..." ],
  "meta": { "provider": "openrouter", "model": "...", "steps": [{ "step": "situation_normalization", "model": "..." }] },
  "persistence": {
    "requestId": "<uuid>",
    "situationId": "...",
    "dialogueId": "...",
    "chunkIds": [ "...", "...", "..." ]
  }
}
```

With persistence disabled (default): same body minus `persistence`; no `DATABASE_URL` required.

### Writer usage in tests

```typescript
const writer = createDialoguePackWriter(database, 'postgresql://localhost/opensen_test')
const projection = await writer.persist(mockPack, mockTraces, 'fixed-request-id')
expect(projection.chunkIds).toHaveLength(mockPack.chunks.length)
```

## Related

- [KEI-138](https://linear.app/keios/issue/KEI-138/backend-luu-tru-du-lieu-dialogue-pack-sau-khi-goi-ai-generator-post) — implementation issue
- [PR #10](https://github.com/KeiosStarqua/opensen/pull/10) — merged implementation
- [`postgres-drizzle-phase1-neon-pgvector.md`](postgres-drizzle-phase1-neon-pgvector.md) — Phase 1 schema and driver boundary (prerequisite)
- [`database-architecture.md`](../../database-architecture.md) — content graph and provenance authority
- [`2026-08-09-002-feat-persist-generated-dialogue-pack-plan.md`](../../plans/2026-08-09-002-feat-persist-generated-dialogue-pack-plan.md) — implementation plan
