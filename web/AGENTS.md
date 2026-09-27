# web/

## Purpose

Next.js **web client** for OpenSen: marketing/landing and the authenticated web application in one App Router project.

## Ownership

- App Router UI under `app/`
- Static assets under `public/`
- Next.js / Vercel web deploy config for this package
- Product behavior lives in [`docs/`](../docs/); this tree owns web UI implementation
- API calls go to [`backend/`](../backend/) — do not reimplement server business logic here

## Local Contracts

- Framework: [Next.js App Router](https://nextjs.org/docs/app) (TypeScript, Tailwind CSS, ESLint)
- Package name: `opensen-web` (see `package.json`)
- Production host: `https://opensen.taquangkhoi.com/`
- Run from this directory: `npm install`, `npm run dev`, `npm run build`, `npm run lint`
- Import alias: `@/*`
- Landing and app share this project; prefer route groups (e.g. `(marketing)`, `(app)`) when splitting surfaces
- Page analytics: `onedollarstats` initialized in root layout via `components/onedollarstats-analytics.tsx`; env vars documented in `.env.example` (`NEXT_PUBLIC_ONEDOLLARSTATS_*`)
- Error monitoring and tracing: `@sentry/nextjs` (`instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`, `app/global-error.tsx`). `next.config.ts` wraps config with `withSentryConfig` from `@sentry/nextjs/config` (SDK 11 export) and sets `tunnelRoute: "/monitoring"`, so the production browser ingest endpoint is `https://opensen.taquangkhoi.com/monitoring`. Project is `do-quyen` / `opensen-web`. DSNs and source-map upload use `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` (see `.env.example`). Browser traces propagate to `localhost`, `https://api.opensen.taquangkhoi.com`, and same-origin requests. `proxy.ts` does not match `/monitoring`.
- Auth: Managed Better Auth via `@neondatabase/auth` SDK methods (`createNeonAuth`, `auth.signIn.email`, `auth.signUp.email`, `auth.getSession`, `auth.updateUser`, `auth.signOut`). Server instance in `lib/auth/server.ts` (`NEON_AUTH_BASE_URL` plus `NEON_AUTH_COOKIE_SECRET`, both required at build). Browser client in `lib/auth/client.ts`. Email forms: `app/auth/sign-in` and `app/auth/sign-up`. Account name + sign-out: `app/account/settings`. Session proxy in `proxy.ts` protects app routes (study shell, onboarding, settings, account) and leaves `/` and `/auth/*` public. API proxy: `app/api/auth/[...path]`

<!-- BEGIN:nextjs-agent-rules -->
## Next.js guidance

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Work Guidance

- Prefer Server Components by default; add `"use client"` only when needed
- Keep marketing and authenticated app routes separated via route groups as features land
- All backend HTTP calls go through `lib/api/` (`createDefaultApiClient` or route helpers under `lib/api/routes/`). Do not scatter raw `fetch` with hand-rolled `X-User-Id` headers.
- Temporary learner identity lives in `localStorage` (`opensen:learner-id`); only import learner-id helpers from client components or hooks.
- The signed-in shell is the study UI in `components/studio/` and `components/app-shell.tsx`. Primary routes: `/home`, `/learn`, `/learn/[topic]`, `/learn/[topic]/[step]`, `/practice`, `/practice/speak`, `/practice/done`, `/explore`, `/library`, `/profile`. Lesson copy and the practice deck live in `lib/studio/content.ts`. Older recall, plan, situation, and chunk screens stay reachable from Explore (`/today`, `/plan`, `/situations`, `/patterns`).
- Sign-in and sign-up are the email forms at `/auth/sign-in` and `/auth/sign-up` (server actions on `auth`). Account name edits live at `/account/settings`. After sign-in or sign-up, return to the requested path when `redirectTo` is present, otherwise `/home`.
- Learner API calls still send `X-User-Id` from the local learner id in `lib/api/` until the backend verifies the Neon session.
- Study illustrations live in `public/studio/` and are mapped by `components/studio/scenes.tsx`. Sen is the cream round character with the green leaf beret, glossy black eyes, and rosy cheeks. New scenes stay in that pastel storybook style and contain no UI chrome or readable text. `docs/DESIGN.md` still governs the calmer recall and plan surfaces.
- The marketing page is `components/landing-page.tsx`, with storybook art in `public/landing/`. Readable product copy on that page stays in HTML. Landing headlines live in `lib/site.ts` and match the Landing copy section of `docs/product-strategy.md`.
- The brand mark is `public/brand/logo.png` (transparent square crop of the lotus). Render it through `components/brand-mark.tsx` (`BrandMark`, and `LogoMark` in the study shell). Favicon and Apple touch icon are `app/icon.png` and `app/apple-icon.png`.

## Verification

- `npm run lint` from `web/`
- `npm run build` from `web/`
- `npm run test` from `web/` (API client unit tests)

## Child DOX Index

_(none)_
