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

## Routes (stubs)

| Prefix | Feature |
|--------|---------|
| `/health` | Liveness |
| `/api/situations` | Situation Coverage |
| `/api/chunks` | Chunk Library |
| `/api/dialogues` | Dialog Builder |
| `/api/practice` | Practice Plan (SRS) |
| `/api/export` | Anki export |

List endpoints return empty collections; detail/mutation routes return `501` until implemented.

Schema contract: [`docs/database-architecture.md`](../docs/database-architecture.md).
