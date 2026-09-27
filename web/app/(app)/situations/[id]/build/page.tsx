import { PlaceholderSurface } from "@/components/placeholder-surface";

export const metadata = { title: "Build dialogue" };

type PageProps = { params: Promise<{ id: string }> };

export default async function BuildDialoguePage({ params }: PageProps) {
  const { id } = await params;
  return (
    <PlaceholderSurface
      title="Build dialogue"
      description="Dialog Builder for this situation will ship in a follow-up issue."
      paramHint={`situation id: ${id}`}
    />
  );
}
