import { ChunkDetailView } from "@/components/chunks/chunk-detail";

export const metadata = { title: "Chunk detail" };

type PageProps = { params: Promise<{ id: string }> };

export default async function ChunkDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <ChunkDetailView chunkId={id} />
    </div>
  );
}
