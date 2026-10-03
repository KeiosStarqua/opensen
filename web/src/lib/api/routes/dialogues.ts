import type { ApiClient } from "../client";
import type { ApiResult } from "../types";

export function listDialogues(client: ApiClient): Promise<ApiResult<unknown>> {
  return client.request("/api/dialogues");
}

export function getDialogue(
  client: ApiClient,
  id: string,
): Promise<ApiResult<unknown>> {
  return client.request(`/api/dialogues/${encodeURIComponent(id)}`);
}

export function generateDialogue(
  client: ApiClient,
  body: unknown,
): Promise<ApiResult<unknown>> {
  return client.request("/api/dialogues/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
