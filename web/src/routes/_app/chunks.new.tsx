import { createFileRoute } from "@tanstack/react-router";

import { ChunkCreateForm } from "@/components/chunks/chunk-create-form";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/chunks/new")({
  head: () => ({ meta: [pageTitle("New chunk")] }),
  component: ChunksNewPage,
});

function ChunksNewPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <ChunkCreateForm />
    </div>
  );
}
