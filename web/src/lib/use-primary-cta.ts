import { AppRoutes } from "@/lib/app-routes";
import { siteConfig } from "@/lib/site";
import { useOnboardingStatus } from "@/lib/query/hooks/onboarding";

export type PrimaryCta = {
  href: string;
  label: string;
};

/**
 * Landing-page primary CTA. A signed-in learner who already finished
 * onboarding on this account opens the app. Everyone else starts onboarding.
 */
export function usePrimaryCta(getStartedLabel = "Get started"): PrimaryCta {
  const status = useOnboardingStatus();

  if (status.data?.complete) {
    return { href: AppRoutes.home, label: "Open App" };
  }
  return { href: siteConfig.trialHref, label: getStartedLabel };
}
