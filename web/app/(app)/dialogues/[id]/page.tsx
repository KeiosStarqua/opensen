import { PlaceholderSurface } from "@/components/placeholder-surface";

export const metadata = { title: "Dialogue" };

type PageProps = { params: Promise<{ id: string }> };

export default async function DialoguePage({ params }: PageProps) {
  const { id } = await params;
  return (
    <PlaceholderSurface
      title="Dialogue"
      paramHint={`dialogue id: ${id}`}
    />
  );
}
