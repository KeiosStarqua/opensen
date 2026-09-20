# Mobile UI/UX Design

Design contract for the OpenSen mobile client ([`mobile/`](../mobile/)). Covers UX architecture, design system, screen specifications, and the Flutter implementation blueprint. Grounded in the offline-first v1 architecture (bundled content, SQLite, FSRS-5, on-device TTS) and the product contracts in [`product-strategy.md`](product-strategy.md), [`product.md`](product.md), and [`features.md`](features.md).

Status: **target design for v1**. Where the current implementation already matches, the spec confirms it; where it diverges, this document is the target and the delta is noted.

Implemented so far (P0): design tokens (§4.1–§4.4 in `core/theme/app_tokens.dart`), recall components (`SessionHeader`, `GradingBar`, `SlotBlankText`), Today tab (§5.2), navigation restructure (§3 — tab 4 is still labelled **Plan**; the Progress rename lands with the P2 coverage/goal scope), recall session restyle (§5.4–§5.5). The `/practice` lobby (§5.3) is not built yet; Start Practice goes straight to the session.

---

## 1. Product assumptions and UX strategy

### 1.1 Assumptions

- v1 is **fully offline**: content ships as a bundled seed graph; audio is on-device TTS; no accounts, no sync, no network permission required.
- The learner's first language (L1) is available for prompts and meanings; the target language (L2) is English in v1 content, but all layouts must survive other scripts and 30–40% text expansion.
- Sessions are short and frequent: 3–10 minutes, 1–3 times per day. Every design decision is optimized for **resume speed**, not session depth.
- The differentiator is **production practice on frames with slots** (substitution drills + recall), not content volume. If a screen could belong to any flashcard app, it is designed wrong.

### 1.2 Personas

| Persona | Context | Core need | Design consequence |
|---------|---------|-----------|--------------------|
| **Mai — the preparer** (primary) | Has a concrete event in 1–4 weeks (job interview, professor meeting, trip) | "Teach me what to say in *that* conversation" | Situation-first entry; dialogue built from her scenario; chunks extracted for her |
| **Jon — the maintainer** | Already speaks some English; wants to stop freezing | Daily retrieval habit, fill gaps | Fast session start, honest due counts, gentle streaks |
| **An — the beginner** | Low vocabulary, intimidated by grammar terms | Small wins, audio-first, no jargon | Listen→repeat mode first, L1 support, plain labels ("Practice", not "SRS") |

Anti-persona: the gamification collector (streaks/badges as the goal). We deliberately do not serve this motivation; it corrupts the learning loop.

### 1.3 Jobs to be done

1. "I have a conversation coming up — build me material for it." → Situations → Dialog Builder
2. "I have 5 minutes — tell me exactly what to review." → Today → Start Practice
3. "I keep forgetting this phrase — lock it in." → Chunk detail → Practice this chunk
4. "I want to say it my way, not just repeat it." → Substitution drill on the frame
5. "Show me whether I'm actually getting better." → Progress / Coverage
6. "I already use Anki — don't lock me in." → Export

### 1.4 Core user journey

```text
Onboarding (goal → first situation)          ≤60s to first practice set
   ↓
Dialogue generated for their situation
   ↓ listen → pick chunks → practice → schedule
Today (daily): due queue → recall session → graded → rescheduled (FSRS)
   ↓                                     ↑
Library grows ← drills deepen frames ←──┘
   ↓
Progress/Coverage shows situation mastery → recommends next situation
```

The loop must produce a felt sense of progress within the first 3 minutes (strategy constraint). UI implication: onboarding ends *inside* a practice session, not at a dashboard.

### 1.5 UX strategy principles

1. **One sentence in focus.** Any screen whose job is learning shows exactly one chunk/sentence as the visual protagonist. Lists are for management, not learning.
2. **Retrieval before reveal.** The answer is never visible without an explicit learner action (tap "Show answer", speak, or type). This is the product's core mechanic and is enforced structurally (two-state practice screen), not by convention.
3. **Frames are visible objects.** Slots are rendered inline (`I'm particularly interested in ___`) everywhere a chunk appears — library rows, dialogue breakdowns, drills — so the "pattern with swappable slots" idea is learned passively.
4. **Every chunk has a next action.** Listen, Practice, Drill, or Add to plan. No dead-end content screens.
5. **Calm progress.** Progress is shown as coverage and mastery, not points. Streaks exist but never punish (no "streak lost" interstitials, no red badges).
6. **Few taps to practice.** From cold start to answering the first recall item: ≤3 taps (Open app → Start Practice → first prompt).

### 1.6 MVP vs future

| MVP (v1, offline) | Future (post-v1) |
|---|---|
| Today dashboard, recall session (4 modes), grading | Accounts, cloud sync |
| Situations catalog + Dialog Builder (template/seed-based) | AI-generated dialogues from free text (backend) |
| Chunk Library + chunk detail + custom chunks | Speech-to-text speaking feedback (match rate) |
| Substitution drills | Pronunciation scoring |
| Practice Plan (FSRS), streak, weekly goal | Social/shared packs, coach tools |
| Situation Coverage map | Cross-situation personal sentence graph visualization |
| Anki export (.txt via share sheet) | Anki import, AnkiWeb sync |
| Light/dark theme, accessibility baseline | |

---

## 2. Information architecture

Domain objects (from `lib/domain/entities/`) and how the learner meets them:

```text
Situation ──1:n── Dialogue ──n:n── Chunk ──n:1── SentencePattern (frame + slots)
   │                                  │
   │                                  └── 1:1 UserChunk (learning state: FSRS)  [created on enrolment]
   └── Coverage = share of a situation's chunks the learner has enrolled + mastered
```

- **Situation** — a real-world scenario (catalog from seed; custom in future). Entry point for creation.
- **Dialogue** — a generated/composed conversation inside a situation; the *context carrier*. Never scheduled as a whole.
- **Chunk** — the durable learning unit (sentence or phrase). Carries meaning, example, register, audio (TTS text).
- **SentencePattern** — a frame with typed slots; many chunks instantiate one pattern. The reuse engine.
- **UserChunk** — the learner's relationship to a chunk: enrolment in the plan, FSRS state, next review.
- **Practice item** — ephemeral: generated per session from due/enrolled chunks (recall, fill-blank, listen-repeat, transform).

Screen tree (routes from `core/routing/app_routes.dart`, target state):

```text
/onboarding                      first run only
/today                           TAB 1 — dashboard, Start Practice
/library                         TAB 2 — chunks + patterns
/situations                      TAB 3 — catalog + coverage entry + New situation
/progress                        TAB 4 — plan, streak, forecast, coverage entry

Root-level (cover bottom bar):
/practice                        session lobby (queue preview, mode picker)
/practice/session                immersive recall session (prompt → reveal → grade)
/situations/:id                  situation detail (dialogues, chunks, coverage)
/situations/:id/build            Dialog Builder
/situations/coverage             Situation Coverage map
/dialogues/:id                   dialogue detail + chunk breakdown
/chunks/:id                      chunk detail
/chunks/new                      custom chunk editor   (declared before /chunks/:id)
/drills/:patternId               substitution drill session
/export                          Anki export
/settings                        profile & settings
```

---

## 3. Navigation proposal

**Decision: 4 tabs — Today · Library · Situations · Progress. Practice, Settings, and Export are deliberately not tabs.**

```text
┌─────────────────────────────────────────┐
│  Today        Library    Situations  Progress │
└─────────────────────────────────────────┘
```

| Tab | Job | Why it earns a tab |
|-----|-----|--------------------|
| **Today** | Answer "what now?" in <2s; Start Practice CTA; due count; continue; recent | The daily re-entry point; highest frequency |
| **Library** | Find, filter, organize chunks/patterns; bulk export | The learner's growing asset; browsed between sessions |
| **Situations** | Pick a scenario, build a dialogue, see coverage per situation | The creation entry; the product's differentiator |
| **Progress** | Plan, streak, review forecast, coverage map | Weekly-frequency reflection; keeps Today uncluttered |

**Why Practice is not a tab:** practice is an *activity*, not a location. It is launchable from Today (primary), chunk detail, pattern drills, and the plan. A Practice tab trains users to think "go to the practice place"; we want "practice the thing in front of you". The session itself is a root-level immersive route that hides the bottom bar — full attention on one sentence. (Current implementation has a Practice tab; its `practice_home_screen` content folds into Today, and the route `/practice` becomes the lobby.)

**Why Settings is not a tab:** it is monthly-frequency. A gear icon on Today's app bar (standard iOS/Android pattern) costs one tap and frees the bar for daily loops.

**Why not 5 tabs:** every added tab raises the orientation cost of the bar and invites a junk drawer. Five destinations measurably slow tab selection (Hick's law) and signal feature-count thinking, which this product explicitly rejects.

**Trade-off accepted:** Situations (creation) sits right of Library even though the core loop starts there — because *daily returning* behavior is review-first. New users are funneled to Situations by onboarding and by Today's empty state, so the tab order costs nothing after day one.

Implementation: `StatefulShellRoute.indexedStack` (existing) preserves per-tab navigation stacks; detail routes live on the root navigator so sessions and details cover the bottom bar.

---

## 4. Design system

Material 3 foundation, one brand seed, semantic tokens layered on `ColorScheme`. Implementation stays in `core/theme/app_theme.dart` as static token classes + `ColorScheme` roles (per `mobile/AGENTS.md`: no new `ThemeExtension`s).

### 4.1 Color

Brand seed: **teal `#0F766E`** (existing `AppTheme.seed`). Rationale: calm, competent, neither playful-purple (Duolingo territory) nor corporate blue; excellent contrast range in both themes.

**Semantic learning-state tokens** (the vocabulary of the whole app):

| Token | Meaning | Light | Dark |
|-------|---------|-------|------|
| `stateNew` | Never practiced | `#2563EB` (blue) | `#93C5FD` |
| `stateLearning` | In FSRS learning steps | `#B45309` (amber) | `#FCD34D` |
| `stateReview` | Scheduled / due | `#0F766E` (brand) | `#5EEAD4` |
| `stateMastered` | Stability ≥ 21d | `#15803D` (green) | `#86EFAC` |
| `stateLapsed` | Forgot, back in relearning | `#B91C1C` (red) | `#FCA5A5` |

**Grading scale** (maps to FSRS ratings, order fixed left→right by severity):

| Button | Rating | Color role |
|--------|--------|-----------|
| Forgot | Again | `stateLapsed` |
| Hard | Hard | `stateLearning` |
| Good | Good | `stateReview` (primary) |
| Easy | Easy | `stateMastered` |

**Slot rendering:** filled slot = `secondaryContainer` background, `onSecondaryContainer` text, 8dp radius; blank slot = dashed underline box, `outline` color, min width 48dp. Never color slots with the grading palette — slots are neutral structure, not feedback.

Rules: status color is always paired with a text label or icon (never color alone); feedback colors appear only *after* grading, never on the prompt.

### 4.2 Typography

System typeface (Roboto / SF Pro via platform default) — no custom font in v1; readability and dynamic-type support beat brand flavor here.

| Token | M3 base | Size/line/weight | Use |
|-------|---------|------------------|-----|
| `chunkDisplay` | headlineMedium | 28/36, w500 | The sentence being learned (recall prompt, chunk detail) |
| `chunkText` | titleLarge | 22/30, w500 | Chunks in lists, dialogue lines |
| `screenTitle` | titleLarge | 22/28, w600 | App bar titles |
| `sectionTitle` | titleMedium | 16/24, w600 | Card headers, sections |
| `body` | bodyLarge | 16/24, w400 | Meanings, explanations |
| `bodySmall` | bodyMedium | 14/20, w400 | Metadata, examples |
| `label` | labelLarge | 14/20, w600 | Buttons, chips |
| `caption` | bodySmall | 12/16, w400 | Counts, timestamps, hints |

Sentence/chunk text never drops below 18dp effective on learning screens. Slot blanks inherit the surrounding size. All learning text supports system font scaling to 130% without truncation (wrap, don't ellipsize, on `chunkDisplay`/`chunkText`).

### 4.3 Spacing

4dp grid. Existing `Gaps` class extended:

| Token | Value | Use |
|-------|-------|-----|
| `xs` | 4 | Inline icon↔text |
| `sm` | 8 | Chip gaps, dense rows |
| `md` | 16 | Default card padding, section gaps |
| `lg` | 24 | Between major sections |
| `xl` | 32 | Screen top/bottom breathing room |
| `xxl` | 48 | Empty-state illustration gap |

Screen horizontal padding: 20dp. Card padding: 16–20dp. Minimum touch target: 48×48dp everywhere (buttons already `Size.fromHeight(48)`).

### 4.4 Border radius

| Token | Value | Applied to |
|-------|-------|-----------|
| `rSm` | 8 | Slot fills, small badges |
| `rMd` | 12 | Chips (existing) |
| `rLg` | 14 | Buttons, inputs (existing) |
| `rXl` | 16 | Cards |
| `rSheet` | 28 (top corners) | Modal bottom sheets |

### 4.5 Elevation and surfaces

Tonal elevation over shadow: `surface` → `surfaceContainerLow` (cards on Today) → `surfaceContainer` (library rows) → `surfaceContainerHigh` (sheets). Real shadow only for modal sheets and the grading bar when it floats over scrollable content. App bars: flat, `scrolledUnderElevation: 1` (existing).

### 4.6 Icons

Material Symbols, **rounded** variant, outlined at rest / filled when selected (nav) — matches existing `AppShell`. Canonical mapping:

| Concept | Icon |
|---------|------|
| Today | `home_outlined` / `home` |
| Library | `library_books_outlined` / `library_books` |
| Situations | `explore_outlined` / `explore` |
| Progress | `insights_outlined` / `insights` |
| Listen / play | `volume_up` / `play_circle` |
| Speak / record | `mic` |
| Drill / pattern | `dynamic_feed` |
| Slot | `space_bar` (metaphor: fill the gap) |
| Streak | `local_fire_department` (used sparingly, never red-badge) |
| Export | `ios_share` |
| Mastered | `verified` |

### 4.7 Buttons

| Variant | Spec | Use |
|---------|------|-----|
| Primary | `FilledButton`, h48, r14, full-width in forms | Start Practice, Save, Generate |
| Secondary | `OutlinedButton`, h48, r14 | Show answer, secondary sheet actions |
| Tertiary | `TextButton`, h40 min | Skip, Not now, inline actions |
| Destructive | `TextButton` in `colorScheme.error` | Delete chunk, reset progress |
| Icon+label | `FilledButton.icon` | Listen, Practice this chunk |

One primary action per screen. Grading uses the dedicated 4-button `GradingBar` (4.14), not generic buttons.

### 4.8 Cards

| Card | Content | Behavior |
|------|---------|----------|
| **ChunkCard** | chunk text (slots rendered), meaning, state pill, due label | tap → chunk detail; long-press → quick actions sheet |
| **SituationCard** | title, chunk count, coverage bar, state ("Not started / In progress / Covered") | tap → situation detail |
| **DialogueCard** | situation tag, turn count, chunk count, last opened | tap → dialogue detail |
| **PlanCard** (Today) | due count, new count, est. minutes, Start Practice | primary CTA container |
| **StatCard** (Progress) | one number + label + 7-day sparkline | non-interactive |

Cards are flat tonal surfaces (4.5), r16, p16–20. No images/illustrations on cards — typography carries hierarchy.

### 4.9 Bottom sheets

Modal sheets for: filter/sort (Library), chunk quick actions, grading legend ("what do the buttons mean"), export options, TTS speed. Standard: drag handle, r28 top, `surfaceContainerHigh`, max 90% height, scrollable content, primary action pinned above safe area. Non-blocking pickers use `showModalBottomSheet`; destructive confirms use `AlertDialog` (centered, harder to mis-tap).

### 4.10 Input fields

Existing `AppTheme.input(label, hint, suffix)` is the single form style: outlined, r14, floating label. Rules: labels are plain nouns ("Situation", "Your goal"), never jargon; helper text shows *why* ("We build your first dialogue from this"); multiline fields grow to 5 lines then scroll; keyboard `textInputAction` chains through forms; error text replaces helper text in `colorScheme.error`.

### 4.11 Chips and filters

`FilterChip` (r12, existing chip theme) for topic / status / register filters; selected = `secondaryContainer`. Status filter chips show a colored dot from the learning-state palette + label. Sort is a sheet, not chips. Active filter count badges the filter icon. "Clear all" appears when ≥1 filter active.

### 4.12 Progress indicators

| Indicator | Use |
|-----------|-----|
| `LinearProgressIndicator` (rounded, h6) | Session progress (items done/total), coverage bars |
| `CircularProgressIndicator` | Blocking loads only (dialogue build, export) |
| Ring (custom `CustomPainter`, 56dp) | Daily goal on Today — completed ring = quiet brand fill, no confetti |
| Mastery bar | Per-chunk: 4-segment bar mapping FSRS stability quartiles |
| Skeletons | `Container` shimmer-free gray blocks (calm; no animation beyond opacity pulse) for library/dashboard loads |

### 4.13 Audio player controls

On-device TTS (`SpeechSynthesizer` seam) — no streaming, so controls are simple:

- **AudioButton**: icon button, 48dp, plays chunk text; while playing shows `stop`; disabled while another clip plays (single-player rule — one audio at a time, enforced by the provider).
- **Speed cycle**: long-press AudioButton or tap speed label → 1.0× → 0.75× → 0.5× → 1.0×. Slow speeds matter for beginners; default 1.0×.
- **Dialogue line row**: play icon + speaker label + line text; playing line highlights with `surfaceContainerHighest` background.
- No waveform, no scrubber (TTS is generated per utterance; scrubbing is meaningless).

### 4.14 Flashcard / recall components

The heart of the app. Structural rule: **prompt state and revealed state are separate widgets; the answer subtree does not exist in the widget tree until revealed.**

- **PromptCard**: mode badge (Listen / Say it / Fill the blank / Transform), prompt content (L1 sentence, blanked frame, or audio-only), optional hint reveal (progressive: first letter → slot options).
- **SlotBlankText**: `RichText` renderer — plain spans + styled slot spans (filled: chip-like container; blank: dashed underline box). Used by library, drills, dialogue breakdown, recall.
- **GradingBar**: 4 equal buttons (Forgot/Hard/Good/Easy), fixed order, state colors, appears only in revealed state; each shows the resulting interval as a caption ("1d", "4d") so grading is informed. Haptic `lightImpact` on grade.
- **SelfReportBar** (speaking mode): "Could you say it?" — Yes smoothly / Hesitated / No — maps to Good/Hard/Forgot. No fake precision.
- **SessionHeader**: close button (confirm sheet if mid-session), progress bar, item counter ("3 of 12"). No timer, no score.

### 4.15 Accessibility guidelines

- Contrast ≥ 4.5:1 for all text; state colors verified against both themes (values in 4.1 chosen accordingly).
- All learning content readable by screen readers: slots announced as "blank" or "slot: {label}"; grading buttons announce rating + interval.
- Full dynamic-type support to 130%; session screen tested at max scale (grading bar wraps to 2×2 grid).
- Reduced motion: respect `MediaQuery.disableAnimations` — card flips become cross-fades.
- Hit targets ≥ 48dp; grading buttons have 8dp separation.
- Localization-ready: no hardcoded strings (all via `AppLocalizations`-ready constants), layouts tolerate 40% expansion, no text baked into images, date/interval formatting via `intl`.
- Never encode meaning in color alone (state pill = dot + label).

---

## 5. Screen specifications

Format per screen: purpose · actions · layout · components · interactions · states · Flutter structure.

### 5.1 Onboarding — `/onboarding`

- **Purpose:** reach the first practice set in ≤60s with zero configuration debt.
- **Actions:** pick goal → type/select first situation → (system builds) → land in first session.
- **Layout:** paged `PageView`, 3 steps, progress dots, no skip button (steps are the value).
  1. "What do you want to speak English for?" — 6 large selectable cards (Travel / Work / Study / Daily conversation / Social life / Something else).
  2. "What conversation do you need soon?" — text field + 3 example chips ("Meeting my professor", "Ordering at a restaurant", "Job interview").
  3. Building state → auto-advances into the first dialogue/practice.
- **Components:** goal cards (`StatCard` variant), `AppTheme.input`, example chips, building progress (indeterminate + step captions: "Composing dialogue… Extracting chunks…").
- **Interactions:** step 1 selection auto-advances; step 2 requires ≥3 chars or a chip; back swipe allowed between 1↔2 only.
- **States:** building = full-screen progress with cancel→Today; build failure = inline error + "Use a starter situation instead" (seed fallback — offline guarantee: onboarding can never hard-fail).
- **Flutter:** `OnboardingScreen extends ConsumerStatefulWidget`; `PageController`; completion writes `settings.onboarded=true` via `SettingsRepository`, then `context.go(firstDialogue)`.

### 5.2 Today (Home dashboard) — `/today` · TAB 1

- **Purpose:** answer "what now?" in one glance; one-tap practice start.
- **Actions:** Start Practice (primary), continue unfinished session, open due chunk, open recent dialogue, go to settings, explore situations (empty state).
- **Layout (top→bottom):**
  1. App bar: "Today" + streak pill (subtle) + gear icon.
  2. **PlanCard**: "12 chunks due · ~4 min" + daily-goal ring + `Start Practice` (FilledButton, full width).
  3. **Continue** card (only if a session was abandoned): "Continue: Restaurant dialogue — 5 left".
  4. **Upcoming**: next 3 days' due counts (mini bar row).
  5. **Recent**: last 3 chunks practiced (ChunkCard compact) + last dialogue.
  6. **Discover strip** (only if library < 10 chunks): "Build your first situation" card → Situations.
- **Components:** PlanCard, ring, StatCard row, compact ChunkCards.
- **Interactions:** Start Practice → `/practice/session` directly with default mix (due first, then new); pull-to-refresh recomputes due queue.
- **States:** loading = skeleton PlanCard + rows; empty (no enrolments) = hero empty state, CTA "Explore situations" (NOT a disabled practice button); error = inline banner with retry, cached data shown below.
- **Flutter:** `TodayScreen extends ConsumerWidget` watching `todaySummaryProvider` (FutureProvider: due count, goal, recents). Sections are `SliverToBoxAdapter` blocks in one `CustomScrollView`.

### 5.3 Practice lobby (Daily practice overview) — `/practice`

- **Purpose:** preview the queue and adjust before committing; reachable via "Customize" on Today or by deep link. *Not* a required step.
- **Actions:** start session, pick modes (chips: Recall / Fill blank / Listen / Transform), pick scope (Due only / Due + new / Single situation), see composition.
- **Layout:** queue summary header ("12 due · 3 new"), mode chips (multi-select), scope selector, item preview list (first 5, collapsed), Start button pinned bottom.
- **States:** empty queue = "All caught up" + next-due time + CTA "Add new chunks" → Situations; loading skeleton; error banner.
- **Flutter:** `PracticeLobbyScreen extends ConsumerWidget`, `practiceQueueProvider`; Start constructs `PracticeSession` (domain) and pushes `/practice/session`.

### 5.4 Practice recall (prompt state) — `/practice/session`

- **Purpose:** active retrieval. The answer does not exist on screen until the learner commits.
- **Actions:** read/listen to prompt → produce answer (mentally, typed, or spoken) → "Show answer" (or submit).
- **Layout:**
  1. SessionHeader: close, progress bar, "3 of 12".
  2. Mode badge + instruction ("Say this in English", "Fill the blank").
  3. **PromptCard** (centered, `chunkDisplay` text; slots via SlotBlankText).
  4. Optional hint (progressive disclosure button).
  5. Input zone by mode: none (self-report) / text field / mic button.
  6. Bottom: `Show answer` (OutlinedButton, full width) — deliberately *not* filled: commitment is a choice, not a reflex.
- **Interactions:** audio auto-plays once in Listen mode (setting-gated); text submit reveals; Enter key submits; no countdown timers anywhere.
- **States:** loading item = skeleton card; TTS failure = inline "Audio unavailable" chip, practice continues (never blocks); empty session (queue drained mid-way) → summary.
- **Flutter:** `PracticeSessionScreen extends ConsumerStatefulWidget` holding the domain `PracticeSession`; local `enum _Phase { prompt, revealed }`; prompt/revealed are separate subtrees swapped by `AnimatedSwitcher` (cross-fade; respects reduced motion).

### 5.5 Answer & feedback (revealed state) — `/practice/session`

- **Purpose:** compare retrieval vs target, then grade honestly and move on fast.
- **Layout:**
  1. SessionHeader (progress advanced).
  2. Your attempt (if typed/spoken) vs **target chunk** (`chunkDisplay`, slots highlighted).
  3. Meaning + one example line (collapsed if long).
  4. AudioButton on the target.
  5. **GradingBar** pinned above safe area, intervals shown under each button.
- **Interactions:** grade → FSRS `recordReview` → next item (150ms slide); "Practice again later in session" available via overflow for Forgot items (requeues once).
- **States:** write failure (SQLite) = snackbar + retry, item stays ungraded; session complete → **Summary**: items done, Forgot/Hard counts, next-due time, single CTA "Done" (no confetti, no score).
- **Flutter:** revealed subtree receives the current `PracticeItem`; grading calls `RecordReview` use case; session object advances; providers invalidated on session end (`invalidatePracticeViews`).

### 5.6 Chunk detail — `/chunks/:id`

- **Purpose:** everything about one chunk + its next action. The chunk is the hero.
- **Actions:** listen, practice this chunk, open its pattern drill, enroll/remove from plan, edit (custom), delete (custom), favorite.
- **Layout:**
  1. App bar: back, favorite toggle, overflow (edit/delete).
  2. Chunk text (`chunkDisplay`, slots rendered) + AudioButton + speed.
  3. State pill + next review + mastery bar.
  4. Meaning, register tag (casual/neutral/formal), example with audio.
  5. **Pattern section**: frame with slots + sibling variations ("Other ways to fill it") → opens drill.
  6. Context: source dialogue link, situation tag.
  7. Actions row: `Practice` (primary) / `Drill` / plan toggle.
- **States:** loading skeleton; not found (deleted) = apology + back; TTS error chip.
- **Flutter:** `ChunkDetailScreen extends ConsumerWidget`, `chunkDetailProvider(id)` (FutureProvider.family); actions call use cases then `invalidateChunkViews`.

### 5.7 Chunk Library — `/library` · TAB 2

- **Purpose:** find and manage the learner's growing collection; bulk export entry.
- **Actions:** search, filter (status/topic/register), sort, open chunk, select mode → export/delete, add custom chunk (FAB).
- **Layout:** search field (always visible, not behind an icon) → filter chip row (horizontal scroll) → segmented control [Chunks | Patterns] → list. Patterns tab: frame rows with slot preview + variation count.
- **Components:** ChunkCard compact (one line chunk + state dot + due label), PatternRow, filter sheet, selection app bar ("5 selected" + export/delete).
- **Interactions:** search debounced 300ms, matches chunk text + meaning + slot fills; long-press enters selection; swipe-right = quick listen (does not navigate).
- **States:** loading skeleton rows; empty library = "Your library grows from situations you practice" + CTA; empty filter result = "No chunks match" + Clear filters; error banner with retry.
- **Flutter:** `ChunkLibraryScreen extends ConsumerStatefulWidget`; query state in a `Notifier` (`LibraryFilter`); results via `FutureProvider` keyed on filter; selection is local `Set<String>` state.

### 5.8 Dialog Builder — `/situations/:id/build`

- **Purpose:** compose a memorization-ready dialogue for the chosen situation (v1: template/parameter-driven via `dialogue_composer`; AI generation is a backend-phase drop-in behind the same use case).
- **Actions:** set role, counterpart, goal, level (chip row: Beginner/Intermediate/Advanced), tone (casual/neutral/formal) → Generate → review → Save & practice.
- **Layout:** single scrollable form, sections: "Who's talking" (two fields), "Your goal" (multiline), "Level & tone" (chips), pinned `Generate dialogue` button. After generation: inline preview card → Save.
- **States:** generating = button becomes progress + cancellable; validation error = field-level messages; empty goal = disabled Generate with helper text; offline template fallback always available.
- **Flutter:** `DialogueBuilderScreen extends ConsumerStatefulWidget`; form state local; Generate calls `BuildDialogue` use case → result pushed to `/dialogues/:id` on save.

### 5.9 Dialogue detail & chunk breakdown — `/dialogues/:id`

- **Purpose:** read/listen the conversation in context, see it decomposed into chunks, enroll the useful ones.
- **Actions:** play whole dialogue (line-by-line highlight), play single line, toggle a line's chunk breakdown, enroll/save chunk, practice all extracted chunks.
- **Layout:**
  1. Header: situation tag, level, tone, turn count.
  2. Transcript: speaker label + line (`chunkText`) + inline AudioButton; playing line highlighted.
  3. Under each key line: indented **chunk breakdown** — extracted frames via SlotBlankText + quick `+` enroll button (becomes ✓ when enrolled).
  4. Bottom bar: `Practice these chunks` (primary, enabled when ≥1 enrolled) + enrolled count.
- **Interactions:** tap line = play; tap chunk `+` = enroll with 200ms check animation; "Play all" becomes pause.
- **States:** loading skeleton transcript; no chunks extracted = "This dialogue has no reusable chunks yet" (rare; seed guarantees extraction); TTS failure per-line chip.
- **Flutter:** `DialogueScreen extends ConsumerStatefulWidget`; `dialogueProvider(id)`; single-audio rule via `audioPlayerProvider` Notifier; enrolment via use case + `invalidateChunkViews`.

### 5.10 Practice Plan — `/progress` · TAB 4 (top section)

- **Purpose:** make the schedule legible and adjustable without pressure.
- **Actions:** set daily goal (chunks/day: 5/10/20), see review forecast, pause plan (vacation), adjust reminder time.
- **Layout:** streak card (days, quiet) → goal ring + edit → **7-day forecast** bar chart (due per day) → "Pause reviews" switch → reminder time row.
- **Interactions:** goal change applies from tomorrow (today's queue untouched — no mid-day punishment); pause shows resume date picker.
- **States:** no plan yet = "Practice any chunk to start your plan"; loading skeleton.
- **Flutter:** section of `ProgressScreen`; `planSettingsProvider` + `forecastProvider` (7-day due aggregation from `user_chunks`).

### 5.11 Situation Coverage — `/situations/coverage`

- **Purpose:** show which life situations the learner can actually handle; recommend the next one.
- **Actions:** browse categories, open a situation, start recommended situation.
- **Layout:** overall coverage ring ("6 of 24 situations started") → category groups (Casual / Restaurant / Travel / Work / Presentation) → per-situation row: name, coverage bar, state label → "Recommended next" card (gap-based: category with least coverage + upcoming-goal match).
- **Interactions:** tap row → situation detail; recommendation refresh on enrolment changes.
- **States:** empty = "Practice your first situation" + CTA; loading skeleton.
- **Flutter:** `SituationCoverageScreen extends ConsumerWidget`; `coverageProvider` aggregates enrolments per situation (domain `situation_matcher`).

### 5.12 Profile & Settings — `/settings`

- **Purpose:** low-frequency configuration; learner identity is local-only in v1.
- **Layout (grouped list):** Learning (daily goal, reminder, TTS speed default, auto-play audio) · Practice (grading intervals preview, requeue-Forgot toggle) · Data (Anki export, delete all learner data — destructive dialog) · About (version, content version, licenses).
- **States:** destructive delete = typed-confirm dialog ("DELETE"); settings persist to `meta` table immediately (no Save button).
- **Flutter:** `SettingsScreen extends ConsumerWidget`; each row reads/writes `settingsProvider` (Notifier over `SettingsRepository`).

### 5.13 Anki Export — `/export`

- **Purpose:** portable decks in 3 taps; keeps lock-in fear at zero.
- **Actions:** choose scope (selected chunks / filtered set / all enrolled), choose format (Basic / Basic+reversed — via `anki_deck_formatter`), include audio text (yes), export → share sheet.
- **Layout:** scope radio cards → format chips → preview (first 3 rendered cards, front/back) → `Export` primary → success state with file name + "Share" + "Done".
- **States:** empty scope = disabled Export + hint; generating = progress on button; success = check + share CTA; write failure = error snackbar with retry.
- **Flutter:** `ExportScreen extends ConsumerStatefulWidget`; preselected ids arrive via route extra from Library selection; `ExportAnki` use case → `ExportSink` (share_plus).

---

## 6. Key user flows

**F1 — First run to first practice (≤60s):** Onboarding goal → situation → building → dialogue auto-opens → "Practice 5 key chunks" → session (5 items, Listen+Recall only) → summary → Today (goal ring partially filled). No library/deck/tag setup anywhere.

**F2 — Daily review (the habit loop):** Open app → Today → Start Practice → session (due queue) → grade each → summary → ring complete. Taps: 2 to first prompt. Target: <5 min for 15 items.

**F3 — Situation to chunks:** Situations tab → pick situation → Build → set goal → Generate → dialogue → play all → enroll 5 chunks (`+`) → Practice these chunks → chunks now in FSRS plan.

**F4 — Frame flexibility (the differentiator):** Chunk detail → Pattern section → Drill → see 2 filled variants → blank slot appears → type/say fill → instant match feedback (`answer_matcher`, fuzzy) → next variant → "Frame stable" summary → variants scheduled.

**F5 — Export:** Library → long-press select (or filter) → Export → scope/format confirm → share sheet → done. Learner data never leaves the device otherwise.

**F6 — Recovery:** 7 days absent → Today shows "12 due — start with 5?" (queue auto-trimmed to oldest/highest-value; no guilt copy, streak shown as "best: 14 days" not "lost").

---

## 7. Flutter architecture

Confirms and extends the existing Clean Architecture contract (`mobile/AGENTS.md`).

### 7.1 Folder structure

```text
lib/
├── domain/                  # pure Dart — no Flutter imports
│   ├── entities/            # chunk, sentence_pattern, situation, dialogue, practice, learner_settings
│   ├── repositories/        # content_repository, practice_repository, settings_repository (interfaces)
│   ├── services/            # fsrs/, slot_template, dialogue_composer, drill_generator,
│   │                        # drill_session, practice_item_factory, practice_session,
│   │                        # answer_matcher, anki_deck_formatter, situation_matcher, clock, id_generator
│   └── usecases/            # build_dialogue, record_review, start_practice_session,
│                            # create_custom_chunk, export_anki
├── data/
│   ├── db/app_database.dart         # schema + onUpgrade
│   ├── repositories/                # sqlite_* implementations (sqflite_common only)
│   └── seed/                        # seed parsing/import
├── core/
│   ├── bootstrap.dart       # open DB, import seed, load settings
│   ├── di/providers.dart    # all Riverpod wiring (composition root)
│   ├── routing/             # app_routes, app_router
│   ├── theme/               # app_theme (+ design tokens, §8.1)
│   ├── platform/            # speech_synthesizer, export_sink (only plugin seams)
│   └── util/
├── features/
│   ├── shell/app_shell.dart
│   ├── onboarding/  today/  practice/  library/  situations/
│   ├── drills/  progress/  export/  settings/
│   └── shared/widgets.dart  # ChunkCard, SlotBlankText, GradingBar, AudioButton, …
└── main.dart / app.dart
```

Rule: screens never import `data/` or plugins; they watch providers and call use cases. Session objects (`PracticeSession`, `DrillSession`) are domain classes held by `ConsumerStatefulWidget`s — transient state stays out of the DI graph.

### 7.2 Routing

`go_router` + `StatefulShellRoute.indexedStack` (4 branches: today, library, situations, progress). Detail/session routes on the root navigator so they cover the bottom bar. All paths centralized in `AppRoutes`; `/chunks/new` declared before `/chunks/:id`. Route extras limited to lightweight values (preselected export ids); entities are re-fetched by id.

### 7.3 State management — Riverpod (confirmed)

- `Provider` / `FutureProvider(.family)` for reads; `Notifier` for writable state (settings, library filter, audio player). No `StateProvider`, no codegen — valid across Riverpod 2.x/3.x.
- Writes: call use case → `ref.invalidate` the affected view providers (`invalidateChunkViews`, `invalidatePracticeViews`, `enrolledChunkIdsProvider`).
- Rationale vs alternatives: Bloc adds ceremony without payoff at this scale; setState-only can't share query caches across tabs; Riverpod gives testable, override-friendly DI that matches the domain-first layering.

### 7.4 Mock data models

Domain entities are the interfaces; UI never sees SQLite rows. Example shapes (existing entities, abridged):

```dart
class Chunk {
  final String id;              // client UUID
  final String text;            // "I'm particularly interested in {topic}"
  final String meaning;         // L1 gloss
  final String? patternId;
  final String register;        // casual | neutral | formal
  final String situationId;
}

class UserChunk {               // enrolment + FSRS state
  final String chunkId;
  final double stability, difficulty;
  final DateTime? nextReview;   // null => due now (new)
  final String state;           // new | learning | review | relearning
}
```

Widget tests inject fakes from `test/helpers/fakes.dart` (in-memory repositories, `SilentSpeechSynthesizer`, recording `ExportSink`).

### 7.5 Responsive & accessibility implementation

- Breakpoints: phones only in v1 (320–430dp). `LayoutBuilder` guards ≥600dp with a centered max-width-560 column (foldables/tablets get a readable line length for free).
- Safe areas: `SafeArea` on sheets and session screen; grading bar pads `MediaQuery.viewInsets.bottom`.
- Keyboard: session text field uses `scrollPadding`; lobby/lobby forms are `SingleChildScrollView` + `resizeToAvoidBottomInset`.
- Semantics: every icon-only button has a label; slots wrapped in `Semantics(label: 'blank')`.

### 7.6 Testing strategy

| Layer | Scope | Tools |
|-------|-------|-------|
| Domain | FSRS scheduling, session advance/grade, drill generation, answer matching, anki formatting | `flutter_test` pure Dart (`test/domain`) |
| Data | repository CRUD, migrations, seed import | `sqflite_common_ffi` (`test/data`) |
| Widgets | recall prompt→reveal→grade flow, library filter, dialogue enroll, export preview | widget tests on fakes (`test/features`) |
| Critical flow | onboarding→first session; due-queue session end-to-end | `integration_test` on device/emulator |
| Goldens | design-system components (ChunkCard, GradingBar, SlotBlankText) in light/dark | `flutter_test` goldens (optional, CI-gated) |

CI (`mobile-ci.yml`): analyze (0 warnings) + test + APK on every PR touching `mobile/**`.

---

## 8. Example Flutter code

### 8.1 Design tokens (`core/theme/app_tokens.dart`)

```dart
import 'package:flutter/material.dart';

/// Semantic learning-state colors. Paired with labels — never color alone.
class StateColors {
  const StateColors._();

  static const Color new_ = Color(0xFF2563EB);
  static const Color learning = Color(0xFFB45309);
  static const Color review = Color(0xFF0F766E); // brand
  static const Color mastered = Color(0xFF15803D);
  static const Color lapsed = Color(0xFFB91C1C);

  static Color forState(String state, Brightness b) { /* dark variants */ }
}

class AppRadii {
  const AppRadii._();
  static const sm = 8.0, md = 12.0, lg = 14.0, xl = 16.0, sheet = 28.0;
}

class AppText {
  const AppText._();
  static TextStyle chunkDisplay(TextTheme t) =>
      t.headlineMedium!.copyWith(fontWeight: FontWeight.w500, height: 36 / 28);
  static TextStyle chunkText(TextTheme t) =>
      t.titleLarge!.copyWith(fontWeight: FontWeight.w500, height: 30 / 22);
}
```

### 8.2 Slot rendering (`features/shared/slot_blank_text.dart`)

```dart
import 'package:flutter/material.dart';

/// Renders "I'm particularly interested in {topic}" with the slot styled:
/// filled value => chip-like container; null value => dashed blank.
class SlotBlankText extends StatelessWidget {
  const SlotBlankText(this.frame, {super.key, this.fill, this.style});

  final String frame;       // frame text with {slot} markers
  final String? fill;       // null => render the blank
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final spans = <InlineSpan>[];
    final parts = frame.split(RegExp(r'(\{[^}]+\})'));
    for (final part in parts) {
      if (part.startsWith('{')) {
        spans.add(WidgetSpan(
          alignment: PlaceholderAlignment.baseline,
          baseline: TextBaseline.alphabetic,
          child: Semantics(
            label: fill == null ? 'blank' : 'slot: $fill',
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: fill == null ? null : scheme.secondaryContainer,
                borderRadius: BorderRadius.circular(8),
                border: fill == null
                    ? Border(bottom: BorderSide(color: scheme.outline, width: 2))
                    : null,
              ),
              child: Text(fill ?? '    ',
                  style: style?.copyWith(color: scheme.onSecondaryContainer)),
            ),
          ),
        ));
      } else {
        spans.add(TextSpan(text: part, style: style));
      }
    }
    return Text.rich(TextSpan(children: spans));
  }
}
```

### 8.3 Recall session screen (prompt → reveal → grade)

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PracticeSessionScreen extends ConsumerStatefulWidget {
  const PracticeSessionScreen({super.key, required this.session});
  final PracticeSession session; // domain object, constructed in lobby/Today

  @override
  ConsumerState<PracticeSessionScreen> createState() => _State();
}

class _State extends ConsumerState<PracticeSessionScreen> {
  bool _revealed = false; // answer subtree does not exist until true

  Future<void> _grade(Rating rating) async {
    await ref.read(recordReviewProvider)(
        widget.session.current.chunkId, rating);
    HapticFeedback.lightImpact();
    if (widget.session.advance()) {
      setState(() => _revealed = false);
    } else {
      invalidatePracticeViews(ref);
      context.go('/today'); // via summary screen in full implementation
    }
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.session.current;
    return Scaffold(
      body: SafeArea(
        child: Column(children: [
          SessionHeader(done: widget.session.doneCount,
              total: widget.session.totalCount),
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 150),
              child: _revealed
                  ? AnswerView(item: item)          // target + meaning + audio
                  : PromptCard(item: item),          // retrieval prompt only
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: _revealed
                ? GradingBar(onGrade: _grade,
                    intervals: widget.session.previewIntervals())
                : OutlinedButton(
                    onPressed: () => setState(() => _revealed = true),
                    child: const Text('Show answer')),
          ),
        ]),
      ),
    );
  }
}
```

### 8.4 Grading bar

```dart
class GradingBar extends StatelessWidget {
  const GradingBar({super.key, required this.onGrade, required this.intervals});
  final void Function(Rating) onGrade;
  final Map<Rating, String> intervals; // FSRS preview: {"Again": "1m", …}

  static const _order = [Rating.again, Rating.hard, Rating.good, Rating.easy];
  static const _labels = ['Forgot', 'Hard', 'Good', 'Easy'];
  static const _colors = [StateColors.lapsed, StateColors.learning,
                          StateColors.review, StateColors.mastered];

  @override
  Widget build(BuildContext context) => Row(
    children: [
      for (var i = 0; i < 4; i++)
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: _colors[i],
                minimumSize: const Size.fromHeight(56),
              ),
              onPressed: () => onGrade(_order[i]),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Text(_labels[i]),
                Text(intervals[_order[i]] ?? '',
                    style: Theme.of(context).textTheme.bodySmall),
              ]),
            ),
          ),
        ),
    ],
  );
}
```

### 8.5 Router shell (target)

```dart
StatefulShellRoute.indexedStack(
  builder: (_, __, shell) => AppShell(navigationShell: shell),
  branches: [
    branch('/today',    const TodayScreen()),
    branch('/library',  const ChunkLibraryScreen()),
    branch('/situations', const SituationsScreen()),
    branch('/progress', const ProgressScreen()),
  ],
),
// Root-level: /practice, /practice/session, /situations/:id, /situations/:id/build,
// /situations/coverage, /dialogues/:id, /chunks/new (before /chunks/:id),
// /chunks/:id, /drills/:patternId, /export, /settings, /onboarding
```

---

## 9. Usability risks and improvements

| Risk | Why it fails | Mitigation in this design |
|------|--------------|---------------------------|
| **Typing fatigue** | Requiring typed answers for every recall item doubles session time; users quit | Self-report grading is the default; typing only in fill-blank/drill modes |
| **Fake speaking practice** | "Say it in your head" self-report is dishonest without verification | v1 accepts it knowingly (strategy: STT match-rate is phase 2); SelfReportBar wording ("Could you say it out loud?") nudges real speech |
| **Retrieval friction too high** | Immediate full production on new chunks → constant Forgot → discouragement | Mode order per chunk maturity: Listen→repeat first, L1→L2 later; hints are progressive, not binary |
| **Streak anxiety** | Streak-loss mechanics drive abandonment after travel/illness | Streak is quiet, pausable, framed as "best: N"; F6 recovery flow trims queue without guilt copy |
| **Slot UI complexity** | Slots rendered as form fields everywhere would turn reading into data entry | Slots are inline styled text (SlotBlankText); editable only inside drill/fill-blank modes |
| **TTS quality ceiling** | Robotic prosody teaches bad rhythm | Speed control + always-visible text; copy never claims native audio; real recordings are a content-roadmap item |
| **Empty-library cold start** | A library tab with nothing in it reads as a broken app | Library empty state routes to Situations; Today hides recents until they exist |
| **Grading ambiguity** | Users don't know Good vs Easy → noisy FSRS data | Intervals shown on buttons; legend sheet on first session; only 4 options |
| **Coverage map as guilt map** | A wall of 0% situations demotivates | Coverage leads with "Recommended next", not with emptiness |
| **Export = churn** | One-tap export of everything enables export-and-abandon | Export stays easy (principle) but the loop value (FSRS scheduling, drills) lives only in-app; analytics watch export-then-inactive cohort |

---

## 10. Prioritized MVP roadmap

Ordered by learning-loop value; each tier is shippable and leaves the app coherent.

| Priority | Scope | Why first |
|----------|-------|-----------|
| **P0 — Loop core** | Today dashboard, recall session (prompt/reveal/grade), FSRS wiring, chunk detail, minimal Library list, onboarding→seed-situation first session | Without retrieval-before-reveal + scheduling there is no product; everything else is decoration |
| **P1 — Differentiation** | Dialogue detail with chunk breakdown + enrolment, substitution drills (SlotBlankText everywhere), practice lobby modes | Frames-with-slots is the moat; drills are the feature flashcard apps don't have |
| **P2 — Habit & context** | Practice Plan (goal, forecast, pause), Situations tab + Dialog Builder (template path), Situation Coverage, streak | Makes daily use sustainable and makes progress legible |
| **P3 — Portability & polish** | Anki export flow, settings depth, dark-theme verification pass, accessibility audit at 130% type, golden tests | Trust and reach; deliberately after the loop is proven |
| **Post-v1** | AI dialogue generation (backend), STT speaking feedback, sync, shared packs | Requires network/accounts; explicitly out of offline v1 |

Design-debt guardrails: no feature ships with recognition-only practice; no screen ships without its empty/error states from §5; any new grading/gamification idea must argue against §9's streak-anxiety finding first.
