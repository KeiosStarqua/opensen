import { createFileRoute } from "@tanstack/react-router";

import { SpeakingScreen } from "@/components/studio/speaking-screen";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/_shell/practice/speak")({
  head: () => ({ meta: [pageTitle("Speaking")] }),
  component: PracticeSpeakPage,
});

function PracticeSpeakPage() {
  return <SpeakingScreen />;
}
