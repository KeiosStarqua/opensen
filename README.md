# OpenSen

**Open Sentence** — speak English without translating in your head.

OpenSen turns conversations you actually need into reusable sentence patterns you can remember, adapt, and speak automatically. **Chunking** is the mechanism: whole sentences and native pre-assembled phrases with swappable slots, retrieved automatically instead of built word-by-word while speaking.

## Features

- **Dialog Builder** — memorization-ready dialogs and speeches
- **Chunk Library** — high-frequency native phrases with swap patterns
- **Situation Coverage** — real-world scenarios (small talk, ordering, travel, …)
- **Substitution Drills** — keep the frame, swap the slot
- **Recall Practice** — produce the sentence, not just recognize it
- **Practice Plan** — spaced repetition schedules (FSRS, per chunk)
- **Anki export** — study chunks outside the app

Full product docs: [`docs/`](docs/).

## Mobile app

The Flutter app lives in [`mobile/`](mobile/).

```bash
cd mobile
flutter pub get
flutter run
```

## Backend API

Hono on Vercel lives in [`backend/`](backend/).

```bash
cd backend
npm install
npm run dev
```
