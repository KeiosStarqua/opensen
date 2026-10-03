import { createFileRoute } from "@tanstack/react-router";

import { OnboardingExperience } from "@/components/onboarding/onboarding-experience";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/onboarding")({
  head: () => ({
    meta: [
      pageTitle("Start practicing"),
      {
        name: "description",
        content:
          "Tell OpenSen what you want to speak English for and describe the conversation you need soon.",
      },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <div className="font-studio min-h-full bg-sen-cream text-sen-ink">
      <OnboardingGate>
        <OnboardingExperience />
      </OnboardingGate>
    </div>
  );
}
