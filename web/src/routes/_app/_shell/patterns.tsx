import { createFileRoute } from "@tanstack/react-router";

import { ChunkLibrary } from "@/components/chunks/chunk-library";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/_shell/patterns")({
  head: () => ({ meta: [pageTitle("Sentence patterns")] }),
  component: PatternsPage,
});

function PatternsPage() {
  return (
    <div className="mx-auto max-w-3xl px-2 py-6">
      <ChunkLibrary />
    </div>
  );
}
