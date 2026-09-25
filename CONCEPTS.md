# Concepts

> Shared domain vocabulary for this project — entities, named processes, and status concepts with project-specific meaning. Seeded with core domain vocabulary, then accretes as ce-compound and ce-compound-refresh process learnings; direct edits are fine. Glossary only, not a spec or catch-all.

## Relationships

The data model stacks three layers: **User Data** (identity and preferences) sits under a **Content Knowledge Graph** (what can be spoken) and a **Learning Engine** (how recall is practiced and scheduled). AI generation reads from the graph and writes dialogues and provenance back into it.

## Content Knowledge Graph

### Content Knowledge Graph
The durable store of speakable material — situations, patterns, chunks, and dialogues — organized as a graph rather than flat vocabulary lists. Generation and practice both traverse this graph.

### Situation
A real-world context the learner needs to handle (for example, ordering at a restaurant). Situations anchor intents and generated dialogues.

### Intent
What the learner is trying to accomplish within a situation (for example, placing an order). Intents link to sentence patterns through many-to-many associations.

### Sentence Pattern
A reusable speaking frame with fixed structure and swappable slots — the unit between intent and chunk. Patterns carry difficulty, register, and meaning separate from any single surface form.

### Slot
A named, positional placeholder inside a sentence pattern that accepts variants. Slots are first-class data, not parsed text inside a template string.

### Chunk
A concrete speakable phrase or sentence derived from a pattern — what the learner rehearses and recalls. Chunks are the primary unit of spaced repetition.

### Dialogue
A multi-turn conversation script generated for a situation, composed of ordered lines. Dialogues connect back to chunks through line-level associations.

### Template vs Instance
Two roles for the same content tables: a **template** is curated and shared (`owner_id` unset); an **instance** is learner-specific and may reference the template it was derived from. Promotion from instance to template does not require a schema migration.

## Learning Engine

### Learning Engine
The practice and scheduling layer that measures recall, records attempts, and maintains per-learner FSRS state on chunks.

### Practice Item
A scheduled exercise that prompts the learner to produce a chunk in a specific mode (listen-repeat, cloze, slot swap, and similar).

### User Chunk
Per-learner FSRS state for a chunk — stability, difficulty, due dates, and status. Mutable scheduling source of truth; distinct from append-only review history.

### Review History
An append-only log of grading events for a user chunk. Feeds analytics and audit; does not replace FSRS state on the user chunk row.

### Practice Plan
The learner's spaced-repetition schedule surface: which chunks are due now, status breakdown across the deck, and how many reviews happened today. Backed by due-queue and plan-stats APIs rather than a separate schedule table.

### Review Rating
The learner's grade on a recall attempt, expressed as forgot, hard, good, or easy for the public API. Each rating drives FSRS interval updates when recorded; forgot is the learner-facing label for an again-grade at the scheduling boundary.

## Generation & Retrieval

### Embedding
A vector representation of a chunk, pattern, or situation used for near-duplicate detection before insert. Phase 1 fixes one model dimension contract for compatibility across the corpus.

### Dialogue Pack
The complete artifact produced by the dialog generator for one request — situation, dialogue with ordered lines, extracted chunks (each with its sentence pattern, slots, and variants), plus the minimized provenance traces for every pipeline step. When persistence is enabled (`DIALOGUE_PERSISTENCE_MODE` is `internal` or `ephemeral`), the pack is the unit written atomically after successful generation.

### AI Generation
A recorded AI pipeline step with inputs, outputs, validation verdict, and cost metadata. Provenance for generated dialogues and extracted chunks. All provenance rows from one generation request share a request identifier with the dialogue row so audit data can be correlated.
