# Product Strategy

Positioning, core loop, scope boundaries, and success metrics for OpenSen. This document controls **what we build and why**; [Database architecture](database-architecture.md) controls how the data supports it.

## Positioning

OpenSen is a **situational speaking-reflex system**. A learner picks a real situation they are about to face, generates sentences that fit their own life, drills the variations, and reviews until they can speak without translating in their head.

**Chunking is the mechanism, not the pitch.** Do not sell "memorize sentences". Sell the outcome:

- Travel and know exactly what to say
- Prepare for an interview in English
- Talk to a professor
- Call a customer
- Make small talk without freezing

One-line positioning:

> **OpenSen turns conversations you need into sentence patterns you can actually speak.**

Core message:

> **Learn fewer patterns. Say more things.**

Mnemonic: **Situation → Sentence → Slot → Speak.**

## Core loop

The product lives or dies on this loop:

1. Pick a situation
2. Describe what you want to say
3. AI generates a personalized dialogue
4. System extracts reusable chunks
5. Learner practices listen → repeat → transform
6. Spaced repetition returns each chunk at the right time
7. Learner uses it in real life
8. New situation captured, loop repeats

**Constraint:** if this loop does not feel interesting and produce a sense of progress within the first 3 minutes, no other feature matters.

## The moat: Personal Sentence Graph

Chunks must not exist in isolation. They link into a network of frames and interchangeable slots:

```text
Could you tell me more about...
    ├── your research
    ├── the program
    ├── the application process
    └── the project
```

A learner does not memorize 100 disconnected sentences. They own ~20 frames that generate hundreds of sentences.

Three things must be locked in, or the product is not worth building:

1. **Each person's real situations** — not a generic catalog
2. **Sentence frames with swappable slots** — not flat sentences
3. **Recall practice that produces speech** — not recognition-only flashcards

## MVP surfaces

### 1. Situation Builder

Learner specifies: situation, their own role, the other speaker, conversation goal, level, tone.

> Example: *"I'm a new student and want to introduce myself to a professor and ask about research directions in the lab."*

AI generates a dialogue of roughly 6–12 turns.

### 2. Chunk Extraction

The system automatically lifts reusable frames out of the dialogue, e.g. `I'm particularly interested in ...`, `Could you tell me more about ...?`, `I have some experience with ...`.

Every chunk carries: meaning, audio, example, pattern, swappable slots, usage situation, formality (register).

### 3. Substitution Drills

The feature that separates OpenSen from ordinary flashcards. Show variants, then remove the slot content and require the learner to fill it while keeping the frame:

```text
I'm particularly interested in robotics.
I'm particularly interested in generative AI.
→ I'm particularly interested in _____.
```

Recognition-only review produces learners who understand sentences but still cannot say them.

### 4. Recall Practice

Minimum four modes:

| Mode | What it trains |
|------|----------------|
| Listen and repeat | Prosody and articulation |
| See L1 → say L2 | Production under retrieval pressure |
| Fill the missing part | Frame stability |
| Change one component | Slot flexibility |

Detailed pronunciation scoring is **not** required initially — speech-to-text match rate is sufficient to start.

### 5. Review Queue

Spaced repetition operates **per chunk**, never per whole dialogue. Grading buttons stay simple: Forgot / Hard / Good / Easy. Use **FSRS**; do not hand-roll a scheduling algorithm.

### 6. Anki Export

Keeps switching costs low ("I am not locked into OpenSen"). Guard against it becoming the reason users export once and abandon the app.

## Non-goals

Explicitly cut from early scope — each one is attractive and each one would destroy MVP velocity:

- Social feed, leaderboards, heavy gamification, avatars
- Free-form AI chat companion
- Lesson marketplace, teacher system, complex course builder
- Grammar course, standalone dictionary
- Detailed accent scoring

## First-run experience

### Onboarding

Ask as little as possible. First screen:

> What do you want to speak English for?

Options: Travel · Work · Study abroad · Daily conversations · Dating and social life · Custom situation.

Then:

> What conversation do you need soon?

The learner types something like *"Meeting my professor for the first time."* They must receive their first practice set **within 30–60 seconds**.

### First session

1. Listen to the whole dialogue
2. Select 5 key chunks
3. Practice each chunk
4. Swap slots
5. Re-speak a mini-dialogue
6. Add to the review schedule

Do **not** make users create decks, folders, or tags up front. That is tool thinking, not learning thinking.

## AI pipeline

Never generate everything from a single prompt. Each step returns JSON against an explicit schema, and the backend — not the model — owns structural correctness.

```text
User intent
  ↓ situation normalization
  ↓ dialogue generation
  ↓ dialogue quality validation
  ↓ chunk extraction
  ↓ pattern and slot generation
  ↓ difficulty validation
  ↓ practice item generation
```

Validation gates must answer:

- Does this sound natural?
- Does it match the target level?
- Is it actually usable in that situation?
- Is the chunk too long?
- Is every slot substitution grammatical?
- Does this duplicate an existing chunk?

## Business model

Freemium, not one-time purchase.

| Tier | Includes |
|------|----------|
| **Free** | 3 situation packs, 30 active chunks, basic review, limited Anki export |
| **Pro** | Unlimited situations, AI personalization, voice practice, advanced review, progress analytics, full export |

Do not price by AI tokens — users do not care about tokens. They pay for: *"I have an important conversation coming up and I want to be ready."*

**Goal packs** are a stronger monetization path than a generic subscription: Job Interview Pack, Study Abroad Pack, Travel Pack, Sales English Pack, Professor Meeting Pack.

## North-star metric

> **Number of chunks a user recalls and successfully uses after 7 days.**

Proxy metrics: first practice completed · chunk recalled without hint · active review days · situations completed · user-reported real-world usage.

Vanity metrics such as "dialogues generated" will mislead the team. Do not optimize them.

## Roadmap

| Phase | Goal | Contents |
|-------|------|----------|
| **1** | Validate the learning loop | Situation input, dialogue generation, chunk extraction, flashcard review, basic SRS |
| **2** | Train speaking | Audio, shadowing, speech-to-text, substitution drills, mini role-play |
| **3** | Personal language graph | Reusable patterns, chunk deduplication, cross-situation reuse, mastery map |
| **4** | Distribution | Public situation templates, shareable packs, Anki import/export, coach tools |

## Landing copy

**Headline**

> Speak without translating in your head.

**Subheadline**

> OpenSen turns real-life situations into reusable sentence patterns you can remember, adapt, and speak automatically.

**Vietnamese**

> OpenSen giúp bạn biến các tình huống thật thành những mẫu câu có thể ghi nhớ, hoán đổi và bật ra tự nhiên mà không cần dịch từng từ trong đầu.

## Architecture direction

For a React PWA MVP, build a **modular monolith** — not microservices.

| Layer | Choice |
|-------|--------|
| Frontend | React / Next.js, PWA, IndexedDB for offline review, Web Speech API or an STT service |
| Backend | Node.js / TypeScript, PostgreSQL, optional Redis, object storage for generated audio |
| AI services | Dialogue generation, chunk extraction, slot generation, difficulty adaptation, feedback generation |

Modules: `auth` · `situations` · `dialogues` · `chunks` · `practice` · `reviews` · `audio` · `exports`.

See [Database architecture](database-architecture.md) for the schema that backs these modules.
