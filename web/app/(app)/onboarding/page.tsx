import { OnboardingExperience } from "@/components/onboarding/onboarding-experience";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";

export const metadata = {
  title: "Start practicing",
  description:
    "Tell OpenSen what you want to speak English for and describe the conversation you need soon.",
};

export default function OnboardingPage() {
  return (
    <OnboardingGate>
      <OnboardingExperience />
    </OnboardingGate>
  );
}
