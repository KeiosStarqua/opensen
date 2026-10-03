"use client";

import { useSyncExternalStore } from "react";

import { isOnboardingComplete } from "@/lib/onboarding-storage";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Whether this browser already finished onboarding.
 *
 * `useSyncExternalStore` keeps the first client render aligned with SSR
 * (always not done), then corrects synchronously before paint.
 */
export function useOnboardingComplete(): boolean {
  return useSyncExternalStore(subscribe, isOnboardingComplete, getServerSnapshot);
}
