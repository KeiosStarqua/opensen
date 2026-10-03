import { createFileRoute } from "@tanstack/react-router";

import { LearnScreen } from "@/components/studio/learn-screen";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/_shell/learn/")({
  head: () => ({ meta: [pageTitle("At the Airport")] }),
  component: LearnIndexPage,
});

function LearnIndexPage() {
  return <LearnScreen topicId="travel" />;
}
