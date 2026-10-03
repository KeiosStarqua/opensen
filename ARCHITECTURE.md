# Architecture

OpenSen is one repository and three runtimes. Learners turn a real situation into speakable sentence patterns, then practice those chunks until they come out without translation. This document records how the running system is split: which process owns which rules, and which store holds which rows.

Column-level schema stays in [Database architecture](docs/database-architecture.md). Product scope stays in [Product strategy](docs/product-strategy.md). Feature names stay in [Features](docs/features.md).

## Shape

```text
Neon Auth (Managed Better Auth)
        |
        | session JWT (sub = learner id)
        |
        +---------------------------+
        |                           |
   web/  TanStack Start        mobile/  Flutter
   landing + study UI          offline-first client
        |                           |
        | HTTPS JSON                | SQLite: catalog, drills,
        | Authorization: Bearer     | FSRS, settings, Anki text
        v                           |
   backend/  Hono on Vercel         | Settings probes
        |                           | GET /health and
        v                           | GET /api/situations
   Postgres (Neon) + pgvector
   Drizzle schema, SQL migrations
```

The phone keeps content and progress on the device. The web app’s API-backed screens read and write the server. The two schedules do not sync.

## Packages

| Path | Package | Runtime |
|------|---------|---------|
| [`mobile/`](mobile/) | `opensen` | Flutter. v1 is fully offline. Web is a UI preview (SQLite WASM, speech unavailable). |
| [`backend/`](backend/) | `opensen-backend` | Hono app default-exported from `src/index.ts`, deployed as Vercel Functions. Host: `https://api.opensen.taquangkhoi.com/`. |
| [`web/`](web/) | `opensen-web` | One TanStack Start app (Vite + Nitro, Vercel) for the marketing page and the signed-in app. Host: `https://opensen.taquangkhoi.com/`. |

Business rules that must survive a UI rewrite live in `mobile/lib/domain/` or in backend modules outside route handlers (`src/practice/`, `src/export/`, `src/dialogue-packs/`, `src/ai/`). Web UI calls the API through `web/src/lib/api/` and keeps only session-local scoring, drill assembly, and the studio lesson flow in the browser.

## Mobile

Clean Architecture, no code generation. Dependencies point inward.

| Layer | Path | Owns |
|-------|------|------|
| Domain | `lib/domain/` | Entities, repository interfaces, use cases, and services. No Flutter, plugin, or `sqflite` imports. |
| Data | `lib/data/` | SQLite repositories (`sqflite_common` only), seed import, `db/app_database.dart`. |
| Remote | `lib/data/remote/` | `OpenSenApiClient` and `HttpServerRepository`. The only network calls are the Settings reachability probe. |
| Composition | `lib/core/` | `bootstrap.dart` opens the database, imports seed, and loads settings. `di/providers.dart` wires Riverpod. `db/database_factory.dart` is the only place that picks native SQLite or web WASM. |
| UI | `lib/features/<surface>/` | Screens and per-feature providers. |

`go_router` uses a `StatefulShellRoute.indexedStack` for four tabs: Today, Library, Situations, Plan. Detail routes and `/practice/session` sit on the root navigator so they cover the bottom bar. Paths live in `lib/core/routing/app_routes.dart`.

On-device services that implement the product loop:

- `slot_template`, `dialogue_composer`, `situation_matcher` — fill slots and compose a personal dialogue from the bundled template graph (`BuildDialogueUseCase`).
- `drill_generator`, `drill_session` — substitution drills.
- `practice_item_factory`, `practice_session`, `answer_matcher` — recall.
- `fsrs/` — FSRS-5 with published default weights, learning steps 1 minute and 10 minutes, relearning 10 minutes. Intervals come from stability. `user_chunks` holds state; `review_history` is append-only.
- `anki_deck_formatter` — deck text, handed to the `ExportSink` platform seam.

Speech goes through `SpeechSynthesizer` (`flutter_tts`). Tests replace speech, export, and the server probe with fakes.

A chunk is on the Practice Plan only when a `user_chunks` row exists. Due means `next_review` is null or at or before now. Ids are client UUIDs. Timestamps are ISO-8601 UTC strings. Settings live in the `meta` table under `settings.*`.

## Web

One TanStack Start app; paths below are under `web/src/`. `routes/index.tsx` is the public landing page (`components/landing-page.tsx`). The pathless `routes/_app` layout is the signed-in product, and `routes/_app/_shell` adds the study shell. A global request middleware (`lib/auth/auth-middleware.ts`, registered in `start.ts`) checks the Neon Auth session on every document request under the prefixes in `lib/auth/protected-routes.ts`, answers 307 to `/auth/sign-in?redirectTo=…` when signed out, and marks signed-in pages `Cache-Control: private, no-store`. `/` and `/auth/*` stay public.

Auth is Managed Better Auth through `@neondatabase/auth`. The server side is a TanStack Start adapter over `@neondatabase/auth/server` in `lib/auth/auth.server.ts` (`NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, server-only). The browser client is `lib/auth/client.ts`. Sign-in, sign-up, name change, and sign-out are server functions in `lib/auth/auth.functions.ts`; each checks the session itself. `routes/api.auth.$.ts` proxies the auth SDK. `createDefaultApiClient` sends `Authorization: Bearer <jwt>` from `authClient.getSession()`. Signed-out calls omit the header.

The signed-in shell (`components/studio/`, `components/app-shell.tsx`) has two study surfaces.

**Studio** uses static lesson copy in `lib/studio/content.ts` and in-memory session state in `StudioProvider` (hearts, streak, word-order deck). Topic tabs stay that catalog. The saved list on `/library` and the star on a lesson sentence read and write `saved_sentences` through the same hooks as `/saved`. Routes: `/home`, `/learn`, `/learn/$topic`, `/learn/$topic/$step`, `/practice`, `/practice/speak`, `/practice/done`, `/explore`, `/library`, `/profile`.

**API-backed study** is linked from Explore and from direct routes: `/today`, `/plan`, `/situations`, `/patterns`, `/chunks`, `/dialogues`, `/drills/$patternId`, `/practice/session`, `/export`, `/settings`, `/onboarding`. These screens call `lib/api/routes/*` through TanStack Query hooks in `lib/query/hooks/`. `QueryProvider`, mounted by `routes/_app.tsx`, holds the cache for the signed-in session, so Today, Plan, and Library share fetched data, and a review, chunk edit, or persisted dialogue invalidates the screens it affects.

Browser-local pieces on the API-backed path:

| Piece | Module | Role |
|-------|--------|------|
| Answer match | `lib/practice/answer-matcher.ts` | Scores the typed recall before the grade is posted. |
| Drill items | `lib/drills/drill-generator.ts` | Builds substitution items from the pattern payload returned by the API. |
| Focus queue | `lib/practice/focus-queue.ts` | `sessionStorage` handoff of the sentences a screen wants practiced next. |
| Learner settings | `lib/settings/learner-settings.ts` | `localStorage`: daily limit, session size, retention, speech, theme. |
| Onboarding flag | `lib/onboarding-storage.ts` | `localStorage`. The wizard itself calls `POST /api/dialogues/generate`. |

The next due time for a server chunk is computed only when `POST /api/practice/reviews` runs. The browser sends the grade; it does not write `user_chunks`.

Page analytics is `onedollarstats` in the root route. Error monitoring is `@sentry/tanstackstart-react`, with browser ingest tunneled through `/monitoring` (`routes/monitoring.ts`). Every failure message a learner sees is reported once through `captureOperationalError`: `error` level for our failures (network, 5xx, parse, unexpected throws), `warning` for request or setup failures (HTTP 4xx, empty fields, persistence off, too few drill variants, speech or storage refusal). Correct outcomes such as a wrong drill answer or an empty export stay out.

## API

`backend/src/index.ts` is the composition root: logger, CORS, Neon Auth verification on `/api/*`, error handler, Scalar docs, then route modules.

| Prefix | Role | Caller |
|--------|------|--------|
| `GET /health`, `GET /health/db` | Process up; database accepts a query | Anyone. `/health/db` needs `DATABASE_URL`. |
| `GET /api/situations` | Catalog list, detail, intents | Anonymous. |
| `GET /api/chunks`, `GET /api/chunks/:id` | Chunk library and pattern detail | Anonymous. Signed-in calls add editability and enrollment. |
| `POST /api/chunks`, `PATCH /api/chunks/:id` | Learner-owned chunk create and edit | Signed in. |
| `POST /api/dialogues/generate` | AI dialogue pack | Anonymous. A signed-in caller enrolls persisted chunks. |
| `GET /api/dialogues`, `GET /api/dialogues/:id` | Stored dialogues | Anonymous. Empty list or `501` while persistence is off. |
| `GET /api/practice/due`, `GET /api/practice/plan`, `POST /api/practice/reviews` | Due queue, plan, FSRS grade | Signed in. |
| `GET /api/saved-sentences`, `GET /api/saved-sentences/:id`, `POST /api/saved-sentences`, `DELETE /api/saved-sentences/:id` | The account’s saved sentences. `/saved` and Library’s saved list read and write this table | Signed in. |
| `GET /api/onboarding`, `PUT /api/onboarding` | Whether this account finished onboarding | Signed in. |
| `GET /api/export/anki` | Anki deck text for enrolled or all chunks | Signed in. |

`GET /openapi.json` is a hand-authored OpenAPI 3.1 document in `src/openapi.ts`. `GET /docs` renders it with Scalar. Route handlers do not carry doc annotations; a contract change updates `src/openapi.ts` in the same change.

CORS applies to `/api/*`, `/health`, and `/health/*`. Default origins are `http://localhost:3000` and `https://opensen.taquangkhoi.com` (`CORS_ORIGINS` overrides). Allowed headers include `Authorization`, `sentry-trace`, and `baggage`.

### Auth

`authenticate` (`src/auth/session.ts`) verifies `Authorization: Bearer` through `TokenVerifier` (`src/auth/token-verifier.ts`). The verifier uses `jose` and EdDSA keys from `${NEON_AUTH_BASE_URL}/.well-known/jwks.json`. `iss` and `aud` must be the Neon Auth URL or its origin. `sub` must be a UUID. Handlers read the caller only through `requireUserId` or `optionalUserId`.

No header means anonymous. A malformed, invalid, or expired token is 401 on every `/api` route, including routes that also allow anonymous calls. A token while `NEON_AUTH_BASE_URL` is unset is 503. A JWKS outage is 500.

The Postgres `users` row is a shadow of that `sub`. `ensureLearner` inserts it on the first owned write, with placeholder profile fields. Account name and email live in Neon Auth (`auth.updateUser` on the web). `users.onboarding_completed_at` is the account onboarding flag (`GET`/`PUT /api/onboarding`); null means the wizard is still due. `user_preferences` exists in the schema and has no route writer.

## Where business rules live

| Rule | Owner |
|------|--------|
| Slot grammar, offline dialogue composition, situation match | `mobile/lib/domain/services/` |
| Device FSRS, device recall, device drills, device Anki text | `mobile/lib/domain/services/` and the use cases beside them |
| AI dialogue generation | `backend/src/ai/pipeline/generate-dialogue.ts`: situation normalization, dialogue, chunk extraction. Each model call returns JSON validated with Zod. `createAiProvider` selects the vendor; the live provider is OpenRouter (`AI_PROVIDER`, `AI_MODEL`, `OPENROUTER_API_KEY`). |
| Pack shape and persistence projection | `backend/src/dialogue-packs/generated-pack.ts` and `src/db/dialogue-pack-writer.ts` |
| Server FSRS and the next due time | `backend/src/practice/fsrs-scheduler.ts` (`ts-fsrs`), applied by `src/db/practice-review-repository.ts` on `POST /api/practice/reviews` |
| Server Anki text | `backend/src/export/anki-deck-formatter.ts` |
| Web recall score and web drill assembly | `web/src/lib/practice/answer-matcher.ts`, `web/src/lib/drills/drill-generator.ts` |
| Studio hearts, rewards, and word order | `web/src/lib/studio/model.ts` over static copy in `lib/studio/content.ts` |

Dialog Builder is two implementations of the same product feature. On the phone, `BuildDialogueUseCase` fills the bundled template. On the server, `generateDialoguePack` asks the model, then optionally writes the graph. The web onboarding wizard and the situation builder call the server path.

Practice Plan is also two implementations. The phone schedules in SQLite. The server schedules in Postgres for the web learner. A grade on one side does not move the other side’s `user_chunks` row.

## Data

The content graph is situation → intent → sentence pattern → slots and variants → chunk, plus dialogues whose lines point back at chunks. Ownership columns (`owner_id`, `visibility`, `source_template_id`) mark a curated template versus a learner instance. The full table list and the commitments that drive it are in [Database architecture](docs/database-architecture.md).

### Postgres

Drizzle schema modules under `backend/src/db/schema/`: `users`, `content`, `generation`, `practice`. Runtime access is lazy `getDatabase()` in `src/db/client.ts`. Hosts ending in `.neon.tech` use `drizzle-orm/neon-http`. Other `postgresql://` URLs use postgres.js. Routes that do not touch the database do not require `DATABASE_URL` at startup.

Migrations are checked-in SQL under `backend/drizzle/`. Apply them from `backend/` with `npm run db:migrate`. CLI scripts load gitignored `.env.local` then `.env`; a variable already in the shell wins. Connection order for DDL is `MIGRATION_DATABASE_URL`, then `DATABASE_URL_UNPOOLED`, then `DATABASE_URL`. Neon project policy is `backend/neon.ts`.

Tables that exist and are written by current routes: situations, intents, sentence patterns, pattern intents, slots, variants, chunks, dialogues, dialogue lines, line chunks, AI generation traces, `users` (via `ensureLearner`, and `onboarding_completed_at` via `PUT /api/onboarding`), `user_chunks`, `review_history`.

Tables that exist in Drizzle and are not written by a route today: `user_preferences`, `practice_items`, `practice_attempts`, `embeddings` (pgvector `vector(1536)`). `words`, `chunk_words`, and `audio_assets` are described in the database document and are not in the Drizzle schema.

`DIALOGUE_PERSISTENCE_MODE` defaults to `disabled`. `internal` and `ephemeral` are the modes that write a generated pack. While persistence is off, generate still returns the pack, list returns an empty page, and detail returns 501.

`npm run seed:mobile-catalog` copies the mobile seed bundle into Postgres as public templates. Authored ids (`sit_*`, `pat_*`, …) become stable UUIDs through `uuidFromSeed`.

### SQLite

`AppDatabase` (schema version 1, file `opensen.db`) is the on-device adaptation of the same graph for one learner: no `users` table, `is_template` in place of `owner_id` / `visibility`, and an extra `pattern_situations` link. Learner rows are deleted by repositories; there are no FK cascades. Template rows re-import with `INSERT OR IGNORE`.

`assets/seed/content.json` is the curated catalog. `SeedImporter` loads it when `version` is newer than the copy in `meta`. Authoring rules live in [`mobile/assets/seed/AGENTS.md`](mobile/assets/seed/AGENTS.md).

The same JSON file feeds both stores. After seeding, the phone and the server each have their own rows. There is no replication between them.

## Related checks

| Surface | Check |
|---------|--------|
| Mobile | `flutter analyze`, `flutter test`. CI: `.github/workflows/mobile-ci.yml` (analyze, test, Android APK). |
| Backend | `npm run typecheck`, `npm test` (no database), `npm run test:db` against a pgvector database (`docker-compose.test.yml`, database name `opensen_test` or `*_test`). |
| Web | `npm test`, `npm run lint`, `npm run build`. |
