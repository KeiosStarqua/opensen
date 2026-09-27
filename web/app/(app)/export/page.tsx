import { AnkiExportPanel } from "@/components/export/anki-export-panel";

export const metadata = { title: "Export" };

export default function ExportPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <AnkiExportPanel />
    </div>
  );
}
