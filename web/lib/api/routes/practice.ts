import type { ApiClient } from "../client";
import type { ApiResult } from "../types";

export function getPracticeDue(client: ApiClient): Promise<ApiResult<unknown>> {
  return client.request("/api/practice/due");
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
