import type { ApiClient } from "../client";
import type { ApiResult } from "../types";

export function listSituations(client: ApiClient): Promise<ApiResult<unknown>> {
  return client.request("/api/situations");
}

export function getSituation(
  client: ApiClient,
  id: string,
): Promise<ApiResult<unknown>> {
  return client.request(`/api/situations/${encodeURIComponent(id)}`);
}

export function getSituationIntents(
  client: ApiClient,
  id: string,
): Promise<ApiResult<unknown>> {
  return client.request(
    `/api/situations/${encodeURIComponent(id)}/intents`,
  );
}
