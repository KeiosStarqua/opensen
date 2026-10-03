import { formatApiErrorMessage, isRetryable } from "@/lib/api/client";
import { ApiError, type ApiResult } from "@/lib/api/types";

/** Max automatic retries for a query whose failure is retryable (network, 5xx except 501). */
export const MAX_QUERY_RETRIES = 2;

/**
 * Adapts the API client's `ApiResult` to TanStack Query, which expects a
 * resolved value or a thrown error. Failures throw the original `ApiError`.
 */
export async function unwrapApiResult<T>(
  pending: Promise<ApiResult<T>>,
): Promise<T> {
  const result = await pending;
  if (!result.ok) {
    throw result.error;
  }
  return result.data;
}

/** Query retry policy: retry transient failures only, never 4xx or parse errors. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }
  return failureCount < MAX_QUERY_RETRIES && isRetryable(error);
}

/** Learner-facing message for a query or mutation error; null when there is none. */
export function queryErrorMessage(error: unknown): string | null {
  if (error === null || error === undefined) {
    return null;
  }
  if (error instanceof ApiError) {
    return formatApiErrorMessage(error);
  }
  return "Something went wrong.";
}

/** HTTP status of a query or mutation error, when it came from the API. */
export function queryErrorStatus(error: unknown): number | undefined {
  return error instanceof ApiError ? error.status : undefined;
}
