import { createFileRoute } from "@tanstack/react-router";

import { HomeScreen } from "@/components/studio/home-screen";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/_shell/home")({
  head: () => ({ meta: [pageTitle("Home")] }),
  component: HomePage,
});

function HomePage() {
  return <HomeScreen />;
}
