import { createFileRoute } from "@tanstack/react-router";

import { SituationDetail } from "@/components/situations/situation-detail";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/situations/$id/")({
  head: () => ({ meta: [pageTitle("Situation detail")] }),
  component: SituationDetailPage,
});

function SituationDetailPage() {
  const { id } = Route.useParams();
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <SituationDetail situationId={id} />
    </div>
  );
}
