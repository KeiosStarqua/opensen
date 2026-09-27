"use client";

import Link from "next/link";
import { useState } from "react";

import { AppRoutes } from "@/lib/app-routes";
import {
  createBrowserStorage,
  formatApiErrorMessage,
  isOperationalApiError,
  resolveApiBaseUrl,
} from "@/lib/api/client";
import { getOrCreateLearnerId } from "@/lib/api/learner-id";
import { ApiError } from "@/lib/api/types";
import { captureOperationalError } from "@/lib/observability/operational-error";

type Scope = "enrolled" | "all";

export function AnkiExportPanel() {
  const [scope, setScope] = useState<Scope>("enrolled");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reportExportError(error: ApiError) {
    if (!isOperationalApiError(error)) return;
    captureOperationalError(error, {
      surface: "anki-export",
      kind: error.kind,
      status: error.status,
      path: "/api/export/anki",
    });
  }

  async function download() {
    setLoading(true);
    setMessage(null);
    const baseUrl = resolveApiBaseUrl();
    const userId = getOrCreateLearnerId(createBrowserStorage());
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/api/export/anki?scope=${scope}`, {
        headers: { "X-User-Id": userId },
      });
    } catch {
      const error = new ApiError("network", "Network request failed");
      reportExportError(error);
      setLoading(false);
      setMessage(formatApiErrorMessage(error));
      return;
    }
    setLoading(false);
    if (!response.ok) {
      const error = new ApiError(
        "http",
        `Export failed (${response.status}).`,
        response.status,
      );
      reportExportError(error);
      setMessage(formatApiErrorMessage(error));
      return;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      let json: { empty?: boolean; noteCount?: number };
      try {
        json = (await response.json()) as {
          empty?: boolean;
          noteCount?: number;
        };
      } catch {
        const error = new ApiError(
          "parse",
          "Response was not valid JSON",
          response.status,
        );
        reportExportError(error);
        setMessage(formatApiErrorMessage(error));
        return;
      }
      if (json.empty) {
        setMessage("Nothing to export for this scope yet.");
        return;
      }
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `opensen-anki-${scope}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Download started.");
  }

  return (
    <div className="space-y-6">
      <Link href={AppRoutes.patterns} className="text-sm text-slate-600">
        ← Sentence patterns
      </Link>
      <h1 className="text-3xl font-semibold">Export to Anki</h1>
      <label className="block text-sm">
        Scope
        <select
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={scope}
          onChange={(e) => setScope(e.target.value as Scope)}
        >
          <option value="enrolled">Enrolled chunks only</option>
          <option value="all">All chunks I own</option>
        </select>
      </label>
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
      <button
        type="button"
        disabled={loading}
        onClick={() => void download()}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Preparing…" : "Download Anki deck"}
      </button>
    </div>
  );
}
