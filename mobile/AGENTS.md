# mobile/

## Purpose

Flutter **mobile client** for OpenSen. Primary surface for dialog building, chunk library, situation browsing, practice plans, and Anki export as those features are implemented.

## Ownership

- Dart/Flutter source under `lib/`
- Platform shells: `android/`, `ios/`, `linux/`, `macos/`, `web/`, `windows/`
- App-level `pubspec.yaml`, `analysis_options.yaml`, and `test/`
- Product behavior contracts are defined in [`docs/`](../docs/); this tree owns implementation

## Local Contracts

- Run from this directory: `flutter pub get`, `flutter run`, `flutter test`
- Package name: `opensen` (see `pubspec.yaml`)
- Match UI and domain naming to feature names in [`docs/features.md`](../docs/features.md)

## Work Guidance

## Verification

- `flutter test` from `mobile/`

## Child DOX Index

No nested AGENTS.md yet. Add under `lib/` when a module boundary gains its own rules (e.g. chunk engine, export pipeline).
