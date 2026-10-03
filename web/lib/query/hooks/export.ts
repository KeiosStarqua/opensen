"use client";

import { useMutation } from "@tanstack/react-query";

import { isOperationalApiError, resolveApiBaseUrl } from "@/lib/api/client";
import { getSessionToken } from "@/lib/api/session-token";
import { ApiError } from "@/lib/api/types";
import { captureOperationalError } from "@/lib/observability/operational-error";

export type AnkiExportScope = "enrolled" | "all";

/** `downloaded` started a file download; `empty` means the scope has no notes. */
export type AnkiExportOutcome = "downloaded" | "empty";

export const ANKI_PACKAGE_MEDIA_TYPE = "application/apkg";

export function ankiExportFilename(scope: AnkiExportScope): string {
  return `opensen-anki-${scope}.apkg`;
}

function reportExportError(error: ApiError) {
  if (!isOperationalApiError(error)) return;
  captureOperationalError(error, {
    surface: "anki-export",
    kind: error.kind,
    status: error.status,
    path: "/api/export/anki",
  });
}

function fail(error: ApiError): never {
  reportExportError(error);
  throw error;
}

/**
 * Anki package download. The response is an `.apkg` file, not JSON, so this
 * is the one raw `fetch` to the API; it still sends the session bearer.
 */
export async function downloadAnkiDeck(
  scope: AnkiExportScope,
): Promise<AnkiExportOutcome> {
  const baseUrl = resolveApiBaseUrl();
  let response: Response;
  try {
    const token = await getSessionToken();
    response = await fetch(`${baseUrl}/api/export/anki?scope=${scope}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    fail(new ApiError("network", "Network request failed"));
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
