import { PlaceholderSurface } from "@/components/placeholder-surface";

export const metadata = { title: "Substitution drill" };

type PageProps = { params: Promise<{ patternId: string }> };

export default async function DrillPage({ params }: PageProps) {
  const { patternId } = await params;
  return (
    <PlaceholderSurface
      title="Substitution drill"
      paramHint={`pattern id: ${patternId}`}
    />
  );
}
