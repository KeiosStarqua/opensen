# opensen-web

[TanStack Start](https://tanstack.com/start) client for OpenSen (landing + web application), built with Vite and deployed to Vercel through Nitro.

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

Copy `web/.env.example` to `web/.env.local`. Browser-visible values use the `VITE_` prefix and are inlined at build time; server-only values (`NEON_AUTH_*`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`) never take that prefix. Set `VITE_ONEDOLLARSTATS_HOSTNAME` to the domain registered in [onedollarstats.com](https://onedollarstats.com); use `VITE_ONEDOLLARSTATS_DEVMODE=true` locally to verify events.

**Backend API:** production builds call `https://api.opensen.taquangkhoi.com` by default; `npm run dev` calls `http://localhost:3000` (`backend/`). Set `VITE_OPENSEN_API_URL` to override either default. `CORS_ORIGINS` in the backend must include this app (`http://localhost:3001` locally). All browser calls to `/api/*` go through `src/lib/api/`, not ad-hoc `fetch`.

**Auth:** set `NEON_AUTH_BASE_URL` (Neon Console → Auth → Configuration) and `NEON_AUTH_COOKIE_SECRET` (`openssl rand -base64 32`) in `web/.env.local` and in the Vercel project. The server reads them at runtime. Sign-in lives at `/auth/sign-in`. Add this app's origin to Neon Auth trusted domains before using a non-local host.

**Deploy:** Vercel detects TanStack Start (`vercel.json`) and Nitro emits the Vercel output. Rename any `NEXT_PUBLIC_*` variables in the Vercel project to their `VITE_*` names.

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server on port 3001 |
| `npm run build` | Production build (`.output/`, or `.vercel/output` on Vercel) |
| `npm run start` | Serve the local production build (`node .output/server/index.mjs`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests (`src/**/*.test.ts`) |
