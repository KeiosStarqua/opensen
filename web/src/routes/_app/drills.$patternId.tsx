import { createFileRoute } from "@tanstack/react-router";

import { SubstitutionDrillSession } from "@/components/drills/substitution-drill-session";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/drills/$patternId")({
  head: () => ({ meta: [pageTitle("Substitution drill")] }),
  component: DrillPage,
});

function DrillPage() {
  const { patternId } = Route.useParams();
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <SubstitutionDrillSession patternId={patternId} />
    </div>
  );
}
