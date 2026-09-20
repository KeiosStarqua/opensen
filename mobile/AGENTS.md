# mobile/

## Purpose

Flutter **mobile client** for OpenSen. v1 is **fully offline**: bundled situation content, local SQLite, FSRS scheduling and text-to-speech run on-device with no backend or network. Surfaces: Situations (Dialog Builder), Chunk Library, Substitution Drills, Recall Practice, Practice Plan, Anki export, Settings, Onboarding.

## Ownership

- Dart/Flutter source under `lib/`, tests under `test/`, seed content under `assets/seed/`
- Platform shells: `android/`, `ios/`, `linux/`, `macos/`, `web/`, `windows/` (web is not a supported target: `sqflite` has no web implementation)
- App-level `pubspec.yaml`, `analysis_options.yaml`, `.gitignore`
- Product behavior contracts are defined in [`docs/`](../docs/); this tree owns implementation. Plan: [`docs/plans/2026-09-20-001-feat-mobile-offline-v1-plan.md`](../docs/plans/2026-09-20-001-feat-mobile-offline-v1-plan.md)
- CI: [`.github/workflows/mobile-ci.yml`](../.github/workflows/mobile-ci.yml) (analyze, test, Android APK; optional iOS)

## Local Contracts

- Run from this directory: `flutter pub get`, `flutter run`, `flutter analyze`, `flutter test`. Commit the regenerated `pubspec.lock`.
- Package name: `opensen`. Match UI and domain naming to [`docs/features.md`](../docs/features.md).
- **Layers (Clean Architecture, no code generation):**
  - `lib/domain/` — pure Dart. Entities, repository interfaces, services (`fsrs/`, `slot_template`, `dialogue_composer`, `drill_generator`, `drill_session`, `practice_item_factory`, `practice_session`, `answer_matcher`, `anki_deck_formatter`, `situation_matcher`, `clock`, `id_generator`) and use cases. No Flutter, plugin or `sqflite` imports.
  - `lib/data/` — SQLite implementation. Imports `sqflite_common` only (never the `sqflite` plugin) so repositories run on the host with `sqflite_common_ffi`. Schema lives in `db/app_database.dart`; seed parsing/import in `seed/`.
  - `lib/core/` — composition root: `bootstrap.dart` (open DB, import seed, load settings), `di/providers.dart` (all Riverpod providers and use-case wiring), `routing/`, `theme/`, `platform/` (TTS via `flutter_tts`, share via `share_plus`), `util/` (uuid).
  - `lib/features/<surface>/` — screens and per-feature providers only. Business rules go in `domain`.
- **Riverpod:** `Provider` / `FutureProvider(.family)` / `Notifier` only. No `StateProvider`, no family `Notifier`s, no codegen — keeps the code valid across Riverpod 2.x/3.x. Transient session state (drills, practice) lives in domain session classes held by `ConsumerStatefulWidget`s.
- **Routing:** `go_router` with `StatefulShellRoute.indexedStack` for the four tabs; detail routes are root-level so they cover the bottom bar. Paths live in `core/routing/app_routes.dart`; `/chunks/new` is declared before `/chunks/:id`.
- **Scheduling:** FSRS-5 in `domain/services/fsrs/` (published default weights, learning steps 1m/10m, relearning 10m). Intervals are derived from stability at scheduling time; `user_chunks` stores state, `review_history` is append-only. Do not hand-roll a different scheduler; swap implementations behind `FsrsScheduler`.
- **Persistence rules:** ids are client-generated UUIDs; timestamps are ISO-8601 UTC strings; template rows are `INSERT OR IGNORE` on re-seed; learner data is deleted explicitly by repositories (no FK cascades). Settings live in the `meta` table under `settings.*`.
- **Plan membership:** a chunk is in the Practice Plan only when a `user_chunks` row exists (explicit enrolment). Due = `next_review IS NULL OR next_review <= now`.
- **Platform seams:** `SpeechSynthesizer` and `ExportSink` are the only plugin-facing abstractions; tests override them (`SilentSpeechSynthesizer`, recording sink).

## Work Guidance

- Add a surface: domain use case first (testable without Flutter), then a provider in the feature folder, then the screen. Invalidate the affected `FutureProvider`s after writes (`invalidateChunkViews`, `invalidatePracticeViews`, `enrolledChunkIdsProvider`).
- Schema changes: bump `AppDatabase.schemaVersion`, add statements in `onUpgrade`, keep column names aligned with [`docs/database-architecture.md`](../docs/database-architecture.md).
- Seed content changes: follow [`assets/seed/AGENTS.md`](assets/seed/AGENTS.md) and bump `version` in `content.json`.
- Prefer `const` widgets and explicit `ColorScheme`/`InputDecoration` helpers in `core/theme/app_theme.dart` over new theme extensions.

## Verification

- `flutter analyze` from `mobile/` — errors and warnings must be zero; lint infos are non-fatal in CI (`--no-fatal-infos`), clear them with `dart fix --apply`.
- `flutter test` from `mobile/` — `test/domain` (pure Dart), `test/data` (SQLite via `sqflite_common_ffi`; Linux needs `libsqlite3-dev`), `test/features` (widget tests on in-memory fakes from `test/helpers/fakes.dart`).
- CI: `.github/workflows/mobile-ci.yml` on every PR touching `mobile/**`; uploads `app-release.apk` (debug-signed).

## Child DOX Index

| Path | Scope |
|------|-------|
| [`assets/seed/AGENTS.md`](assets/seed/AGENTS.md) | Bundled content graph: JSON schema and authoring rules |
