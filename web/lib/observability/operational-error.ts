import { captureException } from "@sentry/core";

export type OperationalTags = Record<string, string | number | undefined>;

/**
 * Sentry severity for a handled failure. `error` is something broken on our
 * side (network, 5xx, parse, auth SDK, unexpected throw). `warning` is a
 * learner-visible message caused by the request or the setup (HTTP 4xx,
 * empty form field, missing persistence, speech or storage refusal).
 */
export type OperationalLevel = "error" | "warning";

function normalizeTags(
  tags: OperationalTags,
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(tags)) {
    if (value === undefined || value === "") continue;
    normalized[key] = String(value);
  }
  return normalized;
}

/**
 * Report a failure the UI already handled. Uses `@sentry/core` so the same
 * call works in the browser and in server actions: `Sentry.init` in the Next
 * SDK registers that client. Every red message a learner sees goes through
 * here exactly once; pick `warning` for failures caused by input or setup.
 */
export function captureOperationalError(
  error: unknown,
  tags: OperationalTags = {},
  extra: OperationalTags = {},
  level: OperationalLevel = "error",
): void {
  const exception =
    error instanceof Error ? error : new Error("Operational error");
  const normalizedExtra = normalizeTags(extra);
  captureException(exception, {
    level,
    tags: normalizeTags(tags),
    ...(Object.keys(normalizedExtra).length > 0
      ? { extra: normalizedExtra }
      : {}),
  });
}
