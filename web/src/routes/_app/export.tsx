import { createFileRoute } from "@tanstack/react-router";

import { AnkiExportPanel } from "@/components/export/anki-export-panel";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/export")({
  head: () => ({ meta: [pageTitle("Export")] }),
  component: ExportPage,
});

function ExportPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <AnkiExportPanel />
    </div>
  );
}
