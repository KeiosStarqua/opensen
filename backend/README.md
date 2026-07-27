# OpenSen backend

Hono API for OpenSen, deployed on [Vercel](https://hono.dev/docs/getting-started/vercel).

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Uses [Vercel CLI](https://vercel.com/docs/cli) via `npx` (or install globally).

## Develop

```bash
npm run dev
```

Open `http://localhost:3000` — root returns the API index; `GET /health` is the liveness check.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | `vercel dev` local server |
| `npm run typecheck` | TypeScript check |
| `npm run build` | `vercel build` |
| `npm run deploy` | `vercel deploy` |

## AI (OpenRouter first)

Multi-provider surface under `src/ai/`. Set in `.env`:

```bash
AI_PROVIDER=openrouter
AI_MODEL=openai/gpt-4o-mini
OPENROUTER_API_KEY=sk-or-...
```

Generate a pack (Chinese crash defaults: `vi` → `zh`):

```bash
curl -s http://localhost:3000/api/dialogues/generate \
  -H 'content-type: application/json' \
  -d '{"situation":"Gặp sếp lần đầu ở Thâm Quyến","nativeLanguage":"vi","targetLanguage":"zh","level":"beginner"}'
```

## Routes

| Prefix | Feature |
|--------|---------|
| `/health` | Liveness |
| `/api/situations` | Situation Coverage (stub) |
| `/api/chunks` | Chunk Library (stub) |
| `/api/dialogues` | Dialog Builder — `POST /generate` live |
| `/api/practice` | Practice Plan (SRS, stub) |
| `/api/export` | Anki export (stub) |

Schema contract: [`docs/database-architecture.md`](../docs/database-architecture.md).
