---
title: Web production called localhost API and CORS blocked the real origin
date: 2026-10-02
category: integration-issues
module: web
problem_type: integration_issue
component: frontend
symptoms:
  - "Explore routes such as /situations show \"Could not reach the server. Check your connection and try again.\""
  - "Browser fetch targets http://localhost:3000/api/* from https://opensen.taquangkhoi.com"
  - "Direct curl to https://api.opensen.taquangkhoi.com/api/situations returns 200 while the UI still fails"
  - "Production API logs show almost no /api/situations traffic from real users"
root_cause: config_error
resolution_type: code_fix
severity: high
tags:
  - web
  - api-client
  - cors
  - vercel
  - production
related_components:
  - backend
  - api_layer
---

# Web production called localhost API and CORS blocked the real origin

## Problem

Signed-in web routes that load data through `createDefaultApiClient()` (for example `/situations`) showed a network error banner even though the public Hono API was healthy. Two independent misconfigurations had to be fixed before the browser could succeed end to end.

## Symptoms

- Red banner: **Could not reach the server. Check your connection and try again.** (`formatApiErrorMessage` maps `ApiError` kind `network` in `web/lib/api/client.ts`).
- Production JavaScript had no inlined `NEXT_PUBLIC_OPENSEN_API_URL`; the client fell back to `http://localhost:3000`, so fetches never reached `https://api.opensen.taquangkhoi.com`.
- `curl` against the API with `Origin: https://opensen.taquangkhoi.com` returned **no** `access-control-allow-origin` header, while `Origin: http://localhost:3000` did — so even after correcting the base URL, the browser would still block responses until CORS allowed the web origin.
- Sentry project `opensen-web` had no unresolved issues matching this failure (operational reporting was wired, but the failure mode did not surface as a distinct grouped issue beyond generic network errors).

## What Didn't Work

- Treating the banner as a user connectivity problem — the API responded 200 to server-side probes.
- Assuming missing `NEXT_PUBLIC_OPENSEN_API_URL` on Vercel alone was the fix — production API deploy also relied on backend defaults that only listed `http://localhost:3000` when `CORS_ORIGINS` was unset on Vercel.

## Solution

Fixed in [PR #39](https://github.com/KeiosStarqua/opensen/pull/39) (merged 2026-10-02).

**Web — default base URL by build mode** (`web/lib/api/client.ts`):

```typescript
export const PRODUCTION_API_URL = "https://api.opensen.taquangkhoi.com";
export const LOCAL_API_URL = "http://localhost:3000";

export function resolveApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_OPENSEN_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  return process.env.NODE_ENV === "production"
    ? PRODUCTION_API_URL
    : LOCAL_API_URL;
}
```

**Backend — default CORS origins include production web** (`backend/src/lib/env.ts`):

```typescript
const DEFAULT_CORS_ORIGINS =
  'http://localhost:3000,https://opensen.taquangkhoi.com'
```

Tests: `web/lib/api/client.test.ts` (production vs dev defaults), `backend/src/lib/env.test.ts` (both origins in default list).

## Why This Works

The web client builds request URLs as `` `${baseUrl}${path}` ``. Without a public default, production bundles pointed at localhost, which the user's browser cannot reach — hence `fetch` throws and the UI shows the network message.

Separately, Hono's CORS middleware only echoes origins present in `env.CORS_ORIGINS`. The production API project did not set that variable, so the effective allowlist was the old single-origin default. Browser calls from `https://opensen.taquangkhoi.com` were rejected at the CORS layer even when the URL was correct.

Hardcoding the public API URL in the repo is intentional: it is not secret, avoids a required Vercel env for the common case, and `NEXT_PUBLIC_OPENSEN_API_URL` remains an override for previews or forks.

## Prevention

1. **Smoke from the browser origin after web deploy** — DevTools Network tab on `/situations` (signed in) should show `https://api.opensen.taquangkhoi.com/api/situations` with a 200 and `access-control-allow-origin: https://opensen.taquangkhoi.com`.
2. **Keep defaults aligned** — When adding a new public web host, add it to `DEFAULT_CORS_ORIGINS` (or set `CORS_ORIGINS` on the API Vercel project explicitly).
3. **Do not rely on Sentry alone for this class of bug** — Network failures may be reported via `captureOperationalError`, but absence of a grouped issue does not prove the API URL or CORS is correct; verify the request URL in production bundles or Network tab.
4. **Local dev unchanged** — `npm run dev` in `web/` still targets `http://localhost:3000`; run `backend/` with `vercel dev` and include the Next origin in backend CORS when using a non-default port.

## Related

- API client contract: `web/lib/api/client.ts`, `web/AGENTS.md` (all HTTP via `web/lib/api/`).
- CORS wiring: `backend/src/index.ts`, `backend/AGENTS.md`.
- Env management pattern (secrets vs public URLs): `docs/solutions/architecture-patterns/doppler-vercel-secret-management.md` — public API URL does not need Doppler; override env remains optional.
