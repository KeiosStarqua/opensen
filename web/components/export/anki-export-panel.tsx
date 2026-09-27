"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppRoutes } from "@/lib/app-routes";
import {
  createBrowserStorage,
  createDefaultApiClient,
  resolveApiBaseUrl,
} from "@/lib/api/client";
import { getOrCreateLearnerId } from "@/lib/api/learner-id";

type Scope = "enrolled" | "all";

export function AnkiExportPanel() {
  useMemo(() => createDefaultApiClient(), []);
  const [scope, setScope] = useState<Scope>("enrolled");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function download() {
    setLoading(true);
    setMessage(null);
    const baseUrl = resolveApiBaseUrl();
    const userId = getOrCreateLearnerId(createBrowserStorage());
    const response = await fetch(`${baseUrl}/api/export/anki?scope=${scope}`, {
      headers: { "X-User-Id": userId },
    });
    setLoading(false);
    if (!response.ok) {
      setMessage(`Export failed (${response.status}).`);
      return;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = (await response.json()) as {
        empty?: boolean;
        noteCount?: number;
      };
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
