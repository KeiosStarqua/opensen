import { createFileRoute } from "@tanstack/react-router";

import { SuccessScreen } from "@/components/studio/success-screen";
import { pageTitle } from "@/lib/page-title";
import { optionalString } from "@/lib/routing/search";

export const Route = createFileRoute("/_app/_shell/practice/done")({
  validateSearch: (search: Record<string, unknown>) => ({
    claim: optionalString(search.claim),
  }),
  head: () => ({ meta: [pageTitle("Lesson complete")] }),
  component: DonePage,
});

function DonePage() {
  const { claim } = Route.useSearch();
  return <SuccessScreen claim={claim ?? null} />;
}
