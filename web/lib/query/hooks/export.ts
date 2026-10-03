"use client";

import { useMutation } from "@tanstack/react-query";

import { reportApiError, resolveApiBaseUrl } from "@/lib/api/client";
import { describeBearer } from "@/lib/api/error-report";
import { getSessionToken } from "@/lib/api/session-token";
import { ApiError } from "@/lib/api/types";

export type AnkiExportScope = "enrolled" | "all";

/** `downloaded` started a file download; `empty` means the scope has no notes. */
export type AnkiExportOutcome = "downloaded" | "empty";

export const ANKI_PACKAGE_MEDIA_TYPE = "application/apkg";

export function ankiExportFilename(scope: AnkiExportScope): string {
  return `opensen-anki-${scope}.apkg`;
}

const EXPORT_PATH = "/api/export/anki";

/**
 * Anki package download. The response is an `.apkg` file, not JSON, so this
 * is the one raw `fetch` to the API; it still sends the session bearer and
 * reports every failure through `reportApiError`, like `createDefaultApiClient`.
 */
export async function downloadAnkiDeck(
  scope: AnkiExportScope,
): Promise<AnkiExportOutcome> {
  const baseUrl = resolveApiBaseUrl();
  const path = `${EXPORT_PATH}?scope=${scope}`;
  let token: string | null = null;

  function fail(error: ApiError): never {
    error.bearer = describeBearer(token);
    reportApiError(error, path, baseUrl);
    throw error;
  }

  let response: Response;
  try {
    token = await getSessionToken();
    response = await fetch(`${baseUrl}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (caught) {
    const error = new ApiError("network", "Network request failed");
    if (caught instanceof Error) {
      error.causeName = caught.name;
      error.causeMessage = caught.message;
    }
    fail(error);
  }
  if (!response.ok) {
    fail(
      new ApiError("http", `Export failed (${response.status}).`, response.status),
    );
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    let json: { empty?: boolean; noteCount?: number };
    try {
      json = (await response.json()) as { empty?: boolean; noteCount?: number };
    } catch {
      fail(new ApiError("parse", "Response was not valid JSON", response.status));
    }
    if (json.empty) {
      return "empty";
    }
  }
  const blob = new Blob([await response.arrayBuffer()], {
    type: ANKI_PACKAGE_MEDIA_TYPE,
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = ankiExportFilename(scope);
  anchor.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}

export function useAnkiExport() {
  return useMutation({ mutationFn: downloadAnkiDeck });
}
