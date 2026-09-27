import type { ApiClient } from "../client";
import type { ApiResult } from "../types";

export function listChunks(client: ApiClient): Promise<ApiResult<unknown>> {
  return client.request("/api/chunks");
}

export function getChunk(
  client: ApiClient,
  id: string,
): Promise<ApiResult<unknown>> {
  return client.request(`/api/chunks/${encodeURIComponent(id)}`);
}

export function getChunkPatterns(
  client: ApiClient,
  id: string,
): Promise<ApiResult<unknown>> {
  return client.request(`/api/chunks/${encodeURIComponent(id)}/patterns`);
}
