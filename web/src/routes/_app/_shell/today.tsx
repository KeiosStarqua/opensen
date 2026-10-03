import { createFileRoute } from "@tanstack/react-router";

import { TodayDashboard } from "@/components/today/today-dashboard";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/_shell/today")({
  head: () => ({ meta: [pageTitle("Today")] }),
  component: TodayPage,
});

function TodayPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <TodayDashboard />
    </div>
  );
}
