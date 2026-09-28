"use client";

import { useSyncExternalStore } from "react";

import { AppRoutes } from "@/lib/app-routes";
import { ONBOARDING_COMPLETE_KEY, isOnboardingComplete } from "@/lib/onboarding-storage";
import { siteConfig } from "@/lib/site";

export type PrimaryCta = {
  href: string;
  label: string;
};

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getSnapshot(): boolean {
  return isOnboardingComplete();
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Landing-page primary CTA: returning users who already finished onboarding
 * jump straight into the app instead of being sent through onboarding again.
 *
 * Reads `localStorage` via `useSyncExternalStore` so the first client render
 * matches the SSR render (always "not done"), then corrects synchronously
 * before paint once `window` is available — no effect-driven setState.
 */
export function usePrimaryCta(getStartedLabel = "Get started"): PrimaryCta {
  const done = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (done) {
    return { href: AppRoutes.home, label: "Open App" };
  }
  return { href: siteConfig.trialHref, label: getStartedLabel };
}

// Re-exported so callers only need one import for the storage key if they
// need to react to onboarding completion elsewhere (e.g. dispatching a
// "storage" event manually after same-tab writes).
export { ONBOARDING_COMPLETE_KEY };
