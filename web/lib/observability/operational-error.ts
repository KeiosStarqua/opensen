import { captureException } from "@sentry/core";

export type OperationalTags = Record<string, string | number | undefined>;

/**
 * Report a failure the UI already handled (network, 5xx, parse, auth SDK).
 * Uses `@sentry/core` so the same call works in the browser and in server
 * actions: `Sentry.init` in the Next SDK registers that client.
 * Expected user input and HTTP 4xx stay out — callers decide that first.
 */
export function captureOperationalError(
  error: unknown,
  tags: OperationalTags = {},
): void {
  const exception =
    error instanceof Error ? error : new Error("Operational error");
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(tags)) {
    if (value === undefined || value === "") continue;
    normalized[key] = String(value);
  }
  captureException(exception, { tags: normalized });
}
