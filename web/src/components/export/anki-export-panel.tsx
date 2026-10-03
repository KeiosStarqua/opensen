import { AppLink } from "@/components/app-link";
import { useState } from "react";

import { AppRoutes } from "@/lib/app-routes";
import { queryErrorMessage } from "@/lib/query/api-query";
import { useAnkiExport, type AnkiExportScope } from "@/lib/query/hooks/export";

const OUTCOME_MESSAGES = {
  downloaded: "Download started.",
  empty: "Nothing to export for this scope yet.",
} as const;

export function AnkiExportPanel() {
  const [scope, setScope] = useState<AnkiExportScope>("enrolled");
  const exportDeck = useAnkiExport();
  const loading = exportDeck.isPending;
  const message = exportDeck.data
    ? OUTCOME_MESSAGES[exportDeck.data]
    : queryErrorMessage(exportDeck.error);

  return (
    <div className="space-y-6">
      <AppLink href={AppRoutes.patterns} className="text-sm text-slate-600">
        ← Sentence patterns
      </AppLink>
      <h1 className="text-3xl font-semibold">Export to Anki</h1>
      <label className="block text-sm">
        Scope
        <select
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={scope}
          onChange={(e) => setScope(e.target.value as AnkiExportScope)}
        >
          <option value="enrolled">Enrolled chunks only</option>
          <option value="all">All chunks I own</option>
        </select>
      </label>
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
      <button
        type="button"
        disabled={loading}
        onClick={() => exportDeck.mutate(scope)}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Preparing…" : "Download Anki deck"}
      </button>
    </div>
  );
}
