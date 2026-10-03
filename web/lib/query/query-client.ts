import { QueryClient } from "@tanstack/react-query";

import { shouldRetryQuery } from "./api-query";

/** Data younger than this is served from cache without a background refetch. */
export const DEFAULT_STALE_TIME_MS = 30_000;

/**
 * One client per mounted `QueryProvider`. The provider lives in the `(app)`
 * layout, so leaving the signed-in app (sign-out redirects to `/auth/*`)
 * drops the cache and the next learner starts empty.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
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
