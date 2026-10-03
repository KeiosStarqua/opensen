import { createFileRoute } from "@tanstack/react-router";

import { SettingsForm } from "@/components/settings/settings-form";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [pageTitle("Settings")] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <SettingsForm />
    </div>
  );
}
