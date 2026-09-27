import type { ApiClient } from "../client";
import type { ApiResult } from "../types";

export function listChunks(
  client: ApiClient,
  query?: { q?: string; register?: string; limit?: number },
): Promise<ApiResult<unknown>> {
  const params = new URLSearchParams();
  if (query?.q) params.set("q", query.q);
  if (query?.register) params.set("register", query.register);
  if (query?.limit !== undefined) params.set("limit", String(query.limit));
  const qs = params.toString();
  return client.request(`/api/chunks${qs ? `?${qs}` : ""}`);
}

export function getChunk(
  client: ApiClient,
  id: string,
): Promise<ApiResult<unknown>> {
  return client.request(`/api/chunks/${encodeURIComponent(id)}`);
}

export function getPatternById(
  client: ApiClient,
  patternId: string,
): Promise<ApiResult<unknown>> {
  return client.request(
    `/api/chunks/patterns/${encodeURIComponent(patternId)}`,
  );
}

export function getChunkPatterns(
  client: ApiClient,
  id: string,
): Promise<ApiResult<unknown>> {
  return client.request(`/api/chunks/${encodeURIComponent(id)}/patterns`);
}

export function createChunk(
  client: ApiClient,
  body: unknown,
): Promise<ApiResult<unknown>> {
  return client.request("/api/chunks", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateChunk(
  client: ApiClient,
  id: string,
  body: unknown,
): Promise<ApiResult<unknown>> {
  return client.request(`/api/chunks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
