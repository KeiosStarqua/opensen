import type { ApiClient } from "../client";
import type { ApiResult } from "../types";

export type SituationListResponse = {
  items: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    roleSelf: string;
    roleOther: string;
    goal: string;
    tone: string;
  }>;
  nextCursor: string | null;
};

export function listSituations(
  client: ApiClient,
  query?: { limit?: number; cursor?: string },
): Promise<ApiResult<SituationListResponse>> {
  const params = new URLSearchParams();
  if (query?.limit !== undefined) params.set("limit", String(query.limit));
  if (query?.cursor) params.set("cursor", query.cursor);
  const qs = params.toString();
  return client.request(`/api/situations${qs ? `?${qs}` : ""}`);
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
