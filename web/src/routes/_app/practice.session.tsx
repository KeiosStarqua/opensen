import { createFileRoute } from "@tanstack/react-router";

import { PracticeSession } from "@/components/practice/practice-session";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/practice/session")({
  head: () => ({ meta: [pageTitle("Practice session")] }),
  component: PracticeSessionPage,
});

function PracticeSessionPage() {
  return <PracticeSession />;
}
