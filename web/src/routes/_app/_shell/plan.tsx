import { createFileRoute } from "@tanstack/react-router";

import { PracticePlanView } from "@/components/plan/practice-plan-view";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/_shell/plan")({
  head: () => ({ meta: [pageTitle("Plan")] }),
  component: PlanPage,
});

function PlanPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <PracticePlanView />
    </div>
  );
}
