import type { DuePracticeResponse } from "@/lib/practice/types";

import type { ApiClient } from "../client";
import type { ApiResult } from "../types";

export function getPracticeDue(
  client: ApiClient,
  query?: { limit?: number; cursor?: string },
): Promise<ApiResult<DuePracticeResponse>> {
  const params = new URLSearchParams();
  if (query?.limit !== undefined) {
    params.set("limit", String(query.limit));
  }
  if (query?.cursor) {
    params.set("cursor", query.cursor);
  }
  const qs = params.toString();
  return client.request(`/api/practice/due${qs ? `?${qs}` : ""}`);
}

export function postPracticeReview(
  client: ApiClient,
  body: unknown,
): Promise<ApiResult<unknown>> {
  return client.request("/api/practice/reviews", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getPracticePlan(client: ApiClient): Promise<ApiResult<unknown>> {
  return client.request("/api/practice/plan");
}
