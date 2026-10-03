---
inclusion: fileMatch
fileMatchPattern: ['web/**/*.{ts,tsx}']
---

# Web UI errors go to Sentry

Every failure message a learner can see is reported to Sentry exactly once. A red banner alone is not enough.

Use `captureOperationalError(error, tags, extra, level)` from `web/src/lib/observability/operational-error.ts`. It calls `@sentry/core` `captureException`, which is the client `Sentry.init` already registered for browser and server.

## Levels

- `error` — our side broke: network failure, invalid JSON, HTTP >= 500, auth SDK 5xx, an unexpected throw
- `warning` — the request or setup caused it: HTTP 4xx, auth SDK 4xx, empty form field, dialogue persistence off, pattern with too few variants, speech or storage refusal

## Already wired (do not capture again)

- Every failed request from `createDefaultApiClient` (`reportApiError`), and the Anki download
- Non-`ApiError` throws in query or mutation functions (`QueryCache` / `MutationCache` in `lib/query/query-client.ts`)
- Auth forms via `reportAuthFormError`
- Browser speech via `speak` in `lib/speech/speak.ts`
- Render crashes in the router error component `src/components/route-error.tsx`

## Do not report

Correct outcomes that are not failures: a wrong drill answer, "Nothing to export", empty lists.

```typescript
// ❌ BAD — raw fetch, banner only, Sentry never sees it
const response = await fetch(url);
if (!response.ok) setError("Failed");

// ✅ GOOD — API screens render the banner; the client already reported it
const result = await client.request("/api/practice/due");
if (!result.ok) {
  setError(formatApiErrorMessage(result.error));
  return;
}

// ✅ GOOD — a new non-API failure the learner sees
captureOperationalError(
  new Error(message),
  { surface: "dialog-builder", reason: "persistence-off" },
  {},
  "warning",
);
```

Tags: `surface`, and when you have them `kind`, `status`, `path`, `action`, `reason`. Do not attach learner ids, tokens, passwords, or response bodies.
