# mobile/assets/seed/

## Purpose

The curated **content graph** that ships inside the app: intents, situation templates, sentence patterns with slots and variants, template chunks and template dialogues. Imported into SQLite once per `version` by `lib/data/seed/seed_importer.dart`.

## Ownership

- `content.json` — the only data file; parsed by `lib/data/seed/seed_content.dart` (`SeedBundle`)
- Authoring rules below are enforced by `SeedBundle.validate()` and `test/data/seed_content_test.dart`

## Local Contracts

- **Ids are authored** (`sit_*`, `pat_*`, `chk_*`, `dlg_*`, `int_*`) and stable across versions; slot ids derive as `<patternId>__<slot>`, variant ids as `<slotId>__<index>`, line ids as `<dialogueId>__<position>`.
- **Slots are `{name}`** in `template` and dialogue `text`; names start with a letter, then letters/digits/underscore. Every slot in a pattern template must be declared under `slots` with ≥ 1 variant; the first variant is the **default fill**.
- **Template chunk text = pattern rendered with default fills.** Chunks without `patternId` are fixed sentences.
- **Dialogue lines:** every `{slot}` in a line must be fillable by a pattern behind one of the line's `chunkIds`. Chunk links belong on `self` lines (what the learner rehearses). Keep the full chunk sentence inside the line text so highlighting works.
- **Slot names shared across patterns in one dialogue share one fill** (e.g. `place` in directions). Use distinct names when two frames must not receive the same answer (`suggestion` vs `availability`).
- **Prompts** (`situations[].prompts`) reference slot names of that situation's patterns; the question is what the Dialog Builder asks.
- Meanings are function-focused English glosses that stay true for any fill ("Say what you care about most", not "Say you like robotics").
- Bump `version` whenever content changes; the importer only adds rows (`INSERT OR IGNORE`), so renaming an id creates a new row.

## Work Guidance

- Add a situation: template with roles/goal/tone/level/prompts → 3–5 patterns with 4+ variants each → one chunk per pattern rendered with defaults (+ a few fixed chunks) → an 8–12 line dialogue alternating `other`/`self`.
- Reuse patterns across situations via `situations: [...]` instead of duplicating frames; add situation-specific variants to the shared slot.

## Verification

- `flutter test test/data/seed_content_test.dart` from `mobile/`
- Quick structural check without Flutter: `node -e "JSON.parse(require('fs').readFileSync('mobile/assets/seed/content.json','utf8'))"` from the repo root

## Child DOX Index

_(none)_
