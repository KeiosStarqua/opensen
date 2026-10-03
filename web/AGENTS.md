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
- API base URL: `resolveApiBaseUrl()` in `lib/api/client.ts`. `NEXT_PUBLIC_OPENSEN_API_URL` overrides; otherwise production builds call the public API `https://api.opensen.taquangkhoi.com` (hardcoded, not secret, no Vercel env needed) and non-production builds call `http://localhost:3000`. The API must list the web origin in `CORS_ORIGINS` (backend default already includes `https://opensen.taquangkhoi.com`).
- Page analytics: `onedollarstats` initialized in root layout via `components/onedollarstats-analytics.tsx`; env vars documented in `.env.example` (`NEXT_PUBLIC_ONEDOLLARSTATS_*`)
- Error monitoring and tracing: `@sentry/nextjs` (`instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`). `next.config.ts` wraps config with `withSentryConfig` from `@sentry/nextjs/config` (SDK 11 export) and sets `tunnelRoute: "/monitoring"`, so the production browser ingest endpoint is `https://opensen.taquangkhoi.com/monitoring`. Project is `do-quyen` / `opensen-web`. DSNs and source-map upload use `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` (see `.env.example`). Browser traces propagate to `localhost`, `https://api.opensen.taquangkhoi.com`, and same-origin requests. `proxy.ts` does not match `/monitoring`.
- Error reporting rule: every failure message a learner can see is sent to Sentry exactly once, through `captureOperationalError` in `lib/observability/operational-error.ts` (`@sentry/core`, the client registered by `Sentry.init`). Level `error` means our side broke (network, invalid JSON, HTTP >= 500, auth SDK 5xx, unexpected throw). Level `warning` means the request or setup caused it (HTTP 4xx, auth SDK 4xx, empty form field, dialogue persistence off, speech or storage refusal). Owners:
  - API: `createDefaultApiClient` reports every failed request through `reportApiError` (`lib/api/client.ts`), with the thrown `fetch` message and bearer shape/length (never the token). The Anki download (`lib/query/hooks/export.ts`) calls `reportApiError` too. Screens on these paths only render the banner and must not report again.
  - Non-API throws inside query or mutation functions: `QueryCache` / `MutationCache` `onError` in `lib/query/query-client.ts` (`reportUnexpectedQueryError`, skips `ApiError`).
  - Auth forms (sign-in, sign-up, account name): `reportAuthFormError` (`lib/observability/auth-form-error.ts`).
  - Speech: all browser TTS goes through `speak` in `lib/speech/speak.ts` (studio uses it via `components/studio/speak.ts`); `interrupted`/`canceled` from our own cancel are not reported.
  - Storage: `lib/settings/learner-settings.ts` (read once per load, every failed write) and `lib/practice/focus-queue.ts` (corrupt handoff).
  - Persistence-off messages in `components/onboarding/` and `components/dialogues/dialogue-builder.tsx`; the too-few-variants message in `components/drills/substitution-drill-session.tsx`.
  - Render crashes: `app/error.tsx` and `app/global-error.tsx`. Uncaught errors and rejections: the SDK's global handlers; server request errors: `onRequestError` in `instrumentation.ts`.
  - Not reported, because they are correct outcomes rather than failures: a wrong drill answer ("Not quite — try again."), "Nothing to export", and empty lists.
- Server state: [TanStack Query](https://tanstack.com/query/latest) v5 (`@tanstack/react-query`, devtools in development only). `QueryProvider` (`lib/query/query-provider.tsx`) is mounted by `app/(app)/layout.tsx` and owns one `QueryClient` plus one `createDefaultApiClient` instance (`useApiClient()`). Leaving `(app)` (sign-out redirects to `/auth/*`) unmounts it, which drops the cache so it never crosses learners; do not hoist the provider into the root layout. Defaults in `lib/query/query-client.ts`: `staleTime` 30s, queries retry only `isRetryable` failures up to 2 times (each attempt is a separate Sentry report from the client), mutations never retry. Keys come only from `queryKeys` (`lib/query/query-keys.ts`), prefixed by domain (`situations`, `chunks`, `dialogues`, `practice`, `savedSentences`); `practiceSessionDeck` sits outside `practice` on purpose so grading does not reshuffle a running session.
- Auth: Managed Better Auth via `@neondatabase/auth` SDK methods (`createNeonAuth`, `auth.signIn.email`, `auth.signUp.email`, `auth.getSession`, `auth.updateUser`, `auth.signOut`). Server instance in `lib/auth/server.ts` (`NEON_AUTH_BASE_URL` plus `NEON_AUTH_COOKIE_SECRET`, both required at build). Browser client in `lib/auth/client.ts`. Email forms: `app/auth/sign-in` and `app/auth/sign-up`. Account name + sign-out: `app/account/settings`. Session proxy in `proxy.ts` protects app routes (study shell, onboarding, settings, account) and leaves `/` and `/auth/*` public. API proxy: `app/api/auth/[...path]`

<!-- BEGIN:nextjs-agent-rules -->
## Next.js guidance

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Work Guidance

- Prefer Server Components by default; add `"use client"` only when needed
- Keep marketing and authenticated app routes separated via route groups as features land
- All backend HTTP calls go through `lib/api/` (`createDefaultApiClient` or route helpers under `lib/api/routes/`). Do not scatter raw `fetch` with hand-rolled auth headers.
- Components read and write server state only through the hooks in `lib/query/hooks/` (`situations`, `chunks`, `dialogues`, `practice`, `export`, `saved-sentences`). Do not fetch in `useEffect` or hold API responses in `useState`. Query functions wrap route helpers with `unwrapApiResult`; render errors with `queryErrorMessage`. Show a load error only when no data is cached, so a failed background refetch keeps the screen usable. A mutation's `onSuccess` invalidates every domain whose data it changes (review → `practice`; chunk create/edit → chunk lists, edit also `practice`; persisted dialogue generation → chunks, practice, dialogues, situations; saving a heard sentence → `savedSentences`).
- Learner identity is the Neon Auth session. `createDefaultApiClient` sends `Authorization: Bearer <jwt>` from `getSessionToken` (`lib/api/session-token.ts`, which reads `authClient.getSession()` → `session.token`). Signed-out calls go out without the header, and user-scoped API routes answer 401. Use `getSessionToken` only from client components or hooks. The one raw `fetch` (Anki export download, `lib/query/hooks/export.ts`) uses it too and saves `opensen-anki-${scope}.apkg` (`application/apkg`). `AnkiExportPanel` only chooses the scope and calls `useAnkiExport`.
- The signed-in shell is the study UI in `components/studio/` and `components/app-shell.tsx`. Primary routes: `/home`, `/learn`, `/learn/[topic]`, `/learn/[topic]/[step]`, `/practice`, `/practice/speak`, `/practice/done`, `/explore`, `/library`, `/profile`, `/saved`, `/saved/[id]`. `/saved` is where a signed-in learner pastes a sentence heard or read outside the app; `/saved/[id]` opens that sentence and enters the existing lesson practice deck (`startLessonPractice` → `/practice`). Lesson copy and the practice deck live in `lib/studio/content.ts`. Older recall, plan, situation, and chunk screens stay reachable from Explore (`/today`, `/plan`, `/situations`, `/patterns`), which also links to `/saved`.
- Sign-in and sign-up are the email forms at `/auth/sign-in` and `/auth/sign-up` (server actions on `auth`). Account name edits live at `/account/settings`. After sign-in or sign-up, return to the requested path when `redirectTo` is present, otherwise `/home`.
- Study illustrations live in `public/studio/` and are mapped by `components/studio/scenes.tsx`. Sen is the cream round character with the green leaf beret, glossy black eyes, and rosy cheeks. New scenes stay in that pastel storybook style and contain no UI chrome or readable text. `docs/DESIGN.md` still governs the calmer recall and plan surfaces.
- The marketing page is `components/landing-page.tsx`, with storybook art in `public/landing/`. Readable product copy on that page stays in HTML. Landing headlines live in `lib/site.ts` and match the Landing copy section of `docs/product-strategy.md`.
- The brand mark is `public/brand/logo.png` (transparent square crop of the lotus). Render it through `components/brand-mark.tsx` (`BrandMark`, and `LogoMark` in the study shell). Favicon and Apple touch icon are `app/icon.png` and `app/apple-icon.png`.
- UI icons: [`@phosphor-icons/react`](https://github.com/phosphor-icons/react). Import the named component (`HorseIcon`). In Server Components, import from `@phosphor-icons/react/ssr` (those variants do not read `IconContext`). When the package is present, `next.config.ts` sets `optimizePackageImports: ["@phosphor-icons/react"]` so Next compiles only the icons in use. Default `weight="regular"`; `weight="fill"` for the selected or active state of the same icon. Size and color go through the icon props (`size`, `color`, or `currentColor`). Do not add Material, Lucide, Heroicons, or hand-rolled `<svg>` icons for UI chrome.

## Verification

- `npm run lint` from `web/`
- `npm run build` from `web/`
- `npm run test` from `web/` (API client, `lib/query`, observability, and speech unit tests)

## Child DOX Index

_(none)_
