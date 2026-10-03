"use client";

import { AppRoutes } from "@/lib/app-routes";
import { ONBOARDING_COMPLETE_KEY } from "@/lib/onboarding-storage";
import { siteConfig } from "@/lib/site";
import { useOnboardingComplete } from "@/lib/use-onboarding-complete";

export type PrimaryCta = {
  href: string;
  label: string;
};

/**
 * Landing-page primary CTA: returning users who already finished onboarding
 * jump straight into the app instead of being sent through onboarding again.
 */
export function usePrimaryCta(getStartedLabel = "Get started"): PrimaryCta {
  const done = useOnboardingComplete();

  if (done) {
    return { href: AppRoutes.home, label: "Open App" };
  }
  return { href: siteConfig.trialHref, label: getStartedLabel };
}

// Re-exported so callers only need one import for the storage key if they
// need to react to onboarding completion elsewhere (e.g. dispatching a
// "storage" event manually after same-tab writes).
export { ONBOARDING_COMPLETE_KEY };
