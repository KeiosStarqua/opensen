# opensen-web

Next.js App Router client for OpenSen (landing + web application).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `web/.env.example` to `web/.env.local` and set `NEXT_PUBLIC_ONEDOLLARSTATS_HOSTNAME` to the domain registered in [onedollarstats.com](https://onedollarstats.com). Use `NEXT_PUBLIC_ONEDOLLARSTATS_DEVMODE=true` locally to verify events (Dev Mode on the dashboard).

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
