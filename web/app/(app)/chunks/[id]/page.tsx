import { PlaceholderSurface } from "@/components/placeholder-surface";

export const metadata = { title: "Chunk detail" };

type PageProps = { params: Promise<{ id: string }> };

export default async function ChunkDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <PlaceholderSurface
      title="Chunk detail"
      paramHint={`chunk id: ${id}`}
    />
  );
}
