import {
  formatApiErrorMessage,
  isOperationalApiError,
} from "@/lib/api/client";
import { apiErrorSentryFields } from "@/lib/api/error-report";
import type { ApiError } from "@/lib/api/types";

import { captureOperationalError } from "@/lib/observability/operational-error";

/**
 * Learner-visible `/situations` banner. Network, parse, and HTTP >= 500 are
 * already reported by `createDefaultApiClient`. HTTP 4xx (including 401 from
 * a non-JWT session token) is reported here so the banner is not the only
 * record. The token value is never attached.
 */
export function reportSituationsCatalogError(error: ApiError): void {
  if (isOperationalApiError(error)) return;
  const fields = apiErrorSentryFields(error);
  captureOperationalError(
    error,
    {
      surface: "situations-catalog",
      path: "/api/situations",
      ...fields.tags,
    },
    {
      ...fields.extra,
      uiMessage: formatApiErrorMessage(error),
    },
  );
}
