---
title: Integrate FSRS Practice Review Engine in OpenSen Backend
date: 2026-08-10
category: architecture-patterns
module: backend-practice
problem_type: architecture_pattern
component: service_object
severity: high
applies_when:
  - Adding spaced-repetition scheduling to chunk practice in the Hono backend
  - Persisting per-user FSRS state on user_chunks with append-only review_history
  - Exposing due queue, review submission, and plan stats endpoints under /api/practice
  - Wrapping ts-fsrs behind a pure scheduler module and Drizzle repository boundary
resolution_type: code_fix
related_components:
  - database
  - testing_framework
tags:
  - fsrs
  - ts-fsrs
  - spaced-repetition
  - practice-plan
  - drizzle
  - user-chunks
  - review-history
  - hono
  - backend
---

# Integrate FSRS Practice Review Engine in OpenSen Backend

[KEI-140](https://linear.app/keios/issue/KEI-140/backend-xay-dung-fsrs-practice-review-engine-apipractice) and [PR #13](https://github.com/KeiosStarqua/opensen/pull/13) ship the backend spaced-repetition engine: three practice routes on Hono, FSRS scheduling via `ts-fsrs`, and persistence on `user_chunks` plus append-only `review_history`. Schema and migration groundwork live in [`postgres-drizzle-phase1-neon-pgvector.md`](postgres-drizzle-phase1-neon-pgvector.md); this doc covers the repository and API layer that runs FSRS on that schema.

## Context

OpenSen's Practice Plan needs a backend that schedules chunk reviews with FSRS (Free Spaced Repetition Scheduler) and exposes three HTTP surfaces: due queue, review submission, and plan statistics.

Routes mount at `/api/practice` (`backend/src/index.ts:48`). The router defines `GET /due`, `POST /reviews`, and `GET /plan` (`backend/src/routes/practice.ts:35-109`). Each handler resolves the learner id, validates input with Zod, wires `getDatabase()` and `createPracticeReviewRepository()`, and delegates all business logic to the repository — routes never call `ts-fsrs` or write SQL directly.

Until authenticated ownership ships, every practice route requires an `X-User-Id` header (case-insensitive `x-user-id` per Hono). `resolveUserId` reads that header, returns 401 when missing, and 400 when the value is not a UUID (`backend/src/lib/user-context.ts:8-24`). Practice routes invoke it at the start of each handler (`backend/src/routes/practice.ts:36, 63, 102`).

Persistence schema (`backend/src/db/schema/practice.ts`):

- **`user_chunks`** — one row per `(userId, chunkId)` with FSRS fields: `status`, `stability`, `difficulty`, `reps`, `lapses`, `lastReview`, `nextReview`, plus `updatedAt`. Unique index on `(user_id, chunk_id)` (`backend/src/db/schema/practice.ts:45-68`).
- **`review_history`** — append-only audit of each review: integer `rating`, `elapsedDays`, `scheduledDays`, `stateBefore`, optional `practiceAttemptId`, `reviewTime` (`backend/src/db/schema/practice.ts:70-89`).

Domain types live in `backend/src/practice/types.ts`: `ChunkStatus` (`new | learning | review | relearning`), API review ratings `forgot | hard | good | easy` (`REVIEW_RATINGS`), and response shapes for due items, review results, and plan stats.

## Guidance

### 1. Thin Hono routes → `PracticeReviewRepository`

Follow the `createPracticeRouter` pattern: inject optional deps (`getDatabase`, `createRepository`, `loadDatabaseEnv`) for tests (`backend/src/routes/practice.ts:14-21, 27-31`).

| Route | Repository call | Success response |
|-------|-----------------|------------------|
| `GET /due` | `listDue(userId, limit, cursor?)` | 200 JSON `{ items, nextCursor }` |
| `POST /reviews` | `recordReview(userId, chunkId, rating, practiceAttemptId?)` | 201 JSON `ReviewResult` |
| `GET /plan` | `getPlanStats(userId)` | 200 JSON `PracticePlanStats` |

Validation:

- Due query: `dueQuerySchema` — `limit` coerced int 1-100, default 20; optional `cursor` UUID (`backend/src/practice/schemas.ts:10-13`). Parsed at `backend/src/routes/practice.ts:37-48`.
- Review body: `reviewRequestSchema` — `chunkId` UUID, `rating` enum from `REVIEW_RATINGS`, optional `practiceAttemptId` UUID (`backend/src/practice/schemas.ts:4-8`). Invalid JSON → 400; Zod failure → 400 with joined issue messages (`backend/src/routes/practice.ts:65-79`).

Error mapping: `PracticeReviewError` with code `chunk_not_found` becomes HTTP 404 (`backend/src/db/practice-review-repository.ts:309-316`, `backend/src/routes/practice.ts:94-96`). Other errors propagate.

### 2. `fsrs-scheduler.ts` — pure domain adapter

Keep `ts-fsrs` behind this module. A single shared `scheduler = fsrs()` instance (`backend/src/practice/fsrs-scheduler.ts:12`).

**ChunkStatus ↔ ts-fsrs `State`:**

```14:26:backend/src/practice/fsrs-scheduler.ts
const STATUS_TO_STATE: Record<ChunkStatus, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
}

const STATE_TO_STATUS: Record<State, ChunkStatus> = {
  [State.New]: 'new',
  [State.Learning]: 'learning',
  [State.Review]: 'review',
  [State.Relearning]: 'relearning',
}
```

**`toFsrsCard`:** For a never-reviewed chunk (`status === 'new'`, `reps === 0`, no `lastReview`), return `createEmptyCard(now)` (`backend/src/practice/fsrs-scheduler.ts:50-53`). Otherwise build a `Card` from stored scheduling state (`backend/src/practice/fsrs-scheduler.ts:55-66`).

**`applyReview`:** Convert state to card, call `scheduler.next(card, now, rating)`, map the returned card back to `SchedulingUpdate` and expose the FSRS log (`backend/src/practice/fsrs-scheduler.ts:69-92`). `lastReview` is always `now`; `nextReview` is `nextCard.due`; `scheduledDays` / `elapsedDays` come from the log.

The repository is the only caller of `applyReview` inside `recordReviewItem` (`backend/src/db/practice-review-repository.ts:183`).

### 3. `listDue` — cursor pagination and due semantics

Due means `nextReview IS NULL OR nextReview <= now` (`backend/src/db/practice-review-repository.ts:93-96`).

Query: `user_chunks` inner join `chunks` for `text` and `meaning`, filtered by `userId`, due condition, and optional cursor `chunkId > cursor` (`backend/src/db/practice-review-repository.ts:98-118`). Order: `nextReview`, then `chunkId` (`backend/src/db/practice-review-repository.ts:119`). Fetch `limit + 1` rows; if more than `limit`, slice to `limit` and set `nextCursor` to the last item's `chunkId` (`backend/src/db/practice-review-repository.ts:122-128`). Map rows via `mapDueRow` (`nextReview` → ISO `dueAt` or null) (`backend/src/db/practice-review-repository.ts:41-63, 125-128`).

`getPlanStats` reuses the same due-now predicate for `dueNow` (`backend/src/db/practice-review-repository.ts:259-267`).

### 4. `recordReview` — transactional upsert + history append

Inside `database.transaction` (`backend/src/db/practice-review-repository.ts:142`):

1. Verify chunk exists; else `PracticeReviewError('chunk_not_found')` (`backend/src/db/practice-review-repository.ts:143-151`).
2. Load existing `user_chunks` row or default new state (`backend/src/db/practice-review-repository.ts:153-181`). `stateBefore` for history is `previous?.status ?? 'new'` (`backend/src/db/practice-review-repository.ts:169-170`).
3. `applyReview(schedulingState, fsrsRating, now)` (`backend/src/db/practice-review-repository.ts:139, 183`).
4. **Upsert `user_chunks`** via `insert … onConflictDoUpdate` on `(userId, chunkId)` with all FSRS fields and `updatedAt` (`backend/src/db/practice-review-repository.ts:185-211`).
5. **Append `review_history`** with generated id, integer rating, elapsed/scheduled days, `stateBefore`, optional `practiceAttemptId`, `reviewTime` (`backend/src/db/practice-review-repository.ts:213-223`).
6. Return `ReviewResult` including `reviewHistoryId` (`backend/src/db/practice-review-repository.ts:225-237`).

### 5. Review ratings — API strings → ts-fsrs `Rating`

API accepts only `forgot`, `hard`, `good`, `easy` (`backend/src/practice/types.ts:3-4`, enforced by Zod `backend/src/practice/schemas.ts:6`).

`ratingFromReviewRating` maps:

| API | ts-fsrs |
|-----|---------|
| `forgot` or `again` (case-insensitive) | `Rating.Again` |
| `hard` | `Rating.Hard` |
| `good` | `Rating.Good` |
| `easy` | `Rating.Easy` |

(`backend/src/practice/fsrs-scheduler.ts:95-108`). Unknown strings throw inside the scheduler (repository does not catch — treat as bug if Zod already validated).

`ratingToInteger` stores the numeric `Grade` in `review_history.rating` (`backend/src/practice/fsrs-scheduler.ts:111-113`). Integration test expects `good` → rating `3` (`backend/src/db/practice-review-repository.postgres.integration.test.ts:71`).

### 6. `X-User-Id` until auth ships

All three practice handlers call `resolveUserId(c)` before repository work. Route tests pass `x-user-id` and assert 401 without it (`backend/src/routes/practice.test.ts:54-56, 138-143`). Document the header in API contracts and `backend/AGENTS.md` until session/JWT ownership replaces it.

### 7. Testing strategy

**Route unit tests** (`backend/src/routes/practice.test.ts`): Mock `PracticeReviewRepository` via `createPracticeRouter` deps — no database. Verify status codes, delegation args, and validation (`rating: 'perfect'` → 400, `recordReview` not called) (`backend/src/routes/practice.test.ts:145-162`).

**Repository integration tests** (`backend/src/db/practice-review-repository.postgres.integration.test.ts`): Require `TEST_DATABASE_URL`, run migrations, seed `users` and `chunks` with raw `postgres` SQL, then exercise real `createDatabase` + `createPracticeReviewRepository`:

- `recordReview` updates `user_chunks` and appends `review_history` with expected rating and `state_before` (`backend/src/db/practice-review-repository.postgres.integration.test.ts:41-73`).
- `listDue` returns seeded due chunks; `getPlanStats` reflects totals (`backend/src/db/practice-review-repository.postgres.integration.test.ts:75-96`).

Run integration suite with `npm run test:db` against a disposable Postgres with pgvector (see `backend/AGENTS.md` Verification).

## Why This Matters

**Separation of concerns:** Routes stay transport-only; FSRS stays vendor-pure; SQL and transactions stay in the repository. New scheduling rules or a different SRS library touch `fsrs-scheduler.ts` and repository mapping — not every HTTP handler.

**Correct due semantics:** Treating `nextReview IS NULL` as due lets never-reviewed chunks appear in the queue without a separate "new card" code path in the list query (`backend/src/db/practice-review-repository.ts:93-96`).

**Atomic reviews:** Upsert + history insert in one transaction prevents orphaned scheduling state or missing audit rows if the second write fails (`backend/src/db/practice-review-repository.ts:142-223`).

**Stable API surface:** Four learner-facing ratings with `forgot` aliasing `again` at the scheduler boundary keeps mobile wording flexible while Zod enforces the public enum (`backend/src/practice/types.ts:3-4`, `backend/src/practice/fsrs-scheduler.ts:97-99`).

**Testability without Postgres:** Injectable repository factory lets route tests prove HTTP contract in milliseconds; Postgres tests prove persistence and FSRS integration once per CI/db job.

## When to Apply

- Adding practice endpoints (e.g. bulk due, review preview, FSRS parameter tuning): extend `PracticeReviewRepository`, keep routes thin.
- Changing how "due" is defined (e.g. timezone boundaries, max daily reviews): adjust `listDueItems` / `fetchPlanStats` predicates and document client expectations — do not scatter due logic in routes.
- Introducing real auth: replace `resolveUserId` header parsing with session/user middleware; repository methods already take `userId` as an explicit argument.
- Linking reviews to recall attempts: pass `practiceAttemptId` through `POST /reviews` (optional in schema `backend/src/practice/schemas.ts:7`) into `review_history` (`backend/src/db/schema/practice.ts:82-85`).
- Swapping FSRS libraries: reimplement `toFsrsCard`, `applyReview`, and rating mappers in `fsrs-scheduler.ts`; keep `user_chunks` / `review_history` column meanings stable unless migrating data.

## Examples

### Example A — Due queue with cursor

Request:

```http
GET /api/practice/due?limit=20
X-User-Id: 11111111-1111-4111-8111-111111111111
```

Handler flow: `resolveUserId` → `dueQuerySchema` (default `limit=20`) → `repository.listDue(userId, 20, undefined)` (`backend/src/routes/practice.ts:35-59`).

Follow-up page when `nextCursor` is non-null:

```http
GET /api/practice/due?limit=20&cursor=<last-chunkId-from-previous-page>
```

Cursor is chunk id, not timestamp (`backend/src/db/practice-review-repository.ts:116-117, 127`).

### Example B — Submit a review

Request:

```http
POST /api/practice/reviews
Content-Type: application/json
X-User-Id: 11111111-1111-4111-8111-111111111111

{"chunkId":"22222222-2222-4222-8222-222222222222","rating":"good"}
```

Route delegates `recordReview(userId, chunkId, 'good', undefined)` (`backend/src/routes/practice.ts:86-91`). Repository maps `good` → `Rating.Good`, runs FSRS, upserts `user_chunks`, inserts `review_history`, returns 201 with `nextReview`, `reviewHistoryId`, etc.

Using `forgot` instead of `good` maps to `Rating.Again` at the scheduler (`backend/src/practice/fsrs-scheduler.ts:97-99`) even though `again` is not in the public Zod enum.

### Example C — Plan stats dashboard

```http
GET /api/practice/plan
X-User-Id: 11111111-1111-4111-8111-111111111111
```

Returns `total`, `byStatus`, `dueNow`, `dueNext7Days`, `reviewedToday` (`backend/src/practice/types.ts:32-38`). `dueNow` uses the same null-or-past `nextReview` rule as `listDue` (`backend/src/db/practice-review-repository.ts:259-267`). `reviewedToday` counts `review_history` rows since UTC midnight (`backend/src/db/practice-review-repository.ts:282-290`).

### Example D — Repository factory for tests

From `practice.test.ts`: inject a mock repository without touching Postgres:

```typescript
const app = createPracticeRouter({
  getDatabase: () => ({} as never),
  createRepository: () => repository,
  loadDatabaseEnv: () => ({
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
  }),
})
```

(`backend/src/routes/practice.test.ts:46-52`). Same pattern applies when adding new practice routes in follow-up PRs after #13.

## Related

- [`postgres-drizzle-phase1-neon-pgvector.md`](postgres-drizzle-phase1-neon-pgvector.md) — Phase 1 schema for `user_chunks` and `review_history`
- [`docs/database-architecture.md`](../../database-architecture.md) — product FSRS contract (mutable state vs append-only history)
- [KEI-140](https://linear.app/keios/issue/KEI-140/backend-xay-dung-fsrs-practice-review-engine-apipractice) — implementation issue
- [PR #13](https://github.com/KeiosStarqua/opensen/pull/13) — merged implementation
