import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/types";
import { captureOperationalError } from "@/lib/observability/operational-error";

import { shouldRetryQuery } from "./api-query";

/** Data younger than this is served from cache without a background refetch. */
export const DEFAULT_STALE_TIME_MS = 30_000;

/**
 * Sentry report for a query or mutation that threw something other than an
 * `ApiError` (a bug in a query function, drill assembly, a file download).
 * `ApiError` is skipped: the API client already reported it.
 */
export function reportUnexpectedQueryError(
  error: unknown,
  source: "query" | "mutation",
  key: readonly unknown[] | undefined,
): void {
  if (error instanceof ApiError) return;
  captureOperationalError(error, {
    surface: source,
    // The first key segment is the domain (`situations`, `chunks`, …).
    domain: typeof key?.[0] === "string" ? key[0] : undefined,
  });
}

/**
 * One client per mounted `QueryProvider`. The signed-in app provider lives in
 * the `(app)` layout, so leaving it (sign-out redirects to `/auth/*`) drops
 * that cache. Marketing mounts a separate client for the landing CTA.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) =>
        reportUnexpectedQueryError(error, "query", query.queryKey),
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) =>
        reportUnexpectedQueryError(error, "mutation", mutation.options.mutationKey),
    }),
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        retry: shouldRetryQuery,
      },
      mutations: {
        // Writes (reviews, generation) are not idempotent; never auto-retry.
        retry: false,
      },
    },
  });
}
