import { createFileRoute } from "@tanstack/react-router";

import { WordOrderScreen } from "@/components/studio/word-order-screen";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/_shell/practice/")({
  head: () => ({ meta: [pageTitle("Practice")] }),
  component: PracticeIndexPage,
});

function PracticeIndexPage() {
  return <WordOrderScreen />;
}
