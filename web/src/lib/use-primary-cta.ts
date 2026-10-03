import { AppRoutes } from "@/lib/app-routes";
import { authClient } from "@/lib/auth/client";
import { signedInUserId } from "@/lib/auth/signed-in-user";
import { siteConfig } from "@/lib/site";
import { useOnboardingStatus } from "@/lib/query/hooks/onboarding";
import { useOnboardingComplete } from "@/lib/use-onboarding-complete";

export type PrimaryCta = {
  href: string;
  label: string;
};

export type PrimaryCtaState = {
  signedIn: boolean;
  /** Account flag or the legacy `opensen:onboarding-complete` mark. */
  onboardingComplete: boolean;
};

/**
 * Landing primary CTA.
 *
 * Signed out: Get started, current trial step (sign-in, then onboarding).
 * Signed in, onboarding open: same label, finish onboarding.
 * Signed in and finished: Open App → `/home`.
 * A signed-out visitor never keeps the Open App destination.
 */
export function resolvePrimaryCta(
  state: PrimaryCtaState,
  getStartedLabel = "Get started",
): PrimaryCta {
  if (state.signedIn && state.onboardingComplete) {
    return { href: AppRoutes.home, label: "Open App" };
  }
  if (state.signedIn) {
    return { href: AppRoutes.onboarding, label: getStartedLabel };
  }
  return { href: siteConfig.trialHref, label: getStartedLabel };
}

export function usePrimaryCta(getStartedLabel = "Get started"): PrimaryCta {
  const { data: session, isPending } = authClient.useSession();
  const signedIn = !isPending && signedInUserId(session) != null;
  const legacyComplete = useOnboardingComplete();
  const status = useOnboardingStatus();
  const accountComplete = signedIn && status.data?.complete === true;
  const onboardingComplete = signedIn && (accountComplete || legacyComplete);

  return resolvePrimaryCta({ signedIn, onboardingComplete }, getStartedLabel);
}
