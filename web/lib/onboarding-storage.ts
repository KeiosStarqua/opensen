import { AppRoutes } from "@/lib/app-routes";

export const ONBOARDING_COMPLETE_KEY = "opensen:onboarding-complete";

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "true";
}

/** Completed learners skip the wizard and land in the app. */
export function onboardingEntryHref(complete: boolean): string | null {
  return complete ? AppRoutes.home : null;
}

export function markOnboardingComplete(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
}
