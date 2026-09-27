# opensen-web

Next.js App Router client for OpenSen (landing + web application).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `web/.env.example` to `web/.env.local` and set `NEXT_PUBLIC_ONEDOLLARSTATS_HOSTNAME` to the domain registered in [onedollarstats.com](https://onedollarstats.com). Use `NEXT_PUBLIC_ONEDOLLARSTATS_DEVMODE=true` locally to verify events (Dev Mode on the dashboard).

**Backend API:** set `NEXT_PUBLIC_OPENSEN_API_URL` to your Hono API origin (default `http://localhost:3000` when running `backend/` with Vercel dev). Ensure `CORS_ORIGINS` in the backend includes this Next.js app (e.g. `http://localhost:3001` when Next runs on the default port). All browser calls to `/api/*` should go through `lib/api/` — not ad-hoc `fetch`.

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests (`lib/api/`) |
