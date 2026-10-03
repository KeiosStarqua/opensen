import { createFileRoute } from "@tanstack/react-router";

import { ChunkDetailView } from "@/components/chunks/chunk-detail";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/chunks/$id")({
  head: () => ({ meta: [pageTitle("Chunk detail")] }),
  component: ChunkDetailPage,
});

function ChunkDetailPage() {
  const { id } = Route.useParams();
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <ChunkDetailView chunkId={id} />
    </div>
  );
}
