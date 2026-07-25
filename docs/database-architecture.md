# Database Architecture

OpenSen designs its data model as a **content knowledge graph + learning engine**, not as an ordinary CRUD app with `words`, `sentences`, `lessons`, and `users` stuffed together.

That flat layout blocks AI generation, adaptive learning, and spaced repetition later. The schema must reflect the product philosophy:

| Duolingo-style path | OpenSen path |
|---------------------|--------------|
| word → sentence → exercise | situation → intent → pattern → chunk → automatic speech |

DB must encode the OpenSen path. Three product commitments from [Product strategy](product-strategy.md) drive every schema decision below:

1. **Content is personal** — learners describe their own situations; the catalog is a starting point, not the product
2. **Slots are first-class** — a frame plus swappable slots is the unit that generates speech, so it must be queryable, not a string
3. **Practice is measured** — recall attempts, not just review grades, feed the north-star metric and personalization

## Layer stack

```
                 AI Layer
                    |
          Content Knowledge Graph
                    |
        Learning / Practice Engine
                    |
              User Data Layer
```

## 1. User Layer

Identity, goals, and preferences. Example: Nguyễn wants travel communication in 3 months.

### `users`

| Column | Role |
|--------|------|
| `id` | Primary key |
| `email` | Account identity |
| `name` | Display name |
| `native_language` | L1 |
| `target_language` | L2 (e.g. English) |
| `level` | Current proficiency |
| `created_at` | Account creation time |

### `user_preferences`

| Column | Role |
|--------|------|
| `user_id` | FK → `users` |
| `goal` | Learning goal (e.g. travel communication) |
| `daily_minutes` | Practice budget |
| `learning_style` | Preference for practice style |

## 2. Content Knowledge Graph (core)

OpenSen does **not** primarily learn “words”. Learners internalize:

**Situation → Intent → Sentence Pattern → Chunk → Variation**

Example: restaurant / ordering / `"I'd like to + X"` and its variations.

### Content ownership: template vs instance

Every content row is either a **template** (curated, shared, reusable across learners) or an **instance** (generated from one learner's own description). Both live in the same tables, distinguished by ownership columns, so a personal chunk can be promoted to a template without migration.

| Column | Applies to | Role |
|--------|-----------|------|
| `owner_id` | `situations`, `sentence_patterns`, `chunks`, `dialogues` | FK → `users`; `NULL` means curated/global template |
| `visibility` | same | `private` · `unlisted` · `public` |
| `source_template_id` | same | Self-FK to the template an instance was derived from |

Deduplication across learners is a **pipeline** responsibility, not a constraint: the chunk-extraction step queries `embeddings` for near-identical chunks before inserting, and links to the existing row instead. Without this, thousands of learners generate thousands of copies of `I'd like to ...`.

### `situations`

| Column | Role |
|--------|------|
| `id` | Primary key |
| `name` | Situation label (e.g. restaurant) |
| `description` | What the situation covers |
| `category` | Grouping for coverage |
| `role_self` | Learner's role in the conversation (e.g. new student) |
| `role_other` | Other speaker (e.g. professor) |
| `goal` | What the conversation should achieve |
| `tone` | Requested tone |
| `owner_id`, `visibility`, `source_template_id` | Ownership (see above) |

The role/goal/tone columns capture Situation Builder input so a generated dialogue can be regenerated or audited later.

### `intents`

Communicative function (e.g. `ask_for_information`, `ordering`). Intents are **reusable tags**, not a rigid tree level — the same intent recurs across many situations.

| Column | Role |
|--------|------|
| `id` | Primary key |
| `name` | Intent key (e.g. `ask_for_information`) |
| `description` | What the intent does |

### `sentence_patterns`

Core of the chunking model: a reusable frame with named slots.

| Column | Role |
|--------|------|
| `id` | Primary key |
| `template` | Frame with named slots (e.g. `Could you tell me more about {topic}?`) |
| `meaning` | What the pattern expresses |
| `difficulty` | Relative difficulty |
| `level` | CEFR target (e.g. B1) |
| `register` | `casual` · `neutral` · `polite` · `formal` |
| `owner_id`, `visibility`, `source_template_id` | Ownership |

### `pattern_intents`

Many-to-many: a pattern serves several intents across several situations.

| Column | Role |
|--------|------|
| `pattern_id` | FK → `sentence_patterns` |
| `intent_id` | FK → `intents` |
| `situation_id` | FK → `situations`; optional, records where this pairing was observed |

`Could you tell me more about {topic}?` is used in interviews, professor meetings, and sales calls. A one-pattern-to-one-situation foreign key would make Phase 3 cross-situation reuse a migration instead of a query.

### `pattern_slots`

Named substitution points inside a frame. **This is the moat in schema form** — substitution drills are impossible if slots are only a substring of `template`.

| Column | Role |
|--------|------|
| `id` | Primary key |
| `pattern_id` | FK → `sentence_patterns` |
| `name` | Slot key (e.g. `topic`) |
| `position` | Order within the frame |
| `expected_pos` | Grammatical category a fill must satisfy (noun phrase, gerund, …) |

### `slot_variants`

Candidate fills for a slot; the source of drill items and of "learn fewer patterns, say more things".

| Column | Role |
|--------|------|
| `id` | Primary key |
| `slot_id` | FK → `pattern_slots` |
| `text` | Fill text (e.g. `your research`) |
| `meaning` | Gloss |
| `level` | Difficulty of this specific fill |
| `is_validated` | Whether the grammaticality gate passed |

### `chunks`

Memorization unit: a concrete, speakable surface form. A chunk optionally instantiates a pattern.

| Column | Role |
|--------|------|
| `id` | Primary key |
| `text` | Chunk surface form |
| `type` | Chunk kind (e.g. functional phrase, full sentence) |
| `meaning` | Gloss / sense |
| `pronunciation` | Pronunciation guidance |
| `pattern_id` | FK → `sentence_patterns`; the frame this chunk instantiates |
| `level` | CEFR level |
| `register` | Formality — decides whether it fits a professor or a friend |
| `audio_asset_id` | FK → `audio_assets`; required for shadowing |
| `owner_id`, `visibility`, `source_template_id` | Ownership |

`level` and `register` sit on the chunk, not only on the pattern, because the same frame produces both `Could you tell me more about the project?` and a far more formal variant.

**Resolved ambiguity:** an earlier draft also carried `pattern_chunks(pattern_id, chunk_id, position)`, treating a pattern as a *sequence of chunks* while `template` already held the frame. That left `"I'd like to order pizza"` undefined — chunk or pattern instance? The model above resolves it: the pattern owns the frame and its slots; the chunk is a speakable instance pointing back via `pattern_id`. `pattern_chunks` is superseded by `chunks.pattern_id` + `pattern_slots` + `slot_variants`.

## 3. Vocabulary Layer (under chunks)

Words support chunks; they are **not** the primary learning unit.

### `words`

| Column | Role |
|--------|------|
| `id` | Primary key |
| `word` | Surface form |
| `lemma` | Base form |
| `pos` | Part of speech |
| `meaning` | Gloss |
| `ipa` | Phonetic transcription |

### `chunk_words`

| Column | Role |
|--------|------|
| `chunk_id` | FK → `chunks` |
| `word_id` | FK → `words` |

**Scope note:** [Product strategy](product-strategy.md) lists a standalone dictionary as a non-goal, and nothing in the Phase 1 loop reads `lemma`, `pos`, or `ipa`. These two tables are retained deliberately, but they can be deferred to a later phase without affecting any other table — nothing depends on them.

## 4. AI Generation Layer

Generated dialogues reference situations and link lines back to chunks so generation stays graph-aware.

### `dialogues`

| Column | Role |
|--------|------|
| `id` | Primary key |
| `situation_id` | FK → `situations` |
| `title` | Dialogue title |
| `level` | Target level |
| `created_by` | Generator / author attribution |
| `owner_id`, `visibility`, `source_template_id` | Ownership |

### `dialogue_lines`

Turns of a dialogue, in order.

| Column | Role |
|--------|------|
| `id` | Primary key |
| `dialogue_id` | FK → `dialogues` |
| `position` | Turn order |
| `speaker` | Speaker role |
| `text` | Line text |
| `audio_asset_id` | FK → `audio_assets` |

### `line_chunks`

| Column | Role |
|--------|------|
| `line_id` | FK → `dialogue_lines` |
| `chunk_id` | FK → `chunks` |

AI knows which chunks a line uses.

### `audio_assets`

Audio is an entity, not a URL column: the same chunk audio is reused across dialogues, drills, and exports.

| Column | Role |
|--------|------|
| `id` | Primary key |
| `storage_key` | Object-storage path |
| `voice` | TTS voice or speaker identity |
| `duration_ms` | Length |
| `text_hash` | Hash of the spoken text, for reuse and cache hits |
| `created_at` | Generation time |

### `ai_generations`

Provenance for the **multi-step** pipeline (situation normalization → dialogue generation → quality validation → chunk extraction → pattern/slot generation → difficulty validation → practice item generation). One row per *step*, not per request, so a failed validation gate is inspectable.

| Column | Role |
|--------|------|
| `id` | Primary key |
| `request_id` | Groups all steps of one user-triggered generation |
| `step` | Pipeline stage name |
| `model` | Model identifier |
| `prompt_version` | Prompt revision |
| `schema_version` | Expected output schema revision |
| `input` | Step input (JSON) |
| `output` | Step output (JSON) |
| `validation_verdict` | `pass` · `fail` · `retried`, plus reason |
| `cost`, `latency_ms` | Operational metrics |

The model generates content; the backend owns structure. Storing whole AI responses as an opaque blob defeats search, reuse, and every validation gate.

### `embeddings`

Vector storage (pgvector) for semantic retrieval and, critically, **chunk deduplication** during extraction.

| Column | Role |
|--------|------|
| `id` | Primary key |
| `entity_type` | `chunk` · `pattern` · `situation` |
| `entity_id` | Target row |
| `vector` | Embedding |
| `model` | Embedding model version |

## 5. Learning / Practice Engine (monetization surface)

Spaced repetition operates **per chunk**, never per dialogue.

### `practice_items`

A concrete exercise generated from a chunk or slot. Recognition-only review produces learners who understand but cannot speak, so the item type must be explicit.

| Column | Role |
|--------|------|
| `id` | Primary key |
| `chunk_id` | FK → `chunks` |
| `slot_id` | FK → `pattern_slots`; set for substitution drills |
| `mode` | `listen_repeat` · `l1_to_l2` · `cloze` · `slot_swap` |
| `prompt` | What the learner is shown or hears |
| `expected` | Target answer |
| `audio_asset_id` | FK → `audio_assets` |

### `practice_attempts`

What the learner actually produced. This table, not `review_history`, is what makes the north-star metric and `user_language_profile` computable.

| Column | Role |
|--------|------|
| `id` | Primary key |
| `user_id` | FK → `users` |
| `practice_item_id` | FK → `practice_items` |
| `transcript` | Speech-to-text output or typed answer |
| `match_score` | Similarity to `expected` |
| `used_hint` | Whether a hint was shown — required for "recalled without hint" |
| `attempted_at` | Timestamp |

### `user_chunks`

Per-learner scheduling state. Uses **FSRS** — do not hand-roll a scheduler.

| Column | Role |
|--------|------|
| `user_id` | FK → `users` |
| `chunk_id` | FK → `chunks` |
| `status` | `new` · `learning` · `review` · `relearning` |
| `stability` | FSRS memory stability |
| `difficulty` | FSRS item difficulty |
| `reps` | Successful repetitions |
| `lapses` | Times forgotten |
| `last_review` | Previous review time |
| `next_review` | Next due time |
| `updated_at` | Sync/conflict resolution |

Superseding SM-2: the earlier `ease_factor` + `interval` pair cannot represent FSRS state. Interval is **derived** from `stability` and target retention at scheduling time rather than stored as the source of truth.

### `review_history`

Immutable review log. FSRS requires elapsed-time context, not just the grade.

| Column | Role |
|--------|------|
| `user_id` | FK → `users` |
| `chunk_id` | FK → `chunks` |
| `rating` | Forgot / Hard / Good / Easy |
| `elapsed_days` | Actual days since previous review |
| `scheduled_days` | Interval the scheduler had planned |
| `state_before` | Status at review time |
| `practice_attempt_id` | FK → `practice_attempts`; links the grade to what was said |
| `review_time` | When the review happened |

Keep this append-only: it is the training data for any future scheduler tuning.

## 6. AI Memory

### `user_language_profile`

Personalization state for adaptive generation and practice, derived from `practice_attempts` and `review_history` rather than hand-maintained.

| Column | Role |
|--------|------|
| `user_id` | FK → `users` |
| `common_errors` | Recurring error patterns |
| `known_chunks` | Chunks the learner already owns |
| `weak_topics` | Topics needing more practice |
| `recomputed_at` | Last derivation time |

## 7. Delivery and commerce (later phases)

| Table | Role | Phase |
|-------|------|-------|
| `export_jobs` | Anki export runs: `user_id`, `scope`, `status`, `file_key`, `requested_at` | 2 |
| `packs` | Goal packs (Job Interview, Travel, …): bundles of situations/patterns | 4 |
| `pack_items` | Membership join for `packs` | 4 |
| `entitlements` | Plan, limits (active-chunk cap, situation cap), and period per user | when Pro launches |

Free-tier limits ("30 active chunks", "3 situation packs") are enforceable only if entitlement state is stored; do not infer plan limits from counts scattered across tables.

## Offline and sync

The PWA reviews offline via IndexedDB, so learner-mutable tables (`user_chunks`, `review_history`, `practice_attempts`) must tolerate deferred writes:

- Client-generatable ids (UUID) so attempts created offline never collide
- `updated_at` on mutable rows; append-only log tables merge by union rather than by overwrite
- Conflict rule for `user_chunks`: replay the review log in timestamp order and recompute state, rather than last-write-wins

## Tech choice

| Choice | Guidance |
|--------|----------|
| **MVP store** | PostgreSQL + **pgvector** — relational model, graph-like joins, semantic search |
| **Embeddings** | Store embeddings on **chunks** (and related content as needed) |
| **Neo4j** | **Not for MVP** — premature until ~1M chunks, complex recommendation, or heavy graph traversal; Postgres join graph is enough |
| **Scheduler** | **FSRS** library; the DB stores its state, the app does not invent one |

## Table inventory

The original "~12 core tables" target no longer holds: making slots and practice attempts first-class is what separates OpenSen from a flashcard app, and that costs tables. Realistic Phase 1 is ~14 core plus supporting joins.

**Phase 1 core**

1. `users`
2. `situations`
3. `sentence_patterns`
4. `pattern_slots`
5. `slot_variants`
6. `chunks`
7. `dialogues`
8. `dialogue_lines`
9. `line_chunks`
10. `practice_items`
11. `practice_attempts`
12. `user_chunks`
13. `review_history`
14. `ai_generations`

**Phase 1 supporting:** `user_preferences`, `intents`, `pattern_intents`, `embeddings` (needed for dedup), `words`, `chunk_words`

**Later:** `audio_assets` (Phase 2, with shadowing), `export_jobs` (Phase 2), `user_language_profile` (Phase 3), `packs` / `pack_items` / `entitlements` (Phase 4 / Pro launch)

## Design rules

- Prefer **graph-shaped content** (situation → intent → pattern → chunk) over lesson-CRUD tables
- Model **slots as rows**, never as substrings to parse at runtime
- Keep **vocabulary under chunks**, not above them
- Tag content with **`owner_id` + `visibility`** so personal and curated material share one schema
- Relate patterns to intents/situations **many-to-many** to keep cross-situation reuse cheap
- Record **what the learner produced** (`practice_attempts`), not only how they graded themselves
- Store **FSRS state**; derive intervals, never store them as truth
- Tie AI outputs to **chunks and situations** via `line_chunks` / `situation_id`, one `ai_generations` row per pipeline step
- Stay on **Postgres + pgvector** until traversal/recommendation complexity forces a dedicated graph DB

See [Product strategy](product-strategy.md) for positioning, core loop, and roadmap; [Product overview](product.md) for the learning model; [Features](features.md) for the product surfaces this schema supports.
