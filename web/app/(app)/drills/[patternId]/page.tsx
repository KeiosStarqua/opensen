import { SubstitutionDrillSession } from "@/components/drills/substitution-drill-session";

export const metadata = { title: "Substitution drill" };

type PageProps = { params: Promise<{ patternId: string }> };

export default async function DrillPage({ params }: PageProps) {
  const { patternId } = await params;
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <SubstitutionDrillSession patternId={patternId} />
    </div>
  );
}
