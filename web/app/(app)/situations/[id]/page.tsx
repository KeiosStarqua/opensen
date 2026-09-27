import { PlaceholderSurface } from "@/components/placeholder-surface";

export const metadata = { title: "Situation detail" };

type PageProps = { params: Promise<{ id: string }> };

export default async function SituationDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <PlaceholderSurface
      title="Situation detail"
      paramHint={`situation id: ${id}`}
    />
  );
}
