import { createFileRoute } from "@tanstack/react-router";

import { ExploreScreen } from "@/components/studio/explore-screen";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/_shell/explore")({
  head: () => ({ meta: [pageTitle("Explore")] }),
  component: ExplorePage,
});

function ExplorePage() {
  return <ExploreScreen />;
}
