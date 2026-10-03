import { createFileRoute } from "@tanstack/react-router";

import { ProfileScreen } from "@/components/studio/profile-screen";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/_shell/profile")({
  head: () => ({ meta: [pageTitle("Progress")] }),
  component: ProfilePage,
});

function ProfilePage() {
  return <ProfileScreen />;
}
