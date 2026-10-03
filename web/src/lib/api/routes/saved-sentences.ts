import type { ApiClient } from "../client";
import type { ApiResult } from "../types";

export type SavedSentence = {
  id: string;
  text: string;
  createdAt: string;
};

export function listSavedSentences(
  client: ApiClient,
): Promise<ApiResult<{ items: SavedSentence[] }>> {
  return client.request("/api/saved-sentences");
}

export function getSavedSentence(
  client: ApiClient,
  id: string,
): Promise<ApiResult<SavedSentence>> {
  return client.request(`/api/saved-sentences/${encodeURIComponent(id)}`);
}

export function createSavedSentence(
  client: ApiClient,
  text: string,
): Promise<ApiResult<SavedSentence>> {
  return client.request("/api/saved-sentences", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function deleteSavedSentence(
  client: ApiClient,
  id: string,
): Promise<ApiResult<void>> {
  return client.request(`/api/saved-sentences/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
