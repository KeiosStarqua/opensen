---
inclusion: fileMatch
fileMatchPattern: ['web/**/*.{ts,tsx}']
---

# Web UI errors go to Sentry

Handled failures the learner can see must be reported. A red banner alone is not enough.

Use `captureOperationalError` from `web/lib/observability/operational-error.ts`. It calls `@sentry/core` `captureException`, which is the client `Sentry.init` already registered for browser and server.

## Report

- Network failure, invalid JSON, and HTTP status >= 500 from `createDefaultApiClient` (already wired — do not capture again in the component)
- Auth SDK failures in sign-in, sign-up, and account name update
- Any new `fetch` outside `lib/api/` (network, parse, HTTP >= 500)
- Render crashes in `app/error.tsx` and `app/global-error.tsx` (already wired)

## Do not report

- HTTP 4xx
- Empty-field validation (`Email address must be provided.`, `Name must be provided.`)
- Expected empty states (nothing to export, pattern has too few variants, persistence is off)

```typescript
// ❌ BAD — banner only, Sentry never sees it
if (!result.ok) {
  setError(formatApiErrorMessage(result.error));
  return;
}

// ✅ GOOD — API screens keep the banner; the client reports operational errors
const client = createDefaultApiClient();
const result = await client.request("/api/practice/due");
if (!result.ok) {
  setError(formatApiErrorMessage(result.error));
  return;
}

// ✅ GOOD — fetch that cannot use the JSON client
if (!isOperationalApiError(error)) return;
captureOperationalError(error, {
  surface: "anki-export",
  kind: error.kind,
  status: error.status,
  path: "/api/export/anki",
});
```

Tags to include when you call the helper yourself: `surface`, and when you have them `kind`, `status`, `path`, `action`. Do not attach learner ids, passwords, or response bodies.
