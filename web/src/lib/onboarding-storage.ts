import { AppRoutes } from "@/lib/app-routes";

export const ONBOARDING_COMPLETE_KEY = "opensen:onboarding-complete";

/** Same-tab listeners. The `storage` event only fires in other tabs. */
export const ONBOARDING_COMPLETE_EVENT = "opensen:onboarding-complete-change";

function notifyOnboardingStorage(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ONBOARDING_COMPLETE_EVENT));
}

/**
 * Legacy browser flag from before completion lived on the account.
 * Still read once so an already-finished browser can be copied onto
 * `users.onboarding_completed_at`. New completions go through the API.
 */

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
  notifyOnboardingStorage();
}

export function clearOnboardingComplete(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
  notifyOnboardingStorage();
}
