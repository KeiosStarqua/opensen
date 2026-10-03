import type { ApiClient } from "../client";
import type { ApiResult } from "../types";

export function getAnkiExport(client: ApiClient): Promise<ApiResult<unknown>> {
  return client.request("/api/export/anki");
}
